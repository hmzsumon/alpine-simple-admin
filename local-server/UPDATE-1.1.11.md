# Local Server 1.1.11 — saved entry discounts and exclusive hall printing

Use with Counter **1.0.30**. Initial cashier order discounts are validated and saved before any customer bill is queued. Audit identity, net bill, payment and reports retain the same amount. Negative, malformed and excessive discounts are rejected. Waiter and order-only secondary PC discount permissions remain unchanged.

Waiter orders get one automatic printer owner in the same atomic save as the order. Family Hall can print only on the second PC when its Preferred hall is Family Hall, automatic waiter printing is enabled and its printer is ready. Other halls print on the main PC. Atomic claims, retries and local print IDs prevent both PCs from automatically printing the same customer copy. A returning second PC cannot replay a copy already assigned to the main PC. Manual order printing and main-PC payment remain available.

Finish active saves and use **Stop and exit**, install with the existing Windows account, reopen the server, then update and sync both Counter PCs. On the second PC choose **Settings → Preferred hall on this PC → Family Hall**, enable automatic waiter printing and select the physical printer. No data deletion or restaurant reset is needed.

On a second PC with no saved hall preference, Family Hall is selected automatically at sign-in/connection when it is routed to that counter. An explicitly saved hall selection is preserved and remains editable in Settings.
