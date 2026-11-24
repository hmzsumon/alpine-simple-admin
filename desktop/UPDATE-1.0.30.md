# Counter 1.0.30 — discount before printing and one waiter receipt per hall

- New order → Bill summary now has **Discount (BDT)** on the main cashier PC. It updates Total payable before saving. The saved order, first queued customer bill, preview and reprint show the discount and net payable. The collection dialog keeps the saved discount instead of subtracting it twice.
- Discounts remain with separate channel drafts and saved waiter drafts. Clearing or saving the entry resets the form. Invalid amounts and discounts greater than the bill cannot be saved. A fully discounted bill records no cash collection. Existing cashier permissions apply; the order-only second PC cannot grant discounts.
- Waiter orders now have one automatic print owner. A connected second PC with a ready printer receives waiter orders for its selected **Preferred hall** only. Those orders do not also print on the main PC. Other halls print on the main PC. Local print IDs still prevent replay after sync, retries or restart. Orders manually entered on a PC still print there.
- On the second PC, set **Settings → Preferred hall on this PC → Family Hall**, enable **Automatically print waiter orders on this PC**, and select its installed receipt printer. Keep both PCs connected. A newly submitted waiter order falls back to the main PC if the second PC is not connected/ready; an already assigned job is not moved automatically because its paper may already have printed.

Install Local Server **1.1.11** first, then update both Counter PCs and sync. A new server snapshot is required to enable entry discounts; the app does not send a discount to an older engine that could ignore it. Keep the existing Windows account and all app data. Finish current saves/printing before installing. No menu, staff or transaction reset is required.

Validated with isolated SQLite sales, cashier audit, discounted print jobs, payment/retry tests and compact keyboard-driven renderer checks. No live restaurant sales or physical printing are performed by these checks.

On a second PC with no saved hall preference, Family Hall is selected automatically at sign-in/connection when it is routed to that counter. An explicitly saved hall selection is preserved and remains editable in Settings.
