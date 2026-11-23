# Developer second-PC demo

From the desktop source directory run:

```powershell
.\node_modules\.bin\electron.cmd scripts/developer-secondary-demo.cjs
```

The launcher uses the built API beside this repository and the built Counter renderer. It starts an API bound only to `127.0.0.1` on an ephemeral port and stores both server and Counter records under a newly created `alpine-developer-second-pc-*` temporary directory. The primary cashier heartbeat is simulated in the same process. Existing restaurant profiles, credentials, databases and server handoffs are not used.

The window opens in second-PC mode with 100 sample items, one unpaid order, edit permission and preview-only printing. **Orders → Edit items** edits the sample bill. **New order** or F1 opens item entry; sample codes include 19, 108 and 801–896. Collections remain unavailable. Closing the demo closes its local API. Each launch creates fresh sample data.

Automated smoke check (hidden window):

```powershell
.\node_modules\.bin\electron.cmd scripts/developer-secondary-demo.cjs --verify-secondary-demo
```

This checks the actual API, desktop main/preload and SQLite paths: 100 items, sample order creation, item revision, preview mode, zero pending uploads and rejection of payment commands.
