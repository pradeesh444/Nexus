# Architecture and implementation notes

## Request flow

React in the browser sends same-origin JSON requests to Express. Login establishes an in-memory session identified by an HttpOnly cookie. All protected requests resolve the current user. Mutating requests additionally validate a CSRF token. Domain commands check the role, validate inputs and enforce workflow transitions. The repository commits the result to either a local JSON file or MongoDB. The interface then fetches role-filtered state.

## API

| Method / route | Function |
|---|---|
| GET /api/health | Storage mode and current India date; no business data |
| POST /api/login | Email/password login and session cookie |
| GET /api/me | Current user, role permissions and CSRF token |
| POST /api/logout | Session invalidation |
| GET /api/state | Role-scoped module records |
| POST /api/commands/:action | Validated atomic business action |

Actions: `product.save`, `stock.adjust`, `order.create`, `order.confirm`, `order.pay`, `order.cancel`, `vendor.save`, `purchase.create`, `purchase.approve`, `purchase.receive`, `purchase.cancel`, `employee.save`, `attendance.save`, `payroll.run`, `expense.create`, `expense.pay`, `user.create`.

## Data model

| Collection | Main fields / links |
|---|---|
| users | id, name, unique email, role, passwordHash |
| products | id, unique sku, name, category, price, cost, stock, reorder |
| vendors | id, name, email, phone, city |
| employees | id, unique code, name, department, salary, joined, active |
| attendance | employeeId + date unique pair, status |
| orders | customer, lines linked to products, saved price/cost snapshots, subtotal, tax, total, status |
| purchases | vendorId, product lines, unit cost, expected date, total, status |
| expenses | amount, category, status, paidDate, source reference |
| payroll | employeeId + month unique pair, saved salary amount |
| movements | productId, signed quantity, type, reference, date |
| audit | actor, action, detail, timestamp |
| meta | shared workspace revision used for write serialization |

Orders and purchases embed their line items. An invoice retains its unit-price snapshot even if the product price is edited later. Payroll retains the salary at generation time. Negative stock is forbidden.

## Atomic persistence

**Local demo:** A promise queue serializes writes. Each command modifies a cloned workspace; a failed command discards it. The repository writes a temporary file then renames it over the live file. The current in-memory state changes only after the write succeeds. This mode supports one server process. It is not designed for concurrent independent Node processes reading the same file.

**MongoDB:** Each mutation runs inside `session.withTransaction`. It updates a common revision record, reads a consistent snapshot, applies the domain command, and writes changed records into the individual collections. Cross-process write conflicts trigger the driver's transaction retry. Unique indexes protect natural keys. The revision lock is intentionally coarse for the small academic workspace; it trades throughput for simple, auditable consistency. Reads also use snapshot transactions.

## Access matrix

| Capability | Owner | Manager | Staff | HR | Accountant |
|---|---|---|---|---|---|
| Inventory read/history | Yes | Yes | Yes | No | No |
| Product edits/stock adjustments | Yes | Yes | No | No | No |
| Create/confirm/cancel sales | Yes | Yes | Yes | No | No |
| View invoices / mark sales paid | Yes | Yes | Yes | No | Yes |
| Procurement and vendors | Yes | Yes | No | No | No |
| Employees/attendance/payroll | Yes | Yes | No | Yes | No |
| Expenses/financial summaries | Yes | Yes | No | No | Yes |
| Activity log | Yes | Yes | No | No | No |
| User creation | Yes | No | No | No | No |

Roles use shared workspace-level access, not record ownership. A staff member can see all sales in the demo company. Manager includes HR/finance access by design.

## Security choices

- Salted scrypt password hashing and timing-safe digest comparison.
- Random session identifiers, HttpOnly SameSite cookies, expiry and logout revocation.
- CSRF tokens for mutations; explicit same-origin allowlist.
- Helmet security headers, bounded JSON bodies, validated input values and server-calculated order prices.
- Login throttling after 20 failed attempts from one IP in 15 minutes.
- No client-provided database filters and no returned password hashes.
- React text rendering for user-entered values; CSV cells guard against spreadsheet formula execution.
- Server defaults to loopback binding. Local database Compose port also binds to loopback.

These controls support the academic demonstration. They are not evidence of an independent security audit. Production additions would include protected account lifecycle, shared sessions and throttling, TLS, backups with restore drills, secrets management, observability and audit retention.

## Business definitions

Sales value = confirmed or paid invoice totals, including demonstration tax. Cash collected = paid invoice totals. Expense payable = unpaid expense amount. Cash paid out = paid expenses. Net cash movement = cash collected less cash paid out, excluding an opening cash balance. Inventory value = sum of current unit cost × current stock. No profit, bank reconciliation or statutory accounting claim is made.

The sample chart uses the last seven India business dates. Sales KPI date ranges are independently selected. Alerts are in-app, not email or SMS notifications. Sample names and customers are fictional.

## Official implementation references

- MongoDB Node driver transactions: https://www.mongodb.com/docs/drivers/node/current/crud/transactions/
- MongoDB transaction requirements: https://www.mongodb.com/docs/manual/core/transactions-in-applications/
- Express security practices: https://expressjs.com/en/advanced/best-practice-security.html
- Express sessions and cookies: https://expressjs.com/en/resources/middleware/session/
- React documentation: https://react.dev/learn
- Node.js crypto / scrypt: https://nodejs.org/api/crypto.html

These are implementation documentation, not a substitute for a formally reviewed academic literature survey.
