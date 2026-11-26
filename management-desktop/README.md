# Alpine Owner & Admin — Tauri + React

Separate Windows application, application ID `com.alpine.restaurant.management`. It neither installs nor replaces Counter or Local Server. Its connection screen is bundled React; the workspace runs the **complete existing Next/React application** in WebView2. No reduced copy of the business screens is maintained.

## Connections

- Cloud: `https://alpine-simple-admin.vercel.app` (internet required).
- On the restaurant Server PC: `http://127.0.0.1:4251` with Alpine Local Server running. Local Admin currently binds to loopback, so it is available on that PC only. Do not enter Counter/Waiter API port 4250. This release does not change server bindings or firewall rules.
- Server-PC Admin can work without internet against the running local service. This is not an independent offline database; server downtime still makes management screens unavailable. Counter's independent order capture remains separate.
- The app never automatically switches between cloud and local databases. Close the current workspace to select another origin; this avoids losing unsaved work or accidentally writing to another restaurant data source.

## Existing features

All current routes remain served by the same application: Overview, Orders and bill editing/collection, Cash register and reconciliation, Sales/category/employee/daily reports and printing, Payment methods, Counter setup, Menu/categories/images and menu-code printing, Tables/floors, Staff/permissions/employee details, My account, Guides, Owner Cloud server control and Developer screens. Existing disabled modules and Owner-only restrictions remain unchanged. Middleware, server layouts, HTTP-only session cookies and API permission checks remain authoritative.

Workspace screen colors are bundled in `src/theme/workspace.css`: navy `#172B4D`, blue `#2563EB`, teal `#087F73`, amber `#D08A19`, background `#F4F6FA`, white panels. Styles apply only to screens; receipt/report print styles remain in the web application. The workspace retains its current responsive sidebar and tables.

Native menus support changing connections, Overview, back, reload, zoom, full screen, printing and guides. Same-origin report/print windows share the workspace's WebView2 profile/cookies. File upload controls and file saving use the standard WebView2/Windows dialogs and download handling. Workspace → Open downloads folder opens the Windows Downloads folder. External HTTPS links open in the default browser rather than replacing an authenticated management window. Remote pages receive **no Tauri capabilities**; only the bundled launcher has `allow-open-workspace`. Addresses and connection preference are saved, never passwords in launcher storage. Loopback `127.0.0.1` Admin addresses normalize to `localhost` to match the local Next server's redirects and keep session scope stable.

## Build

Windows x64 requires Rust MSVC, Microsoft C++ build tools/Windows SDK and Node. Run `npm ci`, `npm run build`, `cargo test --manifest-path src-tauri/Cargo.toml`, then `npm run desktop:build`. The build uses Tauri's `offlineInstaller` WebView2 mode: the installer includes the runtime installer so installation does not require internet. Build-time internet is required to obtain dependencies/runtime. Signing is not configured; no unattended self-updater or Counter update channel is reused.

After building NSIS, `scripts/archive.cjs` copies verified bytes to `D:\alppine-restrent\Installers\Owner-Admin-App\v1.0.0`, with a stable installer name and SHA-256 metadata. Previous installer versions are retained. No credentials or databases are archived.
