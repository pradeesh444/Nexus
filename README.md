# Nexus ERP — Centralized ERP Platform for Small and Medium Businesses

**Student:** Pradeesh A · **Roll:** 310624104225 · **Department:** CSE D · **Guide:** Ms. Nagamani

A working academic implementation of the supplied zeroth-review proposal. It connects inventory, sales, HR, finance and procurement using React, Node.js and Express. MongoDB mode uses the official MongoDB Node driver and separate collections with multi-document transactions. A persistent JSON demo mode runs without a database installation.

## Start here for tomorrow's presentation

1. Install Node.js **22 LTS or newer** from https://nodejs.org if it is not already installed. Node 20.19+ is the technical minimum. Check with `node -v`.
2. Extract the ZIP. Open the `nexus-erp` folder in Terminal / PowerShell or VS Code.
3. Run:

```sh
npm ci
npm start
```

4. Open **http://localhost:4000** in Chrome, Edge or Safari.
5. Sign in as **owner@nexus.demo** with password **Demo@12345**.
6. Keep the terminal open while demonstrating. Press **Ctrl+C** to stop.

The package includes the compiled interface in `dist/`. The first `npm ci` needs internet. After dependencies are installed, the local demo works without internet. No cloud database, API key or paid service is required for demo mode. The server prints `Storage: local-demo` and the interface shows `Local demo`.

You can also run `Start-Windows.bat`, or on macOS run `bash Start-Mac.command` from this folder. These launchers install dependencies if needed, then start the app. If macOS blocks double-clicking a downloaded script, use the Terminal command instead.

**Read `docs/PRESENTATION_GUIDE.md` before presenting.** It includes an exact demonstration, explanation, viva questions and a PPT-to-feature checklist. `public/guide.html` offers the same essentials as a printable web page. The app's Presentation guide link opens it.

## Demo accounts

| Role | Email | Password | Access |
|---|---|---|---|
| Owner | owner@nexus.demo | Demo@12345 | All modules, audit and user creation |
| Manager | manager@nexus.demo | Demo@12345 | All business modules and audit |
| Staff | staff@nexus.demo | Demo@12345 | Inventory read, stock history and sales workflows |
| HR | hr@nexus.demo | Demo@12345 | Employees, attendance and payroll |
| Accountant | accountant@nexus.demo | Demo@12345 | Expenses, sales receivables and invoice viewing |

All business data is fictional. Account names are for classroom demonstration. New users can be created by the owner in Access control. Each API request verifies the role on the server. Passwords are salted and hashed with Node's scrypt. Sessions use HttpOnly SameSite cookies with CSRF tokens and an eight-hour expiry. Sessions end on server restart.

## Functional modules

- **Dashboard:** current stock valuation, recent sales, date-filtered sales totals, seven-day sales chart, attendance and outstanding work. It polls every 15 seconds and refreshes immediately after a local action.
- **Inventory:** add/edit products, unique SKU validation, selling and cost prices, reorder thresholds, stock adjustments with reasons, movement ledger and CSV export.
- **Sales:** multi-item draft orders, server-calculated totals, stock validation, confirmation, payment recording, cancellation before payment, printable invoice/PDF and CSV export.
- **Procurement:** vendor add/edit, multi-item purchase orders, approval, receipt, stock increases and linked unpaid finance expenses. Repeat receiving is blocked.
- **HR:** employee add/edit and inactive status, attendance per date, one attendance record per employee/day, monthly base payroll with duplicate prevention.
- **Finance:** unpaid/paid expenses, receivables, payment recording, total cash in/out and net cash movement. Procurement and payroll generate linked expenses.
- **Governance:** role-scoped records, server permissions, owner user creation and an activity log for successful business commands.

## How the integration works

A sales draft leaves stock unchanged. Confirming it validates every line and deducts stock atomically. Marking it paid adds it to collected cash. Cancelling an unpaid confirmed order restores stock exactly once.

A purchase starts pending. Approval allows receipt. Receipt increases stock and adds an unpaid procurement expense in the same operation. Finance later marks the expense paid.

Payroll produces one salary record and one payable for each eligible active employee/month. Repeating the month cannot duplicate salaries. Attendance is informational and does not change the base salary calculation.

## Use MongoDB for the full MERN configuration

Both modes use the same React interface, Express API, permissions and business rules. **The default local demo is not using MongoDB.** Select MongoDB before describing the live database as MongoDB.

Option A: **Local MongoDB replica set with Docker**

1. Install and start Docker Desktop.
2. In this project folder, run:

```sh
docker compose up -d --wait
```

3. Copy `.env.example` to `.env` (`cp .env.example .env` on macOS/Linux, or `copy .env.example .env` on Windows).
4. Uncomment this line in `.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/nexus_erp?replicaSet=rs0&directConnection=true
```

5. Stop and restart `npm start`. Confirm **MongoDB connected** appears in the top bar.

Option B: supply a MongoDB Atlas replica-set connection string as `MONGODB_URI` in `.env`. Create the database user and allow your machine's IP in Atlas first. Keep credentials private and URL-encode special password characters.

The database is `nexus_erp` by default. Collections: `users`, `products`, `vendors`, `employees`, `attendance`, `orders`, `purchases`, `expenses`, `payroll`, `movements`, `audit`, `meta`.

MongoDB requires a **replica set** because the project uses multi-document transactions. A plain standalone `mongod` is rejected with an explanation. Docker Compose creates a single-node replica set for local development. It binds only to 127.0.0.1 and is not a production database deployment. Do not expose this unauthenticated local database to a network.

Each storage mode has its own data. Switching modes does not migrate records. The sample workspace seeds once when no users exist.

## Development and testing

```sh
npm run dev     # React on localhost:5173 and Express on localhost:4000
npm run build   # Rebuild the compiled frontend after edits
npm test        # Isolated business/API integration tests in local demo mode
```

The app itself does not need the testing browser or MongoDB memory-server tools used during development. Tests use temporary data and do not modify the presentation workspace. To run the same tests against a **disposable, empty** MongoDB replica-set database, set `TEST_MONGODB_URI` and `MONGODB_DB` before `npm test`. Never point tests at business data.

## Project structure

```text
src/main.jsx                 React interface, forms, charts and invoice view
src/styles.css               Responsive layout and print styling
server/index.js              Configuration, startup and graceful shutdown
server/app.js                Express routes, sessions, CSRF and login throttling
server/domain.js             Validation, permissions and business commands
server/store.js              JSON/MongoDB persistence and atomic writes
server/seed.js               Fictional sample data and India date handling
server/security.js           Password hashing and role mapping
public/guide.html            Printable setup and demo guide
tests/workflows.test.js      Integration and access-control scenarios
docs/                        Architecture, presentation guide and validation record
dist/                        Prebuilt React frontend
docker-compose.yml           Local MongoDB replica set
```

Money is stored as integer **paise**, avoiding floating-point rounding in accumulated amounts. Forms display rupees. The demonstration tax rate defaults to 18% and is calculated per invoice. Dates use Asia/Kolkata for business days.

## Reset before a practice demo

Stop the server. To erase all local demo changes and restore seeded records on the next launch:

```sh
npm run reset-demo -- --confirm
npm start
```

The reset command refuses to operate when `MONGODB_URI` is configured. It never deletes a MongoDB database. Copy `data/workspace.json` while the server is stopped if you want to retain a local demo backup.

## Troubleshooting

- **`node` or `npm` not found:** install Node, close Terminal and open it again.
- **Page not opening:** leave `npm start` running and open exactly `http://localhost:4000`.
- **Port already in use:** stop your earlier server with Ctrl+C. Alternatively set `PORT=4001` in `.env`, then open `http://localhost:4001`. Also set `APP_ORIGIN=http://localhost:4001` for the origin check. Development mode uses port 4000 for the API proxy.
- **No interface / missing dist:** run `npm run build`, then `npm start`.
- **Login expired after restart:** sign in again. This is expected.
- **MongoDB unavailable:** start Docker / verify Atlas access, or comment out `MONGODB_URI` to return to local demo mode. MongoDB failures never silently switch storage modes.
- **Unsaved operation:** read the inline validation message. Stock cannot be negative, a PO must be approved before receipt, and paid invoices cannot be cancelled.
- **Want a PDF invoice:** open an invoice, select Print / Save PDF, and choose Save as PDF in the browser print dialog.

## Scope and honest limitations

This is a complete implementation of the defined classroom demonstration, not a production ERP certification. It covers the five modules and basic workflows in the proposal. It does not include payment gateways, bank integrations, statutory accounting, GST filing, statutory payroll, deductions, refunds, partial receipts, invoice discounts, attendance devices, multiple companies or warehouses, email notifications, SSO, password recovery, account suspension, tamper-proof logs, pagination or production monitoring. Employee salary changes affect newly generated payroll only.

The file-based store is for one Node process on one laptop. MongoDB uses a workspace revision document to serialize writes for consistency, which limits write throughput. State reads load the small demo workspace; a large deployment would need paginated queries and aggregation pipelines. Sessions and login throttling are in memory. Default credentials are intentionally public demo credentials. Keep this package on localhost for presentation; public deployment requires a separate security and operations pass.

Dashboard sales include tax and exclude drafts/cancelled orders. Finance net cash movement is not accounting profit or bank balance. Inventory valuation uses current unit cost, not FIFO or weighted-average accounting. Purchase totals exclude tax. Sample opening stock is reconciled to sample sales in the movement ledger.

## References

The uploaded `ERP_Platform_Zeroth_Review.pptx` is the requirements source. See `docs/ARCHITECTURE.md` for the data model and official implementation references. The source deck's literature survey is generic and requires properly selected academic citations before a formal thesis submission; this package does not invent research results.
