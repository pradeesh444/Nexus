import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Wallet,
  Truck,
  ShieldCheck,
  Activity,
  LogOut,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  X,
  Check,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Printer,
  Menu,
  BookOpen,
  SlidersHorizontal,
  IndianRupee,
  CalendarDays,
  Box,
  FileText,
  Building2,
  Pencil,
} from "lucide-react";
import "./styles.css";
const money = (v) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format((v || 0) / 100);
const compact = (v) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format((v || 0) / 100);
const fmt = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
let csrf = "";
async function api(url, body) {
  const res = await fetch("/api" + url, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined
        ? {}
        : { "Content-Type": "application/json", "X-CSRF-Token": csrf },
    credentials: "same-origin",
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const result = await res.json();
  if (!res.ok) {
    const e = new Error(result.error || "Request failed.");
    e.status = res.status;
    throw e;
  }
  return result;
}
function csv(name, rows) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]).filter(
    (k) => !["passwordHash"].includes(k),
  );
  const escape = (v) =>
    '"' +
    String(typeof v === "object" ? JSON.stringify(v) : (v ?? ""))
      .replace(/^[=+@\-]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  const blob = new Blob(
    [
      "\uFEFF" +
        [keys, ...rows.map((r) => keys.map((k) => r[k]))]
          .map((r) => r.map(escape).join(","))
          .join("\r\n"),
    ],
    { type: "text/csv;charset=utf-8" },
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name + ".csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const navs = [
  ["dashboard", "Overview", LayoutDashboard],
  ["inventory", "Inventory", Package],
  ["sales", "Sales & invoices", ShoppingCart],
  ["procurement", "Procurement", Truck],
  ["hr", "People & payroll", Users],
  ["finance", "Finance", Wallet],
  ["audit", "Activity log", Activity],
  ["users", "Access control", ShieldCheck],
];
const Status = ({ value }) => (
  <span className={"status " + value.toLowerCase()}>
    <span />
    {value}
  </span>
);
const Empty = ({ text = "No records to show." }) => (
  <div className="empty">
    <Box size={30} />
    <p>{text}</p>
  </div>
);
function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef();
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className={"modal " + (wide ? "wide" : "")}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button
          className="icon-btn"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function Field({ label, children, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children || <input {...props} />}
    </label>
  );
}
function Form({ children, onSubmit, submit = "Save changes", onClose }) {
  const [busy, setBusy] = useState(false),
    [err, setErr] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setErr("");
        try {
          await onSubmit(new FormData(e.currentTarget));
          onClose();
        } catch (e) {
          setErr(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="form-body">
        {children}
        {err && (
          <div className="error" role="alert">
            {err}
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button type="button" className="btn secondary" onClick={onClose}>
          Cancel
        </button>
        <button disabled={busy} className="btn">
          {busy ? "Saving…" : submit}
        </button>
      </div>
    </form>
  );
}
function Login({ onLogin }) {
  const [email, setEmail] = useState("owner@nexus.demo"),
    [password, setPassword] = useState("Demo@12345"),
    [err, setErr] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main className="login">
      <section className="login-story">
        <div className="brand">
          <span className="brand-symbol">N</span>
          <span>
            nexus<span className="brand-light">erp</span>
          </span>
        </div>
        <div>
          <span className="eyebrow">ONE BUSINESS. ONE WORKSPACE.</span>
          <h1>
            A clearer view
            <br />
            of your business.
          </h1>
          <p>
            Stock, sales, people and finances.
            <br />
            Connected in one place.
          </p>
          <div className="login-preview">
            <div>
              <Package />
              <span>Inventory</span>
              <CheckCircle2 />
            </div>
            <div>
              <ShoppingCart />
              <span>Sales & invoices</span>
              <CheckCircle2 />
            </div>
            <div>
              <Users />
              <span>People & payroll</span>
              <CheckCircle2 />
            </div>
            <div>
              <Wallet />
              <span>Finance & purchasing</span>
              <CheckCircle2 />
            </div>
          </div>
        </div>
        <span className="login-credit">
          Centralized ERP Platform · Academic demonstration
        </span>
      </section>
      <section className="login-form">
        <div className="login-form-inner">
          <span className="eyebrow muted">WELCOME TO NEXUS</span>
          <h2>Sign in to your workspace</h2>
          <p className="muted">
            Choose a demo role or enter your account details.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setErr("");
              try {
                onLogin(await api("/login", { email, password }));
              } catch (e) {
                setErr(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field
              label="Email address"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Field
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {err && (
              <div className="error" role="alert">
                {err}
              </div>
            )}
            <button className="btn login-button" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
              <ChevronRight size={18} />
            </button>
          </form>
          <div className="demo-roles">
            <span className="label">DEMO ACCOUNTS</span>
            <div>
              {["owner", "manager", "staff", "hr", "accountant"].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={email === r + "@nexus.demo" ? "selected" : ""}
                  onClick={() => {
                    setEmail(r + "@nexus.demo");
                    setPassword("Demo@12345");
                  }}
                >
                  {r === "hr" ? "HR" : r}
                </button>
              ))}
            </div>
            <p>
              Demo password: <code>Demo@12345</code>
              <br />
              All names and business records are fictional.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
function Metric({ label, value, sub, icon: Icon, tone }) {
  return (
    <div className={"metric " + (tone || "")}>
      <div className="metric-label">
        {label}
        <Icon size={18} />
      </div>
      <strong>{value}</strong>
      <span>{sub}</span>
    </div>
  );
}
function Bars({ orders, today, days }) {
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today + "T12:00:00");
    d.setDate(d.getDate() - 6 + i);
    return d.toISOString().slice(0, 10);
  });
  const data = dates.map((d) =>
      orders
        .filter((o) => o.date === d && ["confirmed", "paid"].includes(o.status))
        .reduce((a, o) => a + o.total, 0),
    ),
    max = Math.max(...data, 1);
  return (
    <div className="chart">
      <div className="chart-scale">
        <span>{compact(max)}</span>
        <span>{compact(max / 2)}</span>
        <span>₹0</span>
      </div>
      <div className="chart-bars">
        {data.map((v, i) => (
          <div className="chart-col" key={dates[i]}>
            <div className="bar-space">
              <div
                className={"bar " + (i === 6 ? "current" : "")}
                style={{ height: Math.max((v / max) * 100, 1) + "%" }}
                title={`${dates[i]}: ${money(v)}`}
              >
                <span>{compact(v)}</span>
              </div>
            </div>
            <span>
              {new Date(dates[i] + "T12:00:00").toLocaleDateString("en-IN", {
                weekday: "short",
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
function Dashboard({ data, user, today, go, open }) {
  const [period, setPeriod] = useState("30");
  const start = new Date(today + "T12:00:00");
  start.setDate(start.getDate() - Number(period) + 1);
  const since = start.toISOString().slice(0, 10);
  const orders = data.orders || [],
    periodOrders = orders.filter((o) => o.date >= since && o.date <= today),
    confirmed = periodOrders.filter((o) =>
      ["confirmed", "paid"].includes(o.status),
    );
  const sales = confirmed.reduce((a, o) => a + o.total, 0),
    receivable = orders
      .filter((o) => o.status === "confirmed")
      .reduce((a, o) => a + o.total, 0),
    products = data.products || [],
    low = products.filter((p) => p.stock <= p.reorder),
    employees = (data.employees || []).filter((e) => e.active),
    expenses = data.expenses || [];
  const can = (m) => user.permissions.includes(m);
  return (
    <>
      <div className="page-title">
        <div>
          <div className="eyebrow muted">YOUR BUSINESS AT A GLANCE</div>
          <h1>Business overview</h1>
          <p>
            Welcome back, {user.name.split(" ")[0]}. Here’s where things stand.
          </p>
        </div>
        <div className="actions">
          <select
            aria-label="Reporting period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          {can("sales") && (
            <button className="btn" onClick={() => open("sale")}>
              <Plus size={17} />
              New sale
            </button>
          )}
        </div>
      </div>
      <div className="metrics">
        {data.orders && (
          <Metric
            label="Sales value"
            value={money(sales)}
            sub={`${confirmed.length} confirmed / paid orders · incl. tax`}
            icon={IndianRupee}
            tone="accent"
          />
        )}
        {data.orders && (
          <Metric
            label="Awaiting payment"
            value={money(receivable)}
            sub={`${orders.filter((o) => o.status === "confirmed").length} unpaid sales invoices · all dates`}
            icon={Wallet}
          />
        )}{" "}
        {can("inventory") && (
          <Metric
            label="Inventory at cost"
            value={money(products.reduce((a, p) => a + p.stock * p.cost, 0))}
            sub={`${products.length} products · ${low.length} need restocking`}
            icon={Package}
          />
        )}{" "}
        {can("hr") && (
          <Metric
            label="Team attendance"
            value={`${(data.attendance || []).filter((a) => a.date === today && a.status === "Present" && employees.some((e) => e.id === a.employeeId)).length} / ${employees.length}`}
            sub="Active employees present today"
            icon={Users}
          />
        )}{" "}
        {!can("inventory") && can("finance") && (
          <Metric
            label="Paid expenses"
            value={money(
              expenses
                .filter((e) => e.status === "paid" && e.paidDate >= since)
                .reduce((a, e) => a + e.amount, 0),
            )}
            sub="Cash outflow in selected period"
            icon={ArrowDownRight}
          />
        )}
      </div>
      <div className="dashboard-grid">
        <section className="panel sales-panel">
          <div className="panel-head">
            <div>
              <h2>{data.orders ? "Sales performance" : "People overview"}</h2>
              <span className="muted">
                {data.orders
                  ? "Confirmed and paid orders · last 7 days"
                  : "Attendance records for today"}
              </span>
            </div>
            {data.orders && (
              <span className="legend">
                <i />
                Sales incl. tax
              </span>
            )}
          </div>
          {data.orders ? (
            <Bars orders={orders} today={today} />
          ) : (
            <div className="people-overview">
              {["Present", "Absent", "Leave"].map((status) => (
                <div key={status}>
                  <strong>
                    {
                      (data.attendance || []).filter(
                        (a) => a.date === today && a.status === status,
                      ).length
                    }
                  </strong>
                  <Status value={status} />
                </div>
              ))}
              <button className="btn secondary" onClick={() => go("hr")}>
                Manage attendance
              </button>
            </div>
          )}
        </section>
        <section className="panel attention-panel">
          <div className="panel-head">
            <h2>Needs attention</h2>
            <span className="count">
              {low.length +
                (data.purchases || []).filter((p) => p.status === "pending")
                  .length +
                expenses.filter((e) => e.status === "unpaid").length}
            </span>
          </div>
          <div className="attention-list">
            {can("inventory") && (
              <button onClick={() => go("inventory")}>
                <span className="attention-icon amber">
                  <Package size={19} />
                </span>
                <span>
                  <b>{low.length} products running low</b>
                  <small>Review stock and reorder levels</small>
                </span>
                <ChevronRight size={18} />
              </button>
            )}
            {can("procurement") && (
              <button onClick={() => go("procurement")}>
                <span className="attention-icon purple">
                  <Truck size={19} />
                </span>
                <span>
                  <b>
                    {
                      (data.purchases || []).filter(
                        (p) => p.status === "pending",
                      ).length
                    }{" "}
                    orders awaiting approval
                  </b>
                  <small>Review pending purchase orders</small>
                </span>
                <ChevronRight size={18} />
              </button>
            )}
            {can("finance") && (
              <button onClick={() => go("finance")}>
                <span className="attention-icon blue">
                  <Wallet size={19} />
                </span>
                <span>
                  <b>
                    {expenses.filter((e) => e.status === "unpaid").length}{" "}
                    expenses to pay
                  </b>
                  <small>View outstanding expenses</small>
                </span>
                <ChevronRight size={18} />
              </button>
            )}
            {can("hr") && !can("inventory") && (
              <button onClick={() => go("hr")}>
                <span className="attention-icon purple">
                  <Users size={19} />
                </span>
                <span>
                  <b>{employees.length} active employees</b>
                  <small>Review attendance and payroll</small>
                </span>
                <ChevronRight size={18} />
              </button>
            )}
          </div>
          <div className="workspace-note">
            <ShieldCheck size={19} />
            <span>
              Connected records.
              <br />
              <b>One shared workspace.</b>
            </span>
          </div>
        </section>
      </div>
      {data.orders && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Recent sales</h2>
              <span className="muted">
                The latest activity across your business
              </span>
            </div>
            <button
              className="text-btn"
              onClick={() => go(can("sales") ? "sales" : "finance")}
            >
              View all <ChevronRight size={16} />
            </button>
          </div>
          <SalesTable
            orders={orders.slice().reverse().slice(0, 5)}
            invoice={(o) => open("invoice", o)}
          />
        </section>
      )}
      {can("inventory") && (
        <div className="bottom-strip">
          <div>
            <span className="attention-icon amber">
              <AlertTriangle size={19} />
            </span>
            <div>
              <b>Keep your best sellers in stock</b>
              <p>
                {low.map((p) => p.name).join(" and ") ||
                  "All products are above their reorder levels."}
              </p>
            </div>
          </div>
          <button className="text-btn" onClick={() => go("inventory")}>
            Review inventory
            <ChevronRight size={17} />
          </button>
        </div>
      )}
    </>
  );
}
function SalesTable({ orders, invoice, run, busy, canCancel = true }) {
  return orders.length ? (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <button className="table-link" onClick={() => invoice(o)}>
                  {o.number}
                </button>
              </td>
              <td>
                <b>{o.customer}</b>
              </td>
              <td>{fmt(o.date)}</td>
              <td className="amount">{money(o.total)}</td>
              <td>
                <Status value={o.status} />
              </td>
              <td>
                <div className="row-actions">
                  <button
                    title="View invoice"
                    aria-label={`View ${o.number}`}
                    className="icon-btn"
                    onClick={() => invoice(o)}
                  >
                    <FileText size={17} />
                  </button>
                  {run && o.status === "draft" && (
                    <button
                      disabled={busy}
                      className="small-btn"
                      onClick={() =>
                        run(
                          "order.confirm",
                          { id: o.id },
                          "Order confirmed. Inventory updated.",
                        )
                      }
                    >
                      Confirm
                    </button>
                  )}
                  {run && o.status === "confirmed" && (
                    <button
                      disabled={busy}
                      className="small-btn"
                      onClick={() =>
                        run("order.pay", { id: o.id }, "Payment recorded.")
                      }
                    >
                      Mark paid
                    </button>
                  )}
                  {run &&
                    canCancel &&
                    ["draft", "confirmed"].includes(o.status) && (
                      <button
                        disabled={busy}
                        className="text-btn danger"
                        onClick={() => invoice({ ...o, confirmCancel: true })}
                      >
                        Cancel
                      </button>
                    )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty />
  );
}
function App() {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [data, setData] = useState({}),
    [today, setToday] = useState(""),
    [storage, setStorage] = useState(""),
    [route, setRoute] = useState("dashboard"),
    [modal, setModal] = useState(null),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [toast, setToast] = useState(null),
    [busy, setBusy] = useState(false),
    [loadError, setLoadError] = useState(""),
    [mobile, setMobile] = useState(false),
    [tab, setTab] = useState("employees"),
    [attendanceDate, setAttendanceDate] = useState("");
  const notify = (text, type = "success") => setToast({ text, type });
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const refresh = useCallback(async () => {
    try {
      const r = await api("/state");
      setData(r.data);
      setToday(r.today);
      setAttendanceDate((d) => d || r.today);
      setStorage(r.storage);
      setLoadError("");
    } catch (e) {
      if (e.status === 401) setUser(null);
      else setLoadError(e.message);
      throw e;
    }
  }, []);
  useEffect(() => {
    api("/me")
      .then(async (r) => {
        csrf = r.csrf;
        setUser(r.user);
        await refresh();
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refresh]);
  useEffect(() => {
    if (!user) return;
    const t = setInterval(() => refresh().catch(() => {}), 15000);
    return () => clearInterval(t);
  }, [user, refresh]);
  const login = async (r) => {
    csrf = r.csrf;
    setUser(r.user);
    setRoute("dashboard");
    setLoading(true);
    try {
      await refresh();
    } finally {
      setLoading(false);
    }
  };
  const go = (r) => {
    setRoute(r);
    setSearch("");
    setFilter("all");
    setMobile(false);
    setTab(r === "hr" ? "employees" : "orders");
  };
  const open = (type, row) => setModal({ type, row });
  const execute = async (action, body) => {
    const result = await api("/commands/" + action, body);
    await refresh();
    return result;
  };
  const run = async (action, body, message) => {
    if (busy) return;
    setBusy(true);
    try {
      await execute(action, body);
      notify(message || "Changes saved.");
      return true;
    } catch (e) {
      notify(e.message, "error");
      return false;
    } finally {
      setBusy(false);
    }
  };
  const save = async (action, body) => {
    await execute(action, body);
    notify("Changes saved.");
  };
  const match = (r, fields) =>
    fields.some((k) =>
      String(r[k] ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  if (loading)
    return (
      <div className="loading">
        <span className="brand-symbol">N</span>
        <p>Opening your workspace…</p>
      </div>
    );
  if (!user) return <Login onLogin={login} />;
  const can = (m) => user.permissions.includes(m),
    manage = user.role === "owner" || user.role === "manager";
  const products = data.products || [],
    orders = data.orders || [],
    purchases = data.purchases || [],
    employees = data.employees || [],
    expenses = data.expenses || [];
  const close = () => setModal(null);
  const toolbar = (placeholder, opts, exportRows, exportName) => (
    <div className="toolbar">
      <label className="search">
        <Search size={18} />
        <input
          aria-label={placeholder}
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <div className="actions">
        {opts && (
          <select
            aria-label="Filter records"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {opts.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        )}
        {exportRows && (
          <button
            className="btn secondary"
            disabled={!exportRows.length}
            onClick={() => csv(exportName, exportRows)}
          >
            <Download size={16} />
            Export CSV
          </button>
        )}
      </div>
    </div>
  );
  const title = (eyebrow, heading, desc, button, handler) => (
    <div className="page-title">
      <div>
        <div className="eyebrow muted">{eyebrow}</div>
        <h1>{heading}</h1>
        <p>{desc}</p>
      </div>
      {button && (
        <button className="btn" onClick={handler}>
          <Plus size={17} />
          {button}
        </button>
      )}
    </div>
  );
  let body;
  if (route === "dashboard")
    body = (
      <Dashboard data={data} user={user} today={today} go={go} open={open} />
    );
  if (route === "inventory") {
    const rows = products.filter(
      (p) =>
        match(p, ["name", "sku", "category"]) &&
        (filter !== "low" || p.stock <= p.reorder),
    );
    body = (
      <>
        {title(
          "OPERATIONS",
          "Inventory",
          "Track every product, stock movement and reorder level.",
          manage ? "Add product" : null,
          () => open("product"),
        )}
        <div className="mini-metrics">
          <div>
            <span>Total products</span>
            <b>{products.length}</b>
          </div>
          <div>
            <span>Units in stock</span>
            <b>{products.reduce((a, p) => a + p.stock, 0)}</b>
          </div>
          <div>
            <span>Below reorder level</span>
            <b className="amber-text">
              {products.filter((p) => p.stock <= p.reorder).length}
            </b>
          </div>
          <div>
            <span>Stock value at cost</span>
            <b>{money(products.reduce((a, p) => a + p.stock * p.cost, 0))}</b>
          </div>
        </div>
        <section className="panel">
          {toolbar(
            "Search products, SKU or category…",
            [
              ["all", "All stock"],
              ["low", "Low stock"],
            ],
            rows,
            "inventory",
          )}
          {rows.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Selling price</th>
                    <th>On hand</th>
                    <th>Reorder at</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="product-cell">
                          <span className="product-icon">
                            <Package size={20} />
                          </span>
                          <span>
                            <b>{p.name}</b>
                            <small>{p.sku}</small>
                          </span>
                        </div>
                      </td>
                      <td>{p.category}</td>
                      <td>{money(p.price)}</td>
                      <td>
                        <b>{p.stock}</b> <span className="muted">units</span>
                      </td>
                      <td>{p.reorder}</td>
                      <td>
                        <Status
                          value={
                            p.stock <= p.reorder ? "Low stock" : "In stock"
                          }
                        />
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="small-btn"
                            onClick={() => open("movements", p)}
                          >
                            History
                          </button>
                          {manage && (
                            <>
                              <button
                                className="icon-btn"
                                aria-label={`Edit ${p.name}`}
                                onClick={() => open("product", p)}
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                className="small-btn"
                                onClick={() => open("adjust", p)}
                              >
                                Adjust
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty text="No products match your search." />
          )}
        </section>
      </>
    );
  }
  if (route === "sales") {
    const rows = orders
      .filter(
        (o) =>
          match(o, ["number", "customer"]) &&
          (filter === "all" || o.status === filter),
      )
      .slice()
      .reverse();
    body = (
      <>
        {title(
          "REVENUE",
          "Sales & invoices",
          "Create orders, confirm stock allocation and record payments.",
          "New sale",
          () => open("sale"),
        )}
        <div className="mini-metrics">
          <div>
            <span>Total orders</span>
            <b>{orders.length}</b>
          </div>
          <div>
            <span>Draft orders</span>
            <b>{orders.filter((o) => o.status === "draft").length}</b>
          </div>
          <div>
            <span>Awaiting payment</span>
            <b>
              {money(
                orders
                  .filter((o) => o.status === "confirmed")
                  .reduce((a, o) => a + o.total, 0),
              )}
            </b>
          </div>
          <div>
            <span>Payments collected</span>
            <b>
              {money(
                orders
                  .filter((o) => o.status === "paid")
                  .reduce((a, o) => a + o.total, 0),
              )}
            </b>
          </div>
        </div>
        <section className="panel">
          {toolbar(
            "Search invoice or customer…",
            ["all", "draft", "confirmed", "paid", "cancelled"].map((x) => [
              x,
              x === "all" ? "All statuses" : x,
            ]),
            rows,
            "sales",
          )}
          <SalesTable
            orders={rows}
            invoice={(o) => open(o.confirmCancel ? "cancelSale" : "invoice", o)}
            run={run}
            busy={busy}
          />
        </section>
      </>
    );
  }
  if (route === "procurement") {
    const rows = purchases
      .filter(
        (p) =>
          (filter === "all" || p.status === filter) &&
          match(
            {
              ...p,
              vendor: (data.vendors || []).find((v) => v.id === p.vendorId)
                ?.name,
            },
            ["number", "vendor"],
          ),
      )
      .slice()
      .reverse();
    body = (
      <>
        {title(
          "SUPPLY CHAIN",
          "Procurement",
          "Manage suppliers and replenish stock through an approval workflow.",
          tab === "vendors" ? "Add vendor" : "New purchase order",
          () => open(tab === "vendors" ? "vendor" : "purchase"),
        )}
        <div className="tabs">
          <button
            className={tab !== "vendors" ? "active" : ""}
            onClick={() => {
              setTab("orders");
              setSearch("");
            }}
          >
            Purchase orders <span>{purchases.length}</span>
          </button>
          <button
            className={tab === "vendors" ? "active" : ""}
            onClick={() => {
              setTab("vendors");
              setSearch("");
            }}
          >
            Vendors <span>{data.vendors?.length}</span>
          </button>
        </div>
        <section className="panel">
          {tab === "vendors" ? (
            <>
              {toolbar("Search vendors…", null, data.vendors, "vendors")}
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>City</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.vendors
                      .filter((v) => match(v, ["name", "city"]))
                      .map((v) => (
                        <tr key={v.id}>
                          <td>
                            <b>{v.name}</b>
                          </td>
                          <td>{v.email}</td>
                          <td>{v.phone}</td>
                          <td>{v.city}</td>
                          <td>
                            <button
                              className="small-btn"
                              onClick={() => open("vendor", v)}
                            >
                              Edit vendor
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              {toolbar(
                "Search purchase orders or vendors…",
                ["all", "pending", "approved", "received", "cancelled"].map(
                  (x) => [x, x === "all" ? "All statuses" : x],
                ),
                rows,
                "purchases",
              )}
              {rows.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Purchase order</th>
                        <th>Vendor</th>
                        <th>Expected</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <button
                              className="table-link"
                              onClick={() => open("purchaseDetail", p)}
                            >
                              {p.number}
                            </button>
                            <small>
                              {p.lines.reduce((a, l) => a + l.quantity, 0)}{" "}
                              units
                            </small>
                          </td>
                          <td>
                            <b>
                              {
                                data.vendors.find((v) => v.id === p.vendorId)
                                  ?.name
                              }
                            </b>
                          </td>
                          <td>{fmt(p.expected)}</td>
                          <td>{money(p.total)}</td>
                          <td>
                            <Status value={p.status} />
                          </td>
                          <td>
                            <div className="row-actions">
                              {p.status === "pending" && (
                                <button
                                  className="small-btn"
                                  disabled={busy}
                                  onClick={() =>
                                    run(
                                      "purchase.approve",
                                      { id: p.id },
                                      "Purchase order approved.",
                                    )
                                  }
                                >
                                  Approve
                                </button>
                              )}
                              {p.status === "approved" && (
                                <button
                                  className="small-btn"
                                  onClick={() => open("receive", p)}
                                >
                                  Receive stock
                                </button>
                              )}
                              {["pending", "approved"].includes(p.status) && (
                                <button
                                  className="text-btn danger"
                                  onClick={() => open("cancelPurchase", p)}
                                >
                                  Cancel
                                </button>
                              )}
                              {p.status === "received" && (
                                <span className="muted">Stock updated</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty />
              )}
            </>
          )}
        </section>
        <p className="page-note">
          Receiving a purchase adds stock and creates an unpaid procurement
          expense in Finance.
        </p>
      </>
    );
  }
  if (route === "hr") {
    const rows = employees.filter((e) =>
      match(e, ["name", "code", "department"]),
    );
    body = (
      <>
        {title(
          "PEOPLE",
          "People & payroll",
          "Employee records, daily attendance and basic monthly payroll.",
          tab === "payroll" ? "Run payroll" : "Add employee",
          () => open(tab === "payroll" ? "payroll" : "employee"),
        )}
        <div className="mini-metrics">
          <div>
            <span>Active employees</span>
            <b>{employees.filter((e) => e.active).length}</b>
          </div>
          <div>
            <span>Present today</span>
            <b>
              {
                data.attendance.filter(
                  (a) => a.date === today && a.status === "Present",
                ).length
              }
            </b>
          </div>
          <div>
            <span>Monthly base payroll</span>
            <b>
              {money(
                employees
                  .filter((e) => e.active)
                  .reduce((a, e) => a + e.salary, 0),
              )}
            </b>
          </div>
        </div>
        <div className="tabs">
          {["employees", "attendance", "payroll"].map((t) => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => {
                setTab(t);
                setSearch("");
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <section className="panel">
          {tab === "employees" && (
            <>
              {toolbar(
                "Search employee, code or department…",
                null,
                rows,
                "employees",
              )}
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Monthly salary</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((e) => (
                      <tr key={e.id}>
                        <td>
                          <div className="product-cell">
                            <span className="avatar light">
                              {e.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")}
                            </span>
                            <span>
                              <b>{e.name}</b>
                              <small>{e.code}</small>
                            </span>
                          </div>
                        </td>
                        <td>{e.department}</td>
                        <td>{e.designation}</td>
                        <td>{money(e.salary)}</td>
                        <td>
                          <Status value={e.active ? "Active" : "Inactive"} />
                        </td>
                        <td>
                          <button
                            className="small-btn"
                            onClick={() => open("employee", e)}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {tab === "attendance" && (
            <>
              <div className="toolbar">
                <Field
                  label="Attendance date"
                  type="date"
                  value={attendanceDate}
                  max={today}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                />
                <button
                  className="btn secondary"
                  onClick={() =>
                    csv(
                      "attendance",
                      data.attendance
                        .filter((a) => a.date === attendanceDate)
                        .map((a) => ({
                          ...a,
                          employee: employees.find((e) => e.id === a.employeeId)
                            ?.name,
                        })),
                    )
                  }
                >
                  <Download size={16} />
                  Export day
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees
                      .filter((e) => e.active)
                      .map((e) => (
                        <tr key={e.id}>
                          <td>
                            <b>{e.name}</b>
                            <small>{e.code}</small>
                          </td>
                          <td>{e.department}</td>
                          <td>
                            <select
                              aria-label={`Attendance for ${e.name}`}
                              disabled={busy || !attendanceDate}
                              value={
                                data.attendance.find(
                                  (a) =>
                                    a.employeeId === e.id &&
                                    a.date === attendanceDate,
                                )?.status || ""
                              }
                              onChange={(event) =>
                                run(
                                  "attendance.save",
                                  {
                                    employeeId: e.id,
                                    date: attendanceDate,
                                    status: event.target.value,
                                  },
                                  "Attendance saved.",
                                )
                              }
                            >
                              <option value="" disabled>
                                Not marked
                              </option>
                              {["Present", "Absent", "Leave"].map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {tab === "payroll" && (
            <>
              {toolbar(
                "Search payroll month…",
                null,
                data.payroll.map((p) => ({
                  ...p,
                  employee: employees.find((e) => e.id === p.employeeId)?.name,
                })),
                "payroll",
              )}
              {data.payroll.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Employee</th>
                        <th>Base salary</th>
                        <th>Generated</th>
                        <th>Finance entry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.payroll
                        .filter((p) => match(p, ["month"]))
                        .map((p) => (
                          <tr key={p.id}>
                            <td>{p.month}</td>
                            <td>
                              {
                                employees.find((e) => e.id === p.employeeId)
                                  ?.name
                              }
                            </td>
                            <td>{money(p.amount)}</td>
                            <td>{fmt(p.date)}</td>
                            <td>Expense created</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty text="No payroll yet. Run payroll to create monthly salary expenses." />
              )}
            </>
          )}
        </section>
        {tab === "payroll" && (
          <p className="page-note">
            Basic payroll uses the full monthly salary. It does not calculate
            deductions, attendance proration, tax, PF or ESI. Finance records
            payment separately.
          </p>
        )}
      </>
    );
  }
  if (route === "finance") {
    const received = orders
        .filter((o) => o.status === "paid")
        .reduce((a, o) => a + o.total, 0),
      paid = expenses
        .filter((e) => e.status === "paid")
        .reduce((a, e) => a + e.amount, 0),
      rows = expenses
        .filter(
          (e) =>
            match(e, ["description", "category"]) &&
            (filter === "all" || e.status === filter),
        )
        .slice()
        .reverse();
    body = (
      <>
        {title(
          "FINANCIALS",
          "Finance",
          "Track cash collected, expenses and outstanding payments.",
          "Add expense",
          () => open("expense"),
        )}
        <div className="metrics">
          <Metric
            label="Cash collected"
            value={money(received)}
            sub="Paid sales invoices · all dates"
            icon={ArrowUpRight}
            tone="accent"
          />
          <Metric
            label="Cash paid out"
            value={money(paid)}
            sub="Paid expenses · all dates"
            icon={ArrowDownRight}
          />
          <Metric
            label="Net cash movement"
            value={money(received - paid)}
            sub="Collections less paid expenses"
            icon={Wallet}
          />
          <Metric
            label="Expenses payable"
            value={money(
              expenses
                .filter((e) => e.status === "unpaid")
                .reduce((a, e) => a + e.amount, 0),
            )}
            sub="Unpaid expenses · all dates"
            icon={FileText}
          />
        </div>
        <div className="tabs">
          <button
            className={tab !== "receivables" ? "active" : ""}
            onClick={() => setTab("expenses")}
          >
            Expenses
          </button>
          <button
            className={tab === "receivables" ? "active" : ""}
            onClick={() => setTab("receivables")}
          >
            Sales receivables
          </button>
        </div>
        <section className="panel">
          {tab === "receivables" ? (
            <>
              <div className="panel-head">
                <h2>Outstanding sales invoices</h2>
                <button
                  className="btn secondary"
                  onClick={() =>
                    csv(
                      "receivables",
                      orders.filter((o) => o.status === "confirmed"),
                    )
                  }
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
              <SalesTable
                orders={orders.filter((o) => o.status === "confirmed")}
                invoice={(o) =>
                  open(o.confirmCancel ? "cancelSale" : "invoice", o)
                }
                run={(a, b, m) =>
                  a === "order.pay" ? run(a, b, m) : undefined
                }
                busy={busy}
                canCancel={false}
              />
            </>
          ) : (
            <>
              {toolbar(
                "Search expenses or category…",
                [
                  ["all", "All expenses"],
                  ["unpaid", "Unpaid"],
                  ["paid", "Paid"],
                ],
                rows,
                "expenses",
              )}
              {rows.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Expense</th>
                        <th>Category</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((e) => (
                        <tr key={e.id}>
                          <td>
                            <b>{e.description}</b>
                            <small>
                              {e.source === "manual"
                                ? "Manual entry"
                                : "Linked system entry"}
                            </small>
                          </td>
                          <td>{e.category}</td>
                          <td>{fmt(e.date)}</td>
                          <td>{money(e.amount)}</td>
                          <td>
                            <Status value={e.status} />
                          </td>
                          <td>
                            {e.status === "unpaid" ? (
                              <button
                                className="small-btn"
                                onClick={() => open("payExpense", e)}
                              >
                                Mark paid
                              </button>
                            ) : (
                              <span className="muted">{fmt(e.paidDate)}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty />
              )}
            </>
          )}
        </section>
        <p className="page-note">
          Net cash movement is not profit. Invoice tax is a demonstration
          calculation, not a statutory GST return. Purchase totals exclude tax.
        </p>
      </>
    );
  }
  if (route === "audit") {
    const rows = (data.audit || []).filter((a) =>
      match(a, ["actor", "action", "detail"]),
    );
    body = (
      <>
        {title(
          "GOVERNANCE",
          "Activity log",
          "A record of business actions across the workspace.",
        )}
        <section className="panel">
          {toolbar(
            "Search activity, person or reference…",
            null,
            rows,
            "activity",
          )}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Reference</th>
                  <th>Performed by</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <b>{a.action}</b>
                    </td>
                    <td>{a.detail}</td>
                    <td>{a.actor}</td>
                    <td>
                      {new Date(a.date).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}{" "}
                      IST
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  }
  if (route === "users")
    body = (
      <>
        {title(
          "ADMINISTRATION",
          "Access control",
          "Give each team member access to the modules they need.",
          "Add user",
          () => open("user"),
        )}
        <section className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Access</th>
                </tr>
              </thead>
              <tbody>
                {data.users?.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <b>{u.name}</b>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <Status value={u.role} />
                    </td>
                    <td>
                      {
                        {
                          owner: "All modules + user creation",
                          manager: "All business modules",
                          staff: "Inventory and sales",
                          hr: "Employees, attendance, payroll",
                          accountant: "Finance and receivables",
                        }[u.role]
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <p className="page-note">
          Server-side permissions apply to every request. New accounts can sign
          in immediately.
        </p>
      </>
    );
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (mobile ? "open" : "")}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("dashboard");
          }}
        >
          <span className="brand-symbol">N</span>
          <span>
            nexus<span className="brand-light">erp</span>
          </span>
        </a>
        <div className="workspace-selector">
          <span className="workspace-avatar">
            <Building2 size={19} />
          </span>
          <div>
            <b>Northstar Trading</b>
            <small>Business workspace</small>
          </div>
          <span className="demo-badge">DEMO</span>
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav>
          {navs
            .filter(([id]) => id === "dashboard" || can(id))
            .map(([id, label, Icon]) => (
              <button
                key={id}
                className={route === id ? "active" : ""}
                onClick={() => go(id)}
              >
                <Icon size={20} />
                <span>{label}</span>
                {id === "inventory" &&
                  products.filter((p) => p.stock <= p.reorder).length > 0 && (
                    <span className="nav-count">
                      {products.filter((p) => p.stock <= p.reorder).length}
                    </span>
                  )}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <a href="/guide.html" target="_blank" rel="noreferrer">
            <BookOpen size={18} />
            Presentation guide
            <ArrowUpRight size={15} />
          </a>
          <div className="profile">
            <span className="avatar">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <b>{user.name}</b>
              <small>{user.role}</small>
            </div>
            <button
              className="icon-btn"
              aria-label="Sign out"
              onClick={async () => {
                try {
                  await api("/logout", {});
                  setUser(null);
                  setData({});
                  csrf = "";
                } catch (e) {
                  notify(e.message, "error");
                }
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          className="sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-area">
        <header className="topbar">
          <div>
            <button
              className="icon-btn mobile-toggle"
              aria-label="Open menu"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={22} />
            </button>
            <span className="breadcrumb">
              Workspace <ChevronRight size={14} />{" "}
              <b>{navs.find((n) => n[0] === route)?.[1]}</b>
            </span>
          </div>
          <div className="topbar-right">
            <span className="storage-label">
              {storage === "mongodb" ? "MongoDB connected" : "Local demo"}
            </span>
            <span className="top-date">
              <CalendarDays size={16} />
              {today && fmt(today)}
            </span>
            <button
              className="icon-btn"
              title="Refresh workspace"
              aria-label="Refresh workspace"
              onClick={() =>
                refresh()
                  .then(() => notify("Workspace refreshed."))
                  .catch((e) => notify(e.message, "error"))
              }
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </header>
        <main className="content">
          {loadError && (
            <div className="error" role="alert">
              {loadError}{" "}
              <button
                className="text-btn"
                onClick={() => refresh().catch(() => {})}
              >
                Retry
              </button>
            </div>
          )}
          {body}
          <footer className="page-footer">
            <span>Nexus ERP</span>
            <span>All amounts in INR · Academic demo</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className={"toast " + toast.type} role="status">
          {toast.type === "error" ? (
            <AlertTriangle size={20} />
          ) : (
            <CheckCircle2 size={20} />
          )}
          <span>{toast.text}</span>
          <button
            className="icon-btn"
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <Editor
          modal={modal}
          close={close}
          save={save}
          data={data}
          today={today}
        />
      )}
    </div>
  );
}
function Editor({ modal, close, save, data, today }) {
  const { type, row: r = {} } = modal;
  const f = (fd) => Object.fromEntries(fd),
    cents = (v) => Math.round(Number(v) * 100);
  const shared = { onClose: close };
  if (type === "product")
    return (
      <Modal title={r.id ? "Edit product" : "Add product"} {...shared}>
        <Form
          {...shared}
          onSubmit={(fd) => {
            const v = f(fd);
            return save("product.save", {
              ...v,
              id: r.id,
              price: cents(v.price),
              cost: cents(v.cost),
              stock: Number(v.stock || 0),
              reorder: Number(v.reorder),
            });
          }}
        >
          <div className="form-grid">
            <Field
              label="Product name"
              name="name"
              defaultValue={r.name}
              required
              maxLength={160}
            />
            <Field
              label="SKU"
              name="sku"
              defaultValue={r.sku}
              required
              maxLength={40}
            />
            <Field
              label="Category"
              name="category"
              defaultValue={r.category || "Electronics"}
              required
            />
            <Field
              label="Selling price (₹)"
              name="price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={(r.price || 0) / 100}
              required
            />
            <Field
              label="Cost price (₹)"
              name="cost"
              type="number"
              min="0"
              step="0.01"
              defaultValue={(r.cost || 0) / 100}
              required
            />
            {!r.id && (
              <Field
                label="Opening stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                defaultValue="0"
                required
              />
            )}
            <Field
              label="Reorder level"
              name="reorder"
              type="number"
              min="0"
              step="1"
              defaultValue={r.reorder ?? 10}
              required
            />
          </div>
        </Form>
      </Modal>
    );
  if (type === "adjust")
    return (
      <Modal title="Adjust stock" {...shared}>
        <Form
          {...shared}
          submit="Save adjustment"
          onSubmit={(fd) =>
            save("stock.adjust", {
              id: r.id,
              quantity: Number(fd.get("quantity")),
              reason: fd.get("reason"),
            })
          }
        >
          <div className="notice">
            <b>{r.name}</b>
            <p>
              Current stock: {r.stock} units. Enter a positive quantity to add
              stock or a negative quantity to remove it.
            </p>
          </div>
          <Field
            label="Quantity change"
            name="quantity"
            type="number"
            step="1"
            required
          />
          <Field
            label="Reason"
            name="reason"
            placeholder="e.g. physical stock count correction"
            required
          />
        </Form>
      </Modal>
    );
  if (type === "movements") {
    const rows = (data.movements || [])
      .filter((m) => m.productId === r.id)
      .slice()
      .reverse();
    return (
      <Modal title={`Stock history · ${r.name}`} wide {...shared}>
        <div className="form-body">
          <p>
            Current balance: <b>{r.stock} units</b>
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Movement</th>
                  <th>Change</th>
                  <th>Reference</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id}>
                    <td>{fmt(m.date)}</td>
                    <td>{m.type}</td>
                    <td className={m.quantity > 0 ? "green-text" : "danger"}>
                      {m.quantity > 0 ? "+" : ""}
                      {m.quantity}
                    </td>
                    <td>{m.reference}</td>
                    <td>{m.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    );
  }
  if (type === "sale" || type === "purchase")
    return (
      <OrderEditor
        purchase={type === "purchase"}
        data={data}
        today={today}
        close={close}
        save={save}
      />
    );
  if (type === "invoice")
    return (
      <Modal title="Invoice details" wide {...shared}>
        <div className="invoice">
          <div className="invoice-top">
            <div>
              <span className="invoice-brand">
                nexus<span>erp</span>
              </span>
              <h3>Northstar Trading</h3>
              <p>
                Chennai, Tamil Nadu
                <br />
                Academic demonstration business
              </p>
            </div>
            <div>
              <span className="eyebrow muted">SALES INVOICE</span>
              <h2>{r.number}</h2>
              <Status value={r.status} />
              <p>Issued {fmt(r.date)}</p>
            </div>
          </div>
          <div className="bill-to">
            <span className="eyebrow muted">BILL TO</span>
            <h3>{r.customer}</h3>
            <p>{r.email || "Email not provided"}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {r.lines.map((l) => (
                <tr key={l.productId}>
                  <td>
                    <b>{l.name}</b>
                    <small>{l.sku}</small>
                  </td>
                  <td>{l.quantity}</td>
                  <td>{money(l.price)}</td>
                  <td>{money(l.quantity * l.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="invoice-totals">
            <div>
              <span>Subtotal</span>
              <b>{money(r.subtotal)}</b>
            </div>
            <div>
              <span>Demo tax ({r.taxRate}%)</span>
              <b>{money(r.tax)}</b>
            </div>
            <div className="grand-total">
              <span>Total</span>
              <b>{money(r.total)}</b>
            </div>
          </div>
          <p className="invoice-note">
            Sample academic invoice. Not a statutory tax invoice.{" "}
            {r.status === "draft" ? "Draft: stock has not been deducted." : ""}
            {r.status === "cancelled" ? "Cancelled: no payment is due." : ""}
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn secondary" onClick={close}>
            Close
          </button>
          <button className="btn" onClick={() => window.print()}>
            <Printer size={17} />
            Print / Save PDF
          </button>
        </div>
      </Modal>
    );
  if (type === "vendor")
    return (
      <Modal title={r.id ? "Edit vendor" : "Add vendor"} {...shared}>
        <Form
          {...shared}
          onSubmit={(fd) => save("vendor.save", { ...f(fd), id: r.id })}
        >
          <Field
            label="Vendor name"
            name="name"
            defaultValue={r.name}
            required
          />
          <div className="form-grid">
            <Field
              label="Email"
              name="email"
              type="email"
              defaultValue={r.email}
              required
            />
            <Field label="Phone" name="phone" defaultValue={r.phone} required />
            <Field label="City" name="city" defaultValue={r.city} required />
          </div>
        </Form>
      </Modal>
    );
  if (type === "purchaseDetail")
    return (
      <Modal title={r.number} wide {...shared}>
        <div className="form-body">
          <div className="detail-heading">
            <div>
              <h3>{data.vendors.find((v) => v.id === r.vendorId)?.name}</h3>
              <p>Expected: {fmt(r.expected)}</p>
            </div>
            <Status value={r.status} />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit cost</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {r.lines.map((l) => (
                  <tr key={l.productId}>
                    <td>{l.name}</td>
                    <td>{l.quantity}</td>
                    <td>{money(l.cost)}</td>
                    <td>{money(l.cost * l.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="total-line">
            Total <b>{money(r.total)}</b>
          </p>
        </div>
      </Modal>
    );
  if (type === "employee")
    return (
      <Modal title={r.id ? "Edit employee" : "Add employee"} {...shared}>
        <Form
          {...shared}
          onSubmit={(fd) => {
            const v = f(fd);
            return save("employee.save", {
              ...v,
              id: r.id,
              salary: cents(v.salary),
              active: v.active === "true",
            });
          }}
        >
          <div className="form-grid">
            <Field
              label="Full name"
              name="name"
              defaultValue={r.name}
              required
            />
            <Field
              label="Employee code"
              name="code"
              defaultValue={r.code}
              required
            />
            <Field
              label="Email"
              name="email"
              type="email"
              defaultValue={r.email}
              required
            />
            <Field
              label="Department"
              name="department"
              defaultValue={r.department}
              required
            />
            <Field
              label="Designation"
              name="designation"
              defaultValue={r.designation}
              required
            />
            <Field
              label="Monthly base salary (₹)"
              name="salary"
              type="number"
              min="0"
              step="0.01"
              defaultValue={(r.salary || 0) / 100}
              required
            />
            <Field
              label="Joining date"
              name="joined"
              type="date"
              defaultValue={r.joined || today}
              required
            />
            <Field label="Employment status">
              <select
                name="active"
                defaultValue={r.active === false ? "false" : "true"}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </Field>
          </div>
        </Form>
      </Modal>
    );
  if (type === "payroll")
    return (
      <Modal title="Generate monthly payroll" {...shared}>
        <Form
          {...shared}
          submit="Generate payroll entries"
          onSubmit={(fd) => save("payroll.run", { month: fd.get("month") })}
        >
          <div className="notice">
            Creates one salary entry per eligible active employee and an unpaid
            expense for Finance. Existing payroll entries for the same month are
            skipped.
          </div>
          <Field
            label="Payroll month"
            name="month"
            type="month"
            defaultValue={today.slice(0, 7)}
            max={today.slice(0, 7)}
            required
          />
          <p className="muted">
            Uses full base salary. No deductions or attendance proration.
          </p>
        </Form>
      </Modal>
    );
  if (type === "expense")
    return (
      <Modal title="Add expense" {...shared}>
        <Form
          {...shared}
          submit="Create expense"
          onSubmit={(fd) => {
            const v = f(fd);
            return save("expense.create", { ...v, amount: cents(v.amount) });
          }}
        >
          <Field label="Description" name="description" required />
          <div className="form-grid">
            <Field label="Category">
              <select name="category">
                {[
                  "Rent",
                  "Utilities",
                  "Transport",
                  "Marketing",
                  "Office supplies",
                  "Maintenance",
                  "Other",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field
              label="Amount (₹)"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
            />
            <Field
              label="Date"
              name="date"
              type="date"
              max={today}
              defaultValue={today}
              required
            />
          </div>
          <p className="muted">
            The expense starts as unpaid. Record payment after it is settled.
          </p>
        </Form>
      </Modal>
    );
  if (type === "user")
    return (
      <Modal title="Add workspace user" {...shared}>
        <Form
          {...shared}
          submit="Create user"
          onSubmit={(fd) => save("user.create", f(fd))}
        >
          <Field label="Full name" name="name" required />
          <Field label="Email" name="email" type="email" required />
          <Field
            label="Initial password"
            name="password"
            type="password"
            minLength={10}
            maxLength={128}
            required
            autoComplete="new-password"
          />
          <Field label="Role">
            <select name="role">
              {["staff", "manager", "hr", "accountant", "owner"].map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </Field>
        </Form>
      </Modal>
    );
  const confirms = {
    receive: {
      title: "Receive purchase order",
      action: "purchase.receive",
      text: `Receive all ${r.lines?.reduce((a, l) => a + l.quantity, 0)} units from ${r.number}? Stock will increase and an unpaid expense of ${money(r.total)} will be created.`,
      button: "Receive stock",
    },
    cancelSale: {
      title: "Cancel sales order",
      action: "order.cancel",
      text: `Cancel ${r.number}? Any stock deducted by this confirmed order will be restored.`,
      button: "Cancel order",
    },
    cancelPurchase: {
      title: "Cancel purchase order",
      action: "purchase.cancel",
      text: `Cancel ${r.number}? This order will no longer be receivable.`,
      button: "Cancel purchase",
    },
    payExpense: {
      title: "Record expense payment",
      action: "expense.pay",
      text: `Record ${money(r.amount)} paid for ${r.description}? This updates the cash-out total.`,
      button: "Record payment",
    },
  };
  const config = confirms[type];
  if (config)
    return (
      <Modal title={config.title} {...shared}>
        <Form
          {...shared}
          submit={config.button}
          onSubmit={() => save(config.action, { id: r.id })}
        >
          <p>{config.text}</p>
        </Form>
      </Modal>
    );
  return null;
}
function OrderEditor({ purchase, data, today, close, save }) {
  const [lines, setLines] = useState([
      {
        productId: data.products?.[0]?.id || "",
        quantity: 1,
        cost: (data.products?.[0]?.cost || 0) / 100,
      },
    ]),
    [tax, setTax] = useState(18);
  const products = data.products || [];
  const update = (i, k, v) =>
    setLines((ls) =>
      ls.map((l, j) =>
        j === i
          ? {
              ...l,
              [k]: v,
              ...(k === "productId"
                ? { cost: (products.find((p) => p.id === v)?.cost || 0) / 100 }
                : {}),
            }
          : l,
      ),
    );
  const subtotal = lines.reduce(
      (a, l) =>
        a +
        Number(l.quantity) *
          (purchase
            ? Math.round(Number(l.cost) * 100)
            : products.find((p) => p.id === l.productId)?.price || 0),
      0,
    ),
    total = purchase ? subtotal : subtotal + Math.round((subtotal * tax) / 100);
  return (
    <Modal
      title={purchase ? "New purchase order" : "New sales order"}
      wide
      onClose={close}
    >
      <Form
        onClose={close}
        submit={purchase ? "Create purchase order" : "Create draft order"}
        onSubmit={(fd) =>
          save(purchase ? "purchase.create" : "order.create", {
            ...Object.fromEntries(fd),
            taxRate: Number(tax),
            lines: lines.map((l) => ({
              productId: l.productId,
              quantity: Number(l.quantity),
              ...(purchase ? { cost: Math.round(Number(l.cost) * 100) } : {}),
            })),
          })
        }
      >
        {purchase ? (
          <div className="form-grid">
            <Field label="Vendor">
              <select name="vendorId" required>
                {data.vendors?.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Expected delivery"
              name="expected"
              type="date"
              defaultValue={today}
              required
            />
          </div>
        ) : (
          <div className="form-grid">
            <Field
              label="Customer name"
              name="customer"
              placeholder="e.g. Horizon Studio"
              required
            />
            <Field
              label="Customer email (optional)"
              name="email"
              type="email"
              placeholder="customer@example.com"
            />
          </div>
        )}
        <h3>Order items</h3>
        <div className="order-lines">
          {lines.map((l, i) => {
            const p = products.find((p) => p.id === l.productId);
            return (
              <div
                className={"order-line " + (purchase ? "purchase-line" : "")}
                key={i}
              >
                <Field label="Product">
                  <select
                    value={l.productId}
                    required
                    onChange={(e) => update(i, "productId", e.target.value)}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.stock} available)
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Quantity"
                  type="number"
                  min="1"
                  max="10000"
                  step="1"
                  required
                  value={l.quantity}
                  onChange={(e) => update(i, "quantity", e.target.value)}
                />
                {purchase ? (
                  <Field
                    label="Unit cost (₹)"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={l.cost}
                    onChange={(e) => update(i, "cost", e.target.value)}
                  />
                ) : (
                  <div className="field line-price">
                    <span>Unit price</span>
                    <b>{money(p?.price)}</b>
                  </div>
                )}
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Remove line ${i + 1}`}
                  disabled={lines.length === 1}
                  onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                >
                  <X size={18} />
                </button>
              </div>
            );
          })}
        </div>
        <button
          className="text-btn"
          type="button"
          disabled={lines.length >= 50}
          onClick={() =>
            setLines((ls) => [
              ...ls,
              {
                productId:
                  products.find((p) => !ls.some((l) => l.productId === p.id))
                    ?.id || products[0]?.id,
                quantity: 1,
                cost:
                  (products.find((p) => !ls.some((l) => l.productId === p.id))
                    ?.cost ||
                    products[0]?.cost ||
                    0) / 100,
              },
            ])
          }
        >
          <Plus size={16} />
          Add line item
        </button>
        {!purchase && (
          <Field
            label="Demonstration tax (%)"
            type="number"
            min="0"
            max="28"
            step="0.1"
            required
            value={tax}
            onChange={(e) => setTax(e.target.value)}
          />
        )}
        <div className="total-line">
          <span>
            {purchase
              ? "Purchase total (excluding tax)"
              : "Total including tax"}
          </span>
          <b>{money(total)}</b>
        </div>
        <p className="muted">
          {purchase
            ? "The purchase must be approved before receiving stock."
            : "Drafts do not affect stock. Confirm the order to deduct inventory."}
        </p>
      </Form>
    </Modal>
  );
}
createRoot(document.getElementById("root")).render(<App />);
