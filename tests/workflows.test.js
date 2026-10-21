import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createStore } from "../server/store.js";
import { createApp } from "../server/app.js";
import { dateKey } from "../server/seed.js";

// Set TEST_MONGODB_URI to run the same scenarios against a disposable replica set.
test("Integrated ERP workflows and access control", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexus-test-"));
  const file = path.join(dir, "data.json");
  const store = await createStore({
    mongoUri: process.env.TEST_MONGODB_URI || "",
    dataFile: file,
  });
  const server = createApp(store).listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  t.after(async () => {
    await new Promise((r) => server.close(r));
    await store.close();
    await rm(dir, { recursive: true, force: true });
  });
  async function request(url, body, auth = {}, extra = {}) {
    const r = await fetch(base + url, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth.cookie
          ? { Cookie: auth.cookie, "X-CSRF-Token": auth.csrf }
          : {}),
        ...extra,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return {
      status: r.status,
      body: await r.json(),
      cookie: r.headers.get("set-cookie")?.split(";")[0],
    };
  }
  async function login(role) {
    const r = await request("/login", {
      email: role + "@nexus.demo",
      password: "Demo@12345",
    });
    assert.equal(r.status, 200);
    return { cookie: r.cookie, csrf: r.body.csrf };
  }
  const owner = await login("owner"),
    staff = await login("staff"),
    hr = await login("hr"),
    accountant = await login("accountant");
  const state = async (auth = owner) =>
    (await request("/state", undefined, auth)).body.data;
  const cmd = async (action, body, auth = owner) =>
    request("/commands/" + action, body, auth);
  let order, purchase;
  await t.test("requires login and rejects invalid credentials", async () => {
    assert.equal((await request("/state")).status, 401);
    assert.equal(
      (
        await request("/login", {
          email: "owner@nexus.demo",
          password: "wrong",
        })
      ).status,
      401,
    );
  });
  await t.test("blocks missing CSRF and foreign origins", async () => {
    assert.equal(
      (await request("/commands/expense.create", {}, { ...owner, csrf: "" }))
        .status,
      403,
    );
    assert.equal(
      (
        await request("/commands/expense.create", {}, owner, {
          Origin: "https://untrusted.example",
        })
      ).status,
      403,
    );
  });
  await t.test(
    "staff sees only permitted records and cannot mutate HR or stock",
    async () => {
      const s = await state(staff);
      assert(s.products && s.orders);
      assert.equal(s.employees, undefined);
      assert.equal(s.expenses, undefined);
      assert.equal(s.users, undefined);
      assert.equal(s.products[0].passwordHash, undefined);
      assert.equal(
        (await cmd("payroll.run", { month: dateKey().slice(0, 7) }, staff))
          .status,
        403,
      );
      assert.equal(
        (
          await cmd(
            "stock.adjust",
            { id: "p1", quantity: 1, reason: "test" },
            staff,
          )
        ).status,
        403,
      );
    },
  );
  await t.test("HR and accountant records are isolated", async () => {
    const h = await state(hr),
      a = await state(accountant);
    assert(h.employees);
    assert.equal(h.orders, undefined);
    assert(a.expenses);
    assert.equal(a.employees, undefined);
    assert.equal(JSON.stringify(await state()).includes("passwordHash"), false);
  });
  await t.test(
    "creates product with unique SKU and validates money",
    async () => {
      const b = {
        sku: "TEST-01",
        name: "Test product",
        category: "Office",
        price: 50000,
        cost: 25000,
        stock: 10,
        reorder: 2,
      };
      assert.equal((await cmd("product.save", b)).status, 200);
      assert.equal((await cmd("product.save", b)).status, 409);
      assert.equal(
        (await cmd("product.save", { ...b, sku: "BAD", price: -2 })).status,
        400,
      );
    },
  );
  await t.test(
    "draft sale uses server prices without reducing stock",
    async () => {
      const before = (await state()).products.find((p) => p.id === "p1").stock;
      const r = await cmd(
        "order.create",
        {
          customer: "Test Buyer",
          taxRate: 18,
          lines: [{ productId: "p1", quantity: 2, price: 1 }],
        },
        staff,
      );
      assert.equal(r.status, 200);
      order = r.body.result;
      assert.equal(order.lines[0].price, 149900);
      assert.equal(order.total, 353764);
      assert.equal(
        (await state()).products.find((p) => p.id === "p1").stock,
        before,
      );
    },
  );
  await t.test(
    "confirmation deducts stock once and forbids duplicate confirmation",
    async () => {
      const before = (await state()).products.find((p) => p.id === "p1").stock;
      assert.equal((await cmd("order.confirm", { id: order.id })).status, 200);
      assert.equal(
        (await state()).products.find((p) => p.id === "p1").stock,
        before - 2,
      );
      assert.equal((await cmd("order.confirm", { id: order.id })).status, 409);
    },
  );
  await t.test(
    "paid sale enters cash totals and cannot be cancelled",
    async () => {
      assert.equal(
        (await cmd("order.pay", { id: order.id }, accountant)).status,
        200,
      );
      assert.equal((await cmd("order.pay", { id: order.id })).status, 409);
      assert.equal((await cmd("order.cancel", { id: order.id })).status, 409);
    },
  );
  await t.test(
    "overselling rejects atomically without partial deduction",
    async () => {
      const b = await state();
      const r = await cmd("order.create", {
        customer: "Oversell",
        lines: [
          { productId: "p1", quantity: 1 },
          { productId: "p2", quantity: 999 },
        ],
      });
      assert.equal(
        (await cmd("order.confirm", { id: r.body.result.id })).status,
        409,
      );
      const a = await state();
      assert.equal(
        a.products.find((p) => p.id === "p1").stock,
        b.products.find((p) => p.id === "p1").stock,
      );
      assert.equal(
        a.orders.find((o) => o.id === r.body.result.id).status,
        "draft",
      );
    },
  );
  await t.test(
    "cancellation restores confirmed stock exactly once",
    async () => {
      const before = (await state()).products.find((p) => p.id === "p3").stock;
      const r = await cmd("order.create", {
        customer: "Cancel Test",
        lines: [{ productId: "p3", quantity: 3 }],
      });
      const id = r.body.result.id;
      await cmd("order.confirm", { id });
      assert.equal((await cmd("order.cancel", { id })).status, 200);
      assert.equal(
        (await state()).products.find((p) => p.id === "p3").stock,
        before,
      );
      assert.equal((await cmd("order.cancel", { id })).status, 409);
    },
  );
  await t.test(
    "purchase receipt requires approval and posts inventory + payable",
    async () => {
      const before = (await state()).products.find((p) => p.id === "p2").stock;
      const r = await cmd("purchase.create", {
        vendorId: "v1",
        expected: dateKey(),
        lines: [{ productId: "p2", quantity: 20, cost: 160000 }],
      });
      purchase = r.body.result;
      assert.equal(
        (await cmd("purchase.receive", { id: purchase.id })).status,
        409,
      );
      assert.equal(
        (await cmd("purchase.approve", { id: purchase.id })).status,
        200,
      );
      assert.equal(
        (await cmd("purchase.receive", { id: purchase.id })).status,
        200,
      );
      const s = await state();
      assert.equal(s.products.find((p) => p.id === "p2").stock, before + 20);
      assert.equal(
        s.expenses.find((e) => e.source === purchase.id).amount,
        3200000,
      );
      assert.equal(
        s.expenses.find((e) => e.source === purchase.id).status,
        "unpaid",
      );
      assert.equal(
        (await cmd("purchase.receive", { id: purchase.id })).status,
        409,
      );
    },
  );
  await t.test("expense payment is recorded once", async () => {
    const e = (await state()).expenses.find((e) => e.source === purchase.id);
    assert.equal(
      (await cmd("expense.pay", { id: e.id }, accountant)).status,
      200,
    );
    assert.equal(
      (await cmd("expense.pay", { id: e.id }, accountant)).status,
      409,
    );
  });
  await t.test(
    "attendance updates existing day without duplicate records",
    async () => {
      await cmd(
        "attendance.save",
        { employeeId: "e1", date: dateKey(), status: "Absent" },
        hr,
      );
      await cmd(
        "attendance.save",
        { employeeId: "e1", date: dateKey(), status: "Present" },
        hr,
      );
      const rows = (await state()).attendance.filter(
        (a) => a.employeeId === "e1" && a.date === dateKey(),
      );
      assert.equal(rows.length, 1);
      assert.equal(rows[0].status, "Present");
      assert.equal(
        (
          await cmd(
            "attendance.save",
            { employeeId: "e1", date: "2099-12-31", status: "Present" },
            hr,
          )
        ).status,
        400,
      );
    },
  );
  await t.test(
    "payroll creates matching payables and blocks repeat months",
    async () => {
      const month = dateKey().slice(0, 7);
      const r = await cmd("payroll.run", { month }, hr);
      assert.equal(r.status, 200);
      assert.equal(r.body.result.count, 6);
      assert.equal((await cmd("payroll.run", { month }, hr)).status, 409);
      const s = await state();
      assert.equal(s.payroll.length, 6);
      assert.equal(
        s.expenses.filter((e) => e.category === "Payroll").length,
        6,
      );
    },
  );
  await t.test("concurrent confirmations cannot oversell", async () => {
    const p = (await state()).products.find((p) => p.sku === "TEST-01");
    const make = () =>
      cmd("order.create", {
        customer: "Race Test",
        lines: [{ productId: p.id, quantity: 7 }],
      });
    const [a, b] = await Promise.all([make(), make()]);
    const replies = await Promise.all([
      cmd("order.confirm", { id: a.body.result.id }),
      cmd("order.confirm", { id: b.body.result.id }),
    ]);
    assert.deepEqual(replies.map((r) => r.status).sort(), [200, 409]);
    assert.equal((await state()).products.find((x) => x.id === p.id).stock, 3);
  });
  await t.test(
    "owner can create a user and passwords are never returned",
    async () => {
      const r = await cmd("user.create", {
        name: "Test Staff",
        email: "test@example.com",
        password: "Testing@12345",
        role: "staff",
      });
      assert.equal(r.status, 200);
      assert.equal(r.body.result.passwordHash, undefined);
      assert.equal(
        (
          await cmd(
            "user.create",
            {
              name: "No",
              email: "no@example.com",
              password: "Testing@12345",
              role: "owner",
            },
            staff,
          )
        ).status,
        403,
      );
      const login = await request("/login", {
        email: "test@example.com",
        password: "Testing@12345",
      });
      assert.equal(login.status, 200);
    },
  );
  await t.test(
    "audit records and stock movement ledger remain consistent",
    async () => {
      const s = await state();
      assert(s.audit.length > 10);
      for (const p of s.products) {
        assert.equal(
          s.movements
            .filter((m) => m.productId === p.id)
            .reduce((a, m) => a + m.quantity, 0),
          p.stock,
        );
      }
    },
  );
  await t.test("saved data survives a new repository connection", async () => {
    const copy = await createStore({
      dataFile: file,
      mongoUri: process.env.TEST_MONGODB_URI || "",
    });
    const s = await copy.read();
    assert(s.orders.some((o) => o.id === order.id && o.status === "paid"));
    await copy.close();
  });
  await t.test("logout invalidates the session", async () => {
    assert.equal((await request("/logout", {}, staff)).status, 200);
    assert.equal((await request("/state", undefined, staff)).status, 401);
  });
});
