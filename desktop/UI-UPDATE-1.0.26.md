# Counter 1.0.26

New order uses a compact viewport layout with a scrollable item list and an anchored bill summary. The total, save and collection actions stay visible while the item list scrolls. On narrow windows, the summary becomes a bottom dock. The navy navigation can collapse or expand; the preference is stored on this PC.

Native windows fit the current monitor's work area, including Windows DPI scaling and space reserved for the taskbar. Scrollbars are visually hidden; wheel, touchpad and keyboard scrolling remain available. Built-in counter screens, startup messages, settings and local connection errors use English. Existing catalog and historical data are retained.

| Shortcut | Action |
| --- | --- |
| F1 / F2 | Open New order and focus/select the item code input |
| Enter in item search | Select the highlighted item and focus quantity |
| Enter in quantity or unit price | Add the selected item and return to item code |
| F9 | Focus waiter search |
| F8 | Focus table search |
| F7 | Focus order channel tabs; use arrow keys to change channel |
| F4 / Ctrl+S | Save a dine-in draft for the selected waiter |
| F5 / Ctrl+Enter | Save order and queue its normal automatic printing |
| F6 | Save and collect the bill on the primary PC |
| Tab / Shift+Tab | Move between controls |
| Ctrl+Shift+N | Open an independent order window |

Item shortcuts do not operate behind payment dialogs. The secondary PC retains order/print permissions only; this UI update does not enable collections there. Saved waiter drafts, price override rules, local ledger, payment calculations, printer queue and background synchronization remain on their existing paths. Completed saves and payments remain on New order with a fresh entry.

Validation: desktop typecheck; 74 desktop tests, including monitor work-area bounds; Admin typecheck, menu verification and production build; rendered keyboard and layout checks with isolated mock data at 1366×668, 1093×614, 1093×542, 1024×600, 1024×528, 768×600 and 640×600; primary, secondary and independent order windows; 35-line list scrolling with a stationary bill summary. No production sales or physical printer jobs are used by these checks.

Install through the signed Windows update channel during a short break after active saves, printing and synchronization complete. The installer retains local application data. This release does not require a restaurant server update or a database migration.
