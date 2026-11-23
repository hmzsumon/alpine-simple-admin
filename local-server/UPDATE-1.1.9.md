# Local Server 1.1.9

Adds the online secondary-PC unpaid item revision endpoints for Counter 1.0.27. The authenticated cashier must have order-edit permission, a connected order PC and an open primary counter with a current heartbeat. Only confirmed orders in that counter's current cash day are accepted.

Every edit rechecks that no payment exists and that the bill fingerprint matches. Existing Fish/Dish price rules and revision audit records are used. Discounts, payments, refunds, cash-day records, menu items, print claims and primary counter leases are not changed by this endpoint. Duplicate submissions return the already saved result; edit/cancel races use the same workspace revision fence.

Install over the existing Local Server during a short break, after active saves, printing and synchronization finish. Stop and exit the existing manager before installation, retain its data and settings, then reopen it. Do not cancel the existing cloud setup or create a new restaurant handoff. Counter 1.0.27 is required on secondary PCs to show Edit items.
