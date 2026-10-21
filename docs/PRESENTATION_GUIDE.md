# Presentation guide for Pradeesh

## What the uploaded PPT asks for

The 10-slide zeroth-review deck proposes a centralized ERP for small and medium businesses. The stated stack is MongoDB, Express, React and Node.js. Its problem is disconnected departmental tools and duplicated records. Its scope is inventory, sales/invoicing, HR/attendance, finance/expenses, procurement/vendors, role-based dashboards and reporting. Payment gateways and external accounting are explicitly future work.

The deck is a proposal, not evidence of completed experiments. Its benefits are expected benefits; do not present invented accuracy, speed or business savings. Its literature survey names broad categories and products but does not give exact academic references.

## What to do before college

1. Extract the project and run `npm ci`, then `npm start`.
2. Open http://localhost:4000 and log in as owner@nexus.demo / Demo@12345.
3. Practise the steps below once. Keep the terminal and browser open.
4. Confirm the storage badge: Local demo or MongoDB connected. Explain the mode honestly.
5. If you want fresh sample data, stop the app, run `npm run reset-demo -- --confirm`, then `npm start` (local demo only).
6. Keep the supplied presentation and screenshot images downloaded for a fallback if the projector or laptop has a problem.
7. Read the viva answers. You should be able to explain the workflow and locate the code you are presenting.

## Opening speech — about 45 seconds

“Good morning. I am Pradeesh A, and my project is a Centralized ERP Platform for Small and Medium Businesses. Small businesses often maintain inventory, sales, employee records and expenses in different spreadsheets. This creates duplicate work and makes it difficult to see the overall business position.

My application brings five departments into a common workspace. The important feature is integration: when a sales order is confirmed, inventory decreases; when a purchase is received, inventory increases and Finance gets an expense. Different users receive access according to their role. I will demonstrate those workflows now.”

If using default demo mode, add: “The application supports MongoDB. For this classroom run I am using its persistent local demo adapter, which works without a database installation.”

## Live demonstration — about 7 minutes

### 1. Dashboard — 45 seconds

Sign in as Owner. Point to sales, unpaid invoices, stock valuation and attendance. Explain that these values derive from module records. The period selector affects the sales KPI; the chart always shows the latest seven days. Counts for stock, attendance and payables describe the current state.

Say: “These figures update when a transaction is saved. Other open sessions refresh approximately every 15 seconds.”

### 2. Inventory — 30 seconds

Open Inventory. Show the USB-C hub at 8 units and reorder level 12. Select Low stock. Explain that the warning comes from comparing the balance to the product's reorder level. Open the stock history to show where balances come from.

### 3. Sales — 90 seconds

Open Sales & invoices, choose New sale, customer **Horizon Studio**, and add **2 Wireless keyboards**. Keep demonstration tax at 18%.

Expected amount: 2 × ₹1,499 = ₹2,998; tax ₹539.64; total **₹3,537.64**.

Create draft. Explain that a draft does not change stock. Confirm the order. Wireless keyboard stock goes from **42 to 40** in a fresh workspace. Mark paid. Open the invoice, then Print / Save PDF.

Say: “The server calculates prices and validates stock. Confirmation changes stock, and payment changes cash collected.”

### 4. Procurement — 75 seconds

Open Procurement and the seeded **PO-0001**. It requests **20 USB-C hubs** from Chennai Tech Supplies for **₹32,000**. Approve it, then Receive stock and confirm the dialog.

Open Inventory: USB-C hub stock changes from **8 to 28**. Open Finance: a **₹32,000 unpaid procurement expense** appears. Explain that one operation creates both changes. Do not claim a supplier payment has happened until you mark the expense paid.

### 5. HR and payroll — 60 seconds

Open People & payroll, then Attendance. Mark Rahul P Present. Switch to Payroll, click Run payroll, select the current month, and Generate payroll entries.

A fresh workspace creates **6 salary records**, totalling **₹2,18,000**, and six unpaid expenses. The current employees joined before the demo month. Explain that the implementation uses full monthly base salary. It does not prorate for attendance or calculate statutory deductions.

### 6. Finance — 45 seconds

Show procurement and payroll expenses alongside manual expenses. Mark one payable paid. Explain cash collected, cash paid out and net cash movement. Net cash movement is not profit.

### 7. Role-based access — 45 seconds

Sign out. Select Staff on the login screen and sign in. Staff sees Overview, Inventory and Sales. HR, Finance and Procurement are absent. The server also refuses forbidden requests, even if someone tries to bypass the menu.

### 8. Close — 30 seconds

“This project demonstrates how a common data store and defined workflows can keep departments consistent. The next stage would add statutory accounting, more detailed payroll, multiple warehouses and external integrations, along with the operational controls required for deployment.”

## Useful backup demonstrations

- **Insufficient stock:** create a sale for 100 USB-C hubs. Confirmation is rejected and no stock is partially deducted.
- **Cancellation:** confirm an unpaid order, then cancel it. Stock returns to the earlier balance.
- **Duplicate receipt:** a received purchase no longer offers Receive stock. The API rejects a repeated receipt too.
- **Duplicate payroll:** running the same month again reports that all eligible employees already have payroll.
- **Persistence:** restart the server, sign in again, and show that business records remain.

## Viva questions and short answers

**1. What is ERP?** Enterprise Resource Planning combines departmental workflows and records in one business application.

**2. Why does an SMB need it?** Separate spreadsheets often duplicate records. A shared system links transactions and makes reports easier to reconcile.

**3. What is MERN?** MongoDB stores documents, Express defines the backend API, React builds the interface, and Node runs server-side JavaScript. Demo mode substitutes a local JSON persistence adapter for MongoDB only.

**4. How are modules connected?** Business commands update related records together. For example, a purchase receipt changes product stock, records stock movements and creates a finance payable.

**5. What is RBAC?** Role-Based Access Control. The server maps each role to allowed modules and checks the permission on each command. It also filters returned data.

**6. Why not rely on hiding buttons?** A user could call the API directly. Server-side permission checks enforce the restriction independently of the interface.

**7. How do you prevent overselling?** The server checks every order line inside the serialized business operation. MongoDB mode uses a transaction plus a shared revision write, so competing confirmations cannot both consume the same balance.

**8. Why is a replica set required?** MongoDB multi-document transactions need a replica set or sharded deployment. The included development setup uses a single-node replica set.

**9. Why store money as paise?** Integer paise avoids accumulating floating-point errors in prices, totals and expenses. The UI formats those integers as rupees.

**10. Is the dashboard truly real time?** It refreshes after local actions and polls every 15 seconds. It does not use WebSockets or streaming updates.

**11. Is this full accounting software?** No. Finance implements expenses, receivables and cash reporting. It is not a double-entry general ledger or statutory accounting system.

**12. Is tax/GST fully implemented?** No. The sales invoice has a configurable demonstration tax percentage. It is not a legal GST invoice or return. Procurement excludes tax.

**13. Is payroll linked to attendance?** Both share employee records, but this basic payroll uses full base salary and does not calculate attendance deductions.

**14. How are passwords protected?** Passwords use a random salt and scrypt. The API never returns the password hash. Sessions use HttpOnly cookies and a CSRF token.

**15. What prevents duplicates?** Unique SKUs and employee codes, one attendance record per employee/day, one payroll record per employee/month, and status checks on confirmation, receipt and payment.

**16. What does the audit log show?** Successful business commands, actor, reference and timestamp. It is not a tamper-proof or regulatory audit system.

**17. What are the scalability limits?** The demo loads a small workspace snapshot and serializes writes. A larger version needs paginated queries, database aggregations, more granular concurrency control, shared session storage and monitoring.

**18. Why is there a local demo adapter?** It makes the same workflows presentable without installing MongoDB. It persists data to disk and is explicitly labelled. It is not a claim that JSON files are MongoDB.

**19. What did you test?** Read `VALIDATION.md` for the exact executed checks. They include cross-module workflows, permissions, duplicate prevention and competing stock confirmations.

**20. What would you add next?** Refunds, partial receipts, statutory payroll/accounting, additional warehouses and external integrations, then a production security and deployment review.

## Proposal-to-implementation checklist

| Requirement in original slides | Implementation | Relevant source |
|---|---|---|
| Inventory and reorder alerts | Product management, low-stock filter, movement ledger | `domain.js`, inventory screen |
| Order processing and invoicing | Draft, confirm, pay, cancel, print invoice | Order commands, Sales screen |
| Employee records and attendance | Employee form, active status, daily attendance | Employee/attendance commands |
| Expense tracking and reporting | Payables, payments, receivables, cash summary | Expense commands, Finance screen |
| Vendors and purchase orders | Vendor form, PO creation, approval, receipt | Purchase commands |
| Role-based dashboards | Five roles, filtered data and server authorization | `security.js`, `view()` |
| Automatic payroll entries | Monthly salary and corresponding payable | `payroll.run` |
| Analytics and notifications | KPI calculations, seven-day chart, low-stock and pending-work alerts | Dashboard |
| Shared source of truth | One selected backend store, atomic commands | `store.js` |
| MERN stack | React + Express + Node + configurable MongoDB | Package and server setup |
| External integrations excluded | No payment/accounting integration | Documented future work |

## Tanglish explanation for practice

“Indha project-la inventory, sales, HR, finance, procurement ellame ore system-la connect pannirukkom. Oru sale confirm panna stock automatic-ah koraiyum. Purchase order receive panna stock increase aagum, Finance-la expense create aagum. Owner-ku full access irukkum; staff-ku avanga work-ku thevaiyana modules mattum access irukkum. Idhanaala departments-ku naduvula manual-ah data copy panna thevai koraiyum.”

“Demo mode-la local file use pannrom. MongoDB connection configure pannina actual MERN database mode-la run aagum. Rendulayum same business rules and API use aagudhu.”
