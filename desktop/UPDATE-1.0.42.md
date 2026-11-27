Kitchen orders are a separate Counter workspace. Main and second Counter PCs choose station-assigned items and print preparation slips without creating a sale, customer bill or payment. Every station gets its own compact Bengali copy. The normal order form and Orders lists have no kitchen buttons. Nothing is selected from historical bills automatically.

Use Save and Print (সেভ এন্ড প্রিন্ট) to explicitly queue one separate copy per station. Unassigned or retired-station items are skipped without blocking the other station copies; an entirely unassigned selection prints nothing.

Saved kitchen slips have a separate durable outbox and synchronize to a read-only Owner/Admin history page. Admin can inspect the counter, creator, waiter, items, quantities and time, with no print/edit/delete controls. Offline slips stay on the originating PC and print there; reconnect uploads them without replaying paper.

Background Counter and cloud mirroring use 30-second intervals. New second-PC financial bills upload promptly, and main-counter Sync now starts a fresh read after an older background pass. Manual sync leaves local order entry usable. Reconnection triggers catch-up. Print polling no longer creates a sync feedback loop, and a slow Admin process is recovered without restarting the order API.

Kitchen receipts use smaller text and spacing; customer bills stay unchanged. Update both Counter PCs to 1.0.42 and Local Server to 1.1.21.
