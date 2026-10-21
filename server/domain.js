import { randomUUID } from "node:crypto";
import { dateKey } from "./seed.js";
import { permissions, hashPassword } from "./security.js";
export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
const fail = (m, status) => {
  throw new AppError(m, status);
};
export const str = (v, name, max = 160) => {
  if (typeof v !== "string" || !v.trim() || v.trim().length > max)
    fail(`${name} is required (maximum ${max} characters).`);
  return v.trim();
};
const number = (v, name, min = 0, max = 100000000) => {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max)
    fail(`${name} must be between ${min} and ${max}.`);
  return v;
};
const integer = (v, n, min = 0, max = 1000000) => {
  number(v, n, min, max);
  if (!Number.isSafeInteger(v)) fail(`${n} must be a whole number.`);
  return v;
};
const money = (v, n = "Amount") => integer(v, n, 0, 1000000000);
const email = (v) => {
  const s = str(v, "Email", 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
    fail("Enter a valid email address.");
  return s;
};
const date = (v) => {
  const d = str(v, "Date", 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(d) ||
    !Number.isFinite(Date.parse(d)) ||
    new Date(d).toISOString().slice(0, 10) !== d
  )
    fail("Enter a valid date.");
  return d;
};
const item = (s, table, id) =>
  s[table].find((x) => x.id === id) || fail("Record not found.", 404);
const unique = (s, table, key, value, id) => {
  if (s[table].some((x) => x[key] === value && x.id !== id))
    fail(`${key} already exists.`, 409);
};
const id = () => randomUUID();
const allow = (user, module) => {
  if (!permissions[user.role]?.includes(module))
    fail("Your role does not have permission for this action.", 403);
};
const ref = (prefix, rows) =>
  `${prefix}-${String(rows.length + 1).padStart(4, "0")}`;
const audit = (s, u, action, detail) =>
  s.audit.unshift({
    id: id(),
    date: new Date().toISOString(),
    actor: u.name,
    action,
    detail,
  });
const movement = (s, u, p, qty, type, reference) =>
  s.movements.push({
    id: id(),
    productId: p.id,
    quantity: qty,
    type,
    date: dateKey(),
    reference,
    by: u.name,
  });
function lines(s, rows, type) {
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 50)
    fail("Add between 1 and 50 line items.");
  const seen = new Set();
  return rows.map((row) => {
    const p = item(s, "products", row.productId);
    if (!p.active) fail("An archived product cannot be ordered.");
    if (seen.has(p.id)) fail("Combine duplicate products into one line.");
    seen.add(p.id);
    const quantity = integer(row.quantity, "Quantity", 1, 10000);
    return {
      productId: p.id,
      name: p.name,
      sku: p.sku,
      quantity,
      ...(type === "sale"
        ? { price: p.price, cost: p.cost }
        : { cost: money(row.cost, "Unit cost") }),
    };
  });
}
export function command(s, user, action, b) {
  let out;
  switch (action) {
    case "product.save": {
      allow(user, "inventory");
      if (user.role === "staff")
        fail("Only an owner or manager can edit products.", 403);
      const existing = b.id ? item(s, "products", b.id) : null;
      const sku = str(b.sku, "SKU", 40).toUpperCase();
      unique(s, "products", "sku", sku, b.id);
      out = {
        id: existing?.id || id(),
        sku,
        name: str(b.name, "Product name"),
        category: str(b.category, "Category", 60),
        price: money(b.price, "Selling price"),
        cost: money(b.cost, "Cost price"),
        reorder: integer(b.reorder, "Reorder level"),
        stock: existing?.stock ?? integer(b.stock, "Opening stock"),
        active: existing?.active ?? true,
      };
      if (existing) Object.assign(existing, out);
      else {
        s.products.push(out);
        movement(s, user, out, out.stock, "opening", "Opening stock");
      }
      break;
    }
    case "stock.adjust": {
      allow(user, "inventory");
      if (user.role === "staff")
        fail("Only an owner or manager can adjust stock.", 403);
      const p = item(s, "products", b.id),
        q = integer(b.quantity, "Adjustment", -100000, 100000);
      if (q === 0) fail("Adjustment cannot be zero.");
      const reason = str(b.reason, "Reason");
      if (p.stock + q < 0) fail("Stock cannot become negative.");
      p.stock += q;
      movement(s, user, p, q, "adjustment", reason);
      out = p;
      break;
    }
    case "order.create": {
      allow(user, "sales");
      const ls = lines(s, b.lines, "sale");
      const subtotal = ls.reduce((a, l) => a + l.quantity * l.price, 0);
      const taxRate = number(b.taxRate ?? 18, "Tax rate", 0, 28);
      const tax = Math.round((subtotal * taxRate) / 100);
      money(subtotal + tax, "Order total");
      out = {
        id: id(),
        number: ref("INV", s.orders),
        customer: str(b.customer, "Customer"),
        email: b.email ? email(b.email) : "",
        date: dateKey(),
        lines: ls,
        subtotal,
        taxRate,
        tax,
        total: subtotal + tax,
        status: "draft",
        createdBy: user.id,
      };
      s.orders.push(out);
      break;
    }
    case "order.confirm": {
      allow(user, "sales");
      out = item(s, "orders", b.id);
      if (out.status !== "draft")
        fail("Only draft orders can be confirmed.", 409);
      for (const l of out.lines) {
        const p = item(s, "products", l.productId);
        if (p.stock < l.quantity)
          fail(`Insufficient stock for ${p.name}. Available: ${p.stock}.`, 409);
      }
      for (const l of out.lines) {
        const p = item(s, "products", l.productId);
        p.stock -= l.quantity;
        movement(s, user, p, -l.quantity, "sale", out.number);
      }
      out.status = "confirmed";
      break;
    }
    case "order.pay": {
      if (
        !permissions[user.role].includes("sales") &&
        !permissions[user.role].includes("finance")
      )
        fail("Access denied.", 403);
      out = item(s, "orders", b.id);
      if (out.status !== "confirmed")
        fail("Only confirmed orders can be marked paid.", 409);
      out.status = "paid";
      out.paidDate = dateKey();
      break;
    }
    case "order.cancel": {
      allow(user, "sales");
      out = item(s, "orders", b.id);
      if (!["draft", "confirmed"].includes(out.status))
        fail("This order cannot be cancelled.", 409);
      if (out.status === "confirmed")
        for (const l of out.lines) {
          const p = item(s, "products", l.productId);
          p.stock += l.quantity;
          movement(s, user, p, l.quantity, "return", out.number);
        }
      out.status = "cancelled";
      break;
    }
    case "vendor.save": {
      allow(user, "procurement");
      const old = b.id ? item(s, "vendors", b.id) : null;
      out = {
        id: old?.id || id(),
        name: str(b.name, "Vendor"),
        email: email(b.email),
        phone: str(b.phone, "Phone", 30),
        city: str(b.city, "City", 80),
      };
      old ? Object.assign(old, out) : s.vendors.push(out);
      break;
    }
    case "purchase.create": {
      allow(user, "procurement");
      item(s, "vendors", b.vendorId);
      const ls = lines(s, b.lines, "purchase"),
        total = ls.reduce((a, l) => a + l.quantity * l.cost, 0);
      money(total, "Purchase total");
      out = {
        id: id(),
        number: ref("PO", s.purchases),
        vendorId: b.vendorId,
        date: dateKey(),
        expected: date(b.expected),
        lines: ls,
        total,
        status: "pending",
        createdBy: user.id,
      };
      s.purchases.push(out);
      break;
    }
    case "purchase.approve": {
      allow(user, "procurement");
      out = item(s, "purchases", b.id);
      if (out.status !== "pending")
        fail("Only pending purchase orders can be approved.", 409);
      out.status = "approved";
      out.approvedBy = user.id;
      break;
    }
    case "purchase.receive": {
      allow(user, "procurement");
      out = item(s, "purchases", b.id);
      if (out.status !== "approved")
        fail("Approve this purchase order before receiving it.", 409);
      for (const l of out.lines) {
        const p = item(s, "products", l.productId);
        if (p.stock + l.quantity > 1000000) fail("Stock limit exceeded.");
        p.stock += l.quantity;
        p.cost = l.cost;
        movement(s, user, p, l.quantity, "purchase", out.number);
      }
      out.status = "received";
      out.receivedDate = dateKey();
      s.expenses.push({
        id: id(),
        date: dateKey(),
        category: "Procurement",
        description: `${out.number} · ${item(s, "vendors", out.vendorId).name}`,
        amount: out.total,
        status: "unpaid",
        source: out.id,
      });
      break;
    }
    case "purchase.cancel": {
      allow(user, "procurement");
      out = item(s, "purchases", b.id);
      if (!["pending", "approved"].includes(out.status))
        fail("This purchase order cannot be cancelled.", 409);
      out.status = "cancelled";
      break;
    }
    case "employee.save": {
      allow(user, "hr");
      const old = b.id ? item(s, "employees", b.id) : null;
      const code = str(b.code, "Employee code", 30).toUpperCase();
      unique(s, "employees", "code", code, b.id);
      out = {
        id: old?.id || id(),
        code,
        name: str(b.name, "Name"),
        email: email(b.email),
        department: str(b.department, "Department", 60),
        designation: str(b.designation, "Designation", 80),
        salary: money(b.salary, "Monthly salary"),
        joined: date(b.joined),
        active: typeof b.active === "boolean" ? b.active : true,
      };
      old ? Object.assign(old, out) : s.employees.push(out);
      break;
    }
    case "attendance.save": {
      allow(user, "hr");
      const e = item(s, "employees", b.employeeId);
      if (!e.active) fail("Employee is inactive.");
      const d = date(b.date);
      if (d > dateKey())
        fail("Attendance cannot be recorded for a future date.");
      if (!["Present", "Absent", "Leave"].includes(b.status))
        fail("Invalid attendance status.");
      out = s.attendance.find((a) => a.employeeId === e.id && a.date === d);
      if (out) out.status = b.status;
      else {
        out = { id: id(), employeeId: e.id, date: d, status: b.status };
        s.attendance.push(out);
      }
      break;
    }
    case "payroll.run": {
      allow(user, "hr");
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(b.month || ""))
        fail("Enter a valid payroll month.");
      if (b.month > dateKey().slice(0, 7))
        fail("Future payroll is not supported.");
      let count = 0;
      for (const e of s.employees.filter(
        (e) => e.active && e.joined.slice(0, 7) <= b.month,
      )) {
        if (s.payroll.some((p) => p.employeeId === e.id && p.month === b.month))
          continue;
        const p = {
          id: id(),
          employeeId: e.id,
          month: b.month,
          amount: e.salary,
          date: dateKey(),
        };
        s.payroll.push(p);
        s.expenses.push({
          id: id(),
          date: dateKey(),
          category: "Payroll",
          description: `${e.name} · ${b.month}`,
          amount: e.salary,
          status: "unpaid",
          source: p.id,
        });
        count++;
      }
      if (!count)
        fail(
          "Payroll already exists for all eligible employees in this month.",
          409,
        );
      out = { count };
      break;
    }
    case "expense.create": {
      allow(user, "finance");
      const d = date(b.date);
      if (d > dateKey()) fail("Expense date cannot be in the future.");
      const amount = money(b.amount);
      if (!amount) fail("Expense amount must be greater than zero.");
      out = {
        id: id(),
        date: d,
        category: str(b.category, "Category", 60),
        description: str(b.description, "Description"),
        amount,
        status: "unpaid",
        source: "manual",
      };
      s.expenses.push(out);
      break;
    }
    case "expense.pay": {
      allow(user, "finance");
      out = item(s, "expenses", b.id);
      if (out.status !== "unpaid") fail("Expense is already paid.", 409);
      out.status = "paid";
      out.paidDate = dateKey();
      break;
    }
    case "user.create": {
      allow(user, "users");
      const mail = email(b.email);
      unique(s, "users", "email", mail);
      if (!permissions[b.role]) fail("Invalid role.");
      const password = str(b.password, "Password", 128);
      if (password.length < 10)
        fail("Password must have at least 10 characters.");
      out = {
        id: id(),
        name: str(b.name, "Name"),
        email: mail,
        role: b.role,
        passwordHash: hashPassword(password),
      };
      s.users.push(out);
      out = { id: out.id, name: out.name, email: out.email, role: out.role };
      break;
    }
    default:
      fail("Unknown action.", 404);
  }
  audit(
    s,
    user,
    action,
    out.number ||
      out.name ||
      out.description ||
      out.id ||
      `${out.count} records`,
  );
  return out;
}
export function view(s, user) {
  const p = permissions[user.role];
  const v = {};
  if (p.includes("inventory")) {
    v.products = s.products;
    v.movements = s.movements;
  }
  if (p.includes("sales") || p.includes("finance")) v.orders = s.orders;
  if (p.includes("hr")) {
    v.employees = s.employees;
    v.attendance = s.attendance;
    v.payroll = s.payroll;
  }
  if (p.includes("finance")) v.expenses = s.expenses;
  if (p.includes("procurement")) {
    v.purchases = s.purchases;
    v.vendors = s.vendors;
    v.products = s.products;
  }
  if (p.includes("audit")) v.audit = s.audit;
  if (p.includes("users")) v.users = s.users.map(({ passwordHash, ...u }) => u);
  return v;
}
