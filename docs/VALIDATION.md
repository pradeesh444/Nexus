# Validation record

Validation environment: Linux, Node.js 24.19.0, bundled Chromium browser, MongoDB 7.0.24 single-node replica set. Validation completed on 30 September 2026 (India time).

## Executed checks

- Production React/Vite build: passed.
- Local JSON mode: 19 integration scenarios and their parent test, 20 reported tests, all passed.
- MongoDB replica-set mode: the same 19 scenarios and parent test, 20 reported tests, all passed.
- A new repository connection read previously saved paid orders in both modes.
- Automated Chromium UI walkthrough: passed without page JavaScript errors.
- Desktop screenshots and a stable 390-pixel mobile layout reviewed.
- Invoice print-to-PDF rendering checked.
- Presentation exported and checked for package/layout integrity, with all 12 slides visually reviewed.

## Covered integration scenarios

1. Login required and invalid credentials rejected.
2. Missing CSRF token and a foreign Origin rejected.
3. Staff receives only permitted records and cannot change stock/HR.
4. HR and accountant records remain separated.
5. Product creation, unique SKU and amount validation.
6. Sales draft uses server price and leaves stock unchanged.
7. Confirmation deducts stock once.
8. Payment recorded once and paid orders cannot be cancelled.
9. Insufficient stock rejects the entire order without partial deduction.
10. Cancelling a confirmed sale restores stock exactly once.
11. Purchase receiving requires approval and creates stock plus payable.
12. Expense payment recorded once.
13. Attendance updates the same employee/day record.
14. Payroll creates matching expenses and rejects duplicate months.
15. Two competing order confirmations cannot oversell available stock.
16. Owner user creation and no returned password hashes.
17. Audit records exist and the stock movement ledger reconciles.
18. Saved data survives a new repository connection.
19. Logout invalidates a session.

## Browser walkthrough

Owner login, navigation through all modules, creation of a two-keyboard sale, confirmation, payment, invoice view and PDF print, purchase approval/receipt, attendance update, payroll generation, staff role visibility and mobile navigation were exercised. The mobile document did not overflow horizontally; wide tables scroll inside their containers.

## Boundaries of verification

This is not a production security audit, load test, statutory-compliance review or user acceptance test on the student's laptop. Windows/macOS launchers and the Docker Compose startup were supplied but not executed on those platforms. MongoDB's actual persistence adapter was executed against a local replica set; Atlas networking was not tested. Chromium browser checks do not establish compatibility with every browser/version. The student should run the supplied setup and rehearse once on the presentation laptop.

No performance, accuracy or business-savings metrics have been invented.
