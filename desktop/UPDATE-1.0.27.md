# Counter 1.0.27

- The home demo now contains 100 sample menu items. Existing demo bills, history, drafts and recorded prices are preserved when the extra items are added. One order supports up to 80 lines, matching the normal order limit.
- The regular sign-in screen no longer shows a Home Wi-Fi demo button. Developers can launch the isolated mode with `npm run demo` in the desktop source directory, or start the installed executable with `--lan-demo`. It uses its own `home-demo` application-data directory and preview printing; it cannot upload to the restaurant server.
- A connected secondary PC has **Orders → Edit items** for orders in the open cash day that have no payment. Cashier order-edit permission is required. Items may be added or removed, quantities changed, and prices changed only under the existing Fish/Dish price rules. The main menu is not edited.
- The editor cannot change discounts, collections, refunds, the cash drawer, order routing or the primary PC reservation. Changes use the latest bill fingerprint, an audit reason and an idempotent request receipt. Stale revisions and paid orders are rejected by the server. Pending revision requests survive a desktop restart and can be checked or cancelled. Confirmed changes do not duplicate printing; use Bill to print the revised copy.

**Server requirement:** Install Local Server 1.1.9 or use the updated cloud API for secondary item editing. Counter 1.0.27 detects older servers and disables Edit items until the capability is available. Primary collections stay on the main PC. Both PCs must sync the latest order before collecting it.

During installation finish active saves, prints and syncs, and keep the existing AppData. No restaurant setup reset or database wipe is needed.
