# Alpine Cash Counter for Windows

Offline-first cashier desktop for Windows 10/11 x64. Electron, React, TypeScript and a SQLite worker share the backend's audited money rules. Owner/Admin continue using the existing web panel. No local MongoDB installation is needed.

## Cashier setup

1. Install the latest version from https://alpine-simple-admin.vercel.app/download/windows . The initial Windows installer has no commercial publisher certificate; do not use an installer from an unknown source.
2. Connect to the internet, sign in with your cashier account and choose a vacant counter or accept a handover. Open the day with actual opening cash.
3. Select the installed physical 80mm receipt printer in Settings. Select RONGTA / 80mm thermal - direct auto cut (the default). It sends English receipt text and cutter commands straight through Winspool, avoiding Chromium custom-page blank receipts. Use Print test slip. For other printers select Windows driver and configure 80mm paper, no margins and Full cut in the driver.
4. Search an item code/name, select it, enter quantity and press Enter. The search clears after quantity is added. F5 saves the local order and queues the bill; Parcel adds a separate token. Collect payment from Orders. Collection does not auto-print another copy.
5. Local orders, corrections, refunds and USB printing work offline during the valid eight-hour signed-in session. Internet is required for a new login, receiving waiter-phone orders, synchronization, handover/release and downloading updates. A LAN printer still needs its local network.
6. Keep the app open for incoming orders. Sync all pending transactions and finish drafts/printing before a handover or update. Use Orders → Reprint only when needed.

## Data and reconciliation

The database and Windows-encrypted session are stored under Electron userData in the Windows profile, outside the install folder. Uninstalling does not delete app data. Use Settings → Save local backup regularly. Do not delete app data, move to a new PC or reinstall Windows before syncing and backing up.

Each money command saves its resulting state, exact sequential outbox event and automatic print intent in one SQLite transaction (WAL + FULL). The server atomically applies the same reducer and records the event hash/sequence alongside its counter state. Retries acknowledge the existing event; they do not apply money twice. Menu grants are server-signed; old invoices retain their captured prices. Only the Fish category permits a per-order price override.

A cashier holds one drawer; a drawer has one desktop writer. Transfer intents are saved before sending. Durable server receipts make handover/release retries safe even after another PC takes the drawer. An interrupted transfer resumes on reconnect or after the original cashier signs in again.

Browser financial writes and financial reset are blocked while it is reserved, but online waiter orders remain available. Disabling a staff account is enforced when requests reach the server; an offline PC cannot learn changes before reconnecting. Do not share Windows profiles or cashier credentials.

Conflicting money changes stay in the outbox and stop new financial writes for Owner review. They are never silently overwritten. Unseen waiter orders can prevent a saved closing from being accepted; only that rejected closing is rolled back, retaining all acknowledged money. Sync and settle those bills before closing again. A saved but unconfirmed closing blocks opening another day. Hardware loss requires developer-assisted recovery from the original disk/backup; there is no unsafe force release that discards an unknown outbox.

Print intents have stable IDs. Claim-response loss recovers the same job. A crash during driver submission marks the job uncertain and pauses the queue. Check the physical paper before marking it reviewed or requesting Reprint. Driver acceptance cannot prove physical delivery, paper availability or cutter behavior.

## Development

From this folder, run npm ci, npm run typecheck, npm test and npm run dist. Run npm test in the sibling alpine-api repository, plus the admin typecheck/menu validation/build before deploying changes. scripts/share-core.cjs copies only the listed pure TypeScript source files from ../../alpine-api; it never copies server configuration or secrets. The generated shared folder is committed so clean checkouts retain the exact rules for their release; rebuilding in this monorepo refreshes them from the API.

Electron's node:sqlite runs in a worker. The native Winspool helper is compiled with the Windows .NET Framework C# compiler, bundled outside ASAR and run with explicit arguments in a hidden child process. It checks complete writes and returns a spool-job acknowledgement; timeouts remain uncertain and are not retried automatically. Build on Windows with its .NET Framework compiler available.

The renderer uses a narrow sandboxed preload and cannot access credentials, the filesystem or arbitrary IPC. Production connects only to Alpine's configured origin; private restaurant LAN servers can be selected on the login screen. The server needs the existing strong JWT_SECRET to sign catalog grants. No client MongoDB or Cloudinary secret is bundled.

## Releasing updates

Increase package version, run all checks, build the NSIS x64 installer, and commit/push the reviewed code. Run node scripts/publish.cjs from this folder. GitHub credentials are read privately through Windows Git Credential Manager. Set ALPINE_DESKTOP_SIGNING_KEY to the backed-up Ed25519 private key outside Git if its default local tooling path is unavailable. Never regenerate the key casually or put it in a repository. The app embeds only its public key.

The script creates counter-vVERSION with the installer and signed counter-update.json, using make_latest=false so the Android waiter latest release remains intact. It also publishes signed metadata to the dedicated counter-latest prerelease channel; discovery uses its permanent CDN asset rather than the GitHub API. The app checks the centrally cached Alpine metadata endpoint at startup and every six hours, verifies metadata signatures and installer size/SHA-256, and verifies the file again before installation. Downloads do not interrupt sales. Installation is manual during a break after syncing, with a local backup first. These Alpine release signatures are separate from Windows Authenticode; obtain a commercial publisher certificate for a trusted-publisher Windows experience.

The application was exercised on Windows 11 with isolated SQLite/MongoDB data and the real Electron renderer. The RONGTA USB direct-print path was physically confirmed on 2026-11-19: text, full BDT amounts, change and automatic cutting. Windows 10 hardware still requires acceptance testing.
