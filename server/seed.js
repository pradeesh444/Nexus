import { hashPassword } from "./security.js";
export const tables = [
  "users",
  "products",
  "vendors",
  "employees",
  "attendance",
  "orders",
  "purchases",
  "expenses",
  "payroll",
  "movements",
  "audit",
];
export function dateKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
export function seed() {
  const now = new Date();
  const day = (offset) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return dateKey(d);
  };
  const roles = ["owner", "manager", "staff", "hr", "accountant"];
  const s = Object.fromEntries(tables.map((t) => [t, []]));
  s.users = roles.map((role, i) => ({
    id: `user-${i + 1}`,
    name: ["Pradeesh A", "Meera Raman", "Arun Kumar", "Divya S", "Vikram R"][i],
    email: `${role}@nexus.demo`,
    role,
    passwordHash: hashPassword("Demo@12345"),
  }));
  s.products = [
    [
      "p1",
      "INV-001",
      "Wireless keyboard",
      "Electronics",
      149900,
      95000,
      42,
      10,
    ],
    [
      "p2",
      "INV-002",
      "USB-C hub · 7 port",
      "Electronics",
      249900,
      160000,
      8,
      12,
    ],
    ["p3", "INV-003", "A5 notebook", "Stationery", 19900, 10000, 120, 30],
    ["p4", "INV-004", "Desk organiser", "Office", 79900, 42000, 24, 8],
    ["p5", "INV-005", "Laptop stand", "Accessories", 189900, 110000, 6, 10],
    ["p6", "INV-006", "Wireless mouse", "Electronics", 89900, 51000, 58, 15],
    ["p7", "INV-007", "Steel water bottle", "Office", 59900, 32000, 31, 10],
    ["p8", "INV-008", "HDMI cable · 2m", "Accessories", 39900, 20000, 67, 20],
  ].map(([id, sku, name, category, price, cost, stock, reorder]) => ({
    id,
    sku,
    name,
    category,
    price,
    cost,
    stock,
    reorder,
    active: true,
  }));
  s.vendors = [
    {
      id: "v1",
      name: "Chennai Tech Supplies",
      email: "sales@example.com",
      phone: "9000000001",
      city: "Chennai",
    },
    {
      id: "v2",
      name: "Southline Office Products",
      email: "office@example.com",
      phone: "9000000002",
      city: "Coimbatore",
    },
    {
      id: "v3",
      name: "Metro Accessories",
      email: "metro@example.com",
      phone: "9000000003",
      city: "Bengaluru",
    },
  ];
  s.employees = [
    [
      "e1",
      "EMP-001",
      "Meera Raman",
      "Operations",
      "Operations manager",
      5500000,
    ],
    ["e2", "EMP-002", "Arun Kumar", "Sales", "Sales associate", 2800000],
    ["e3", "EMP-003", "Divya S", "People", "HR executive", 3500000],
    ["e4", "EMP-004", "Vikram R", "Finance", "Accountant", 4200000],
    ["e5", "EMP-005", "Nisha K", "Operations", "Inventory associate", 2600000],
    ["e6", "EMP-006", "Rahul P", "Sales", "Sales executive", 3200000],
  ].map(([id, code, name, department, designation, salary]) => ({
    id,
    code,
    name,
    department,
    designation,
    salary,
    email: `${code.toLowerCase()}@example.com`,
    joined: day(-100),
    active: true,
  }));
  s.attendance = s.employees
    .slice(0, 5)
    .map((e, i) => ({
      id: `a${i}`,
      employeeId: e.id,
      date: day(0),
      status: i === 4 ? "Leave" : "Present",
    }));
  const customers = [
    "Northstar Studio",
    "Aster Learning",
    "Orbit Design Co.",
    "Bluebird Retail",
    "Pixel Works",
    "Greenway Labs",
  ];
  for (let i = 0; i < 18; i++) {
    const p = s.products[i % 8],
      qty = 2 + (i % 5);
    const subtotal = p.price * qty;
    const tax = Math.round(subtotal * 0.18);
    s.orders.push({
      id: `seed-order-${i}`,
      number: `INV-${String(i + 1).padStart(4, "0")}`,
      customer: customers[i % 6],
      email: "client@example.com",
      date: day(-17 + i),
      lines: [
        {
          productId: p.id,
          name: p.name,
          sku: p.sku,
          quantity: qty,
          price: p.price,
          cost: p.cost,
        },
      ],
      subtotal,
      taxRate: 18,
      tax,
      total: subtotal + tax,
      status: i > 14 ? "confirmed" : "paid",
      createdBy: "user-1",
      paidDate: i > 14 ? null : day(-17 + i),
    });
  }
  // Stock figures above are current balances after the sample sales.
  for (const p of s.products) {
    const sold = s.orders
      .flatMap((o) => o.lines)
      .filter((l) => l.productId === p.id)
      .reduce((a, l) => a + l.quantity, 0);
    s.movements.push({
      id: `opening-${p.id}`,
      productId: p.id,
      type: "opening",
      quantity: p.stock + sold,
      date: day(-30),
      reference: "Opening balance",
      by: "Seed data",
    });
  }
  for (const o of s.orders)
    for (const l of o.lines)
      s.movements.push({
        id: `sale-${o.id}-${l.productId}`,
        productId: l.productId,
        type: "sale",
        quantity: -l.quantity,
        date: o.date,
        reference: o.number,
        by: "Seed data",
      });
  s.expenses = [
    {
      id: "x1",
      date: day(-12),
      category: "Rent",
      description: "Office rent",
      amount: 1800000,
      status: "paid",
      paidDate: day(-12),
      source: "manual",
    },
    {
      id: "x2",
      date: day(-6),
      category: "Utilities",
      description: "Electricity and internet",
      amount: 420000,
      status: "paid",
      paidDate: day(-6),
      source: "manual",
    },
    {
      id: "x3",
      date: day(-2),
      category: "Transport",
      description: "Local delivery",
      amount: 185000,
      status: "paid",
      paidDate: day(-2),
      source: "manual",
    },
  ];
  s.purchases = [
    {
      id: "purchase-1",
      number: "PO-0001",
      vendorId: "v1",
      date: day(-2),
      expected: day(3),
      status: "pending",
      lines: [
        {
          productId: "p2",
          name: s.products[1].name,
          quantity: 20,
          cost: 160000,
        },
      ],
      total: 3200000,
      createdBy: "user-2",
    },
  ];
  s.audit = [
    {
      id: "audit-1",
      date: now.toISOString(),
      actor: "System",
      action: "Demo workspace created",
      detail: "Fictional sample business records",
    },
  ];
  return s;
}
