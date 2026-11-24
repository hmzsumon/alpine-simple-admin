# Counter 1.0.29 — continue sales while a bill needs sync review

Requires Local Server 1.1.10 or the matching cloud API to submit isolated reviews.

- Known bill conflicts no longer lock unrelated new orders and payments, including an older persisted Foodpanda conflict. The original command stays in SQLite until a matching server receipt arrives.
- The updated server records rejected bill commands separately, advances the device sequence atomically and continues the remaining outbox. It does not apply rejected money or accept the same event twice.
- Orders and Settings show **Sync reviews** with the saved bill and payment evidence. Bills under review cannot be collected or revised again on this PC. Other sales and printing continue.
- Admin → Counter setup → **Sync reviews** can correct a Foodpanda reference and restore its bill, or mark a rejected change as reviewed without applying it. Related payments are never replayed automatically. A reason is required and the review history remains saved. Resolve pending reviews before closing the cash day.
- Foodpanda reference entry warns about a duplicate. Online checks include current and archived server bills, followed by a second check before saving. An unavailable server check does not block an otherwise valid offline sale; a later collision is isolated for review.
- A signed-in primary counter continues local orders, payments and printing while its session is valid and the server is unavailable. It retains the SQLite outbox across restarts. The secondary order/print PC still requires the server and an open main counter.
- Permission, session, reservation, maintenance and cash-day protection remain enforced. This release does not promise operation without power, a working local database or a valid sign-in.

Update the restaurant server during a short break, then update each Counter app. Close active saves and printing first. Keep the existing Windows account and app data; do not reset the restaurant or delete AppData. Existing conflicted records are retained and submitted to the updated server on reconnect.

Validation: complete SQLite API behavior suite, desktop worker tests, actual Electron/SQLite response-loss and offline continuity smoke, and compact renderer checks. These use isolated temporary records and receipt previews, not live restaurant sales or physical printers.
