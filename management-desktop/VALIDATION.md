# Version 1.0.0 validation

Validated on Windows with disposable accounts and a private QA backend; no production restaurant records or physical printers were used.

- Parent Admin TypeScript check, 199-SKU menu verification and full Next production build passed.
- React production build and native Rust connection/origin tests passed. Tests cover trusted cloud/private addresses, wrong API port, credentials in URLs, lookalike hosts, popup scope and local cookie-origin normalization.
- Capability tests confirm only the bundled launcher has native access. A native remote workspace attempt to invoke `open_workspace` was denied.
- Connection UI exercised at 1366×768, 1093×615, 800×600, 640×520 and 390×844, without horizontal overflow or browser errors.
- Existing Next login, dashboard, orders, menu, tables, staff, profile and guides rendered with the desktop theme. The responsive navigation opened at 800×600. Admin accounts could not see or enter Owner-only Server control and Developer pages. HTTP-only session cookies remained in use.
- Native WebView2 tests passed: Owner sign-in, same-origin report popup with the authenticated session, dynamically written print document, file input, CSV export with verified bytes, and print-script invocation using a stub to avoid physical printing. The debugger was configured to permit the disposable test download.
- Installer-library tests passed for all four app groups, including preserving existing bytes when a same-version build differs.

Screen captures and machine-readable QA results are under `F:\ludo-win\outputs\management-desktop`. These contain test fixtures, not live sales. Hardware printer output and installation on the restaurant's physical PCs have not been tested in this run.

The management workspace still requires its selected running server. Cloud access requires internet. Local Admin is currently available on the Local Server PC only. This application does not replace Counter's independent offline order capture or migrate restaurant data.
