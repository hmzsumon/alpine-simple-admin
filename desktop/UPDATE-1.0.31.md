# Counter 1.0.31 — keep both PCs taking orders during a server update

Install Local Server **1.1.12** first and connect/sync both Counter PCs once. Keep their saved valid cashier sessions and open cash day. The second PC then saves multiple orders, drafts and automatic print jobs in its own SQLite database while the server is temporarily stopped for installation. Main-PC offline orders, payments and printing continue as before. Payment, discounts and drawer custody remain on the main PC.

The second PC sends its saved order queue after the server returns. Each request has a frozen signed menu/session permit, stable order ID and stable print ID. Retry after a lost response returns the original order. Synchronization does not print a second customer copy. Server cash-day, cashier, PC approval, reservation and history checks remain enforced. A business rejection is retained for review while unrelated queued/new orders continue. Saved order and print records survive app restart. Do not delete AppData.

To update during sales: download the installer with the server still running; ensure both PCs are signed in and show offline orders ready; finish current server setup/saves; use Server **Stop and exit**, install using the existing Windows account and reopen Alpine Local Server. Continue using both Counter apps during that short restart. Orders synchronize automatically when the server is ready. New PCs and expired/unprepared sessions still need a server connection. This keeps the counter clients operating; the server API itself briefly restarts.

Includes Counter 1.0.30 entry discounts (the existing collection-time discount remains), first customer-copy discount totals, one automatic waiter printer per hall and Family Hall as the second PC default when no hall was selected.
