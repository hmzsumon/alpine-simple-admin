# Local Server 1.1.12 — replay signed second-PC offline orders once

Use Counter **1.0.31** on both PCs. Once connected to this server, an approved second PC receives an order-only, device/counter/cash-day/cashier/reservation-scoped signed permit. It can queue and print orders locally during a temporary server shutdown for update. Payment and custody remain on the main PC.

Saved orders replay independently with their original prices, actor, printed invoice and stable first-copy print identity. Exact retries return the original accepted order, including any later main-PC payment. Invalid signatures, different PCs, revoked cashier access, changed reservation/history and closed cash days cannot apply financial changes. Duplicate Foodpanda references are retained locally for review without blocking other orders. No database reset or app-data deletion is required.

Download while the current server runs. Both PCs must already be signed in with valid sessions, an open day and prepared offline-order access. Use **Stop and exit**, install under the existing Windows account and reopen the server. Both Counter apps can keep accepting local orders during that restart; they reconnect and sync afterward. On the first upgrade to this capability, prepare both PCs online before relying on it for subsequent updates.

Includes entry discounts, preserved collection-time discounts, exclusive hall printing and the Family Hall default from Server 1.1.11.
