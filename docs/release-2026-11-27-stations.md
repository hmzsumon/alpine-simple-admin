# Optional station kitchen copies

Counter 1.0.39, Local Server 1.1.18, Waiter 1.0.22-simple (23).

Admin → Menu & categories → Stations & kitchen printing manages station creation, display names (including Bengali print name), deletion of empty stations and item assignment/removal. Items keep their IDs, prices and historical bill snapshots. Items removed from a station appear under Unassigned. Each item has one preparation station.

Kitchen dispatch is optional and independent from saving orders, bill printing and collecting payments. Saving an order queues only the customer bill. Send to kitchen on a saved order or booking creates one Bengali copy per represented station on the responsible Counter PC's current receipt printer. Copies show station, item, price, quantity, waiter, date/time and station total. No additional printer setup is needed now; stable station IDs support later per-station printer setup.

Exact content replays use stable station copy IDs across retries, restarts and local/server synchronization. Changed orders create marked replacement copies, including cancellation notices for stations removed from an already-sent order. Clear print queue preserves print records so cancelled copies do not replay. A saved remote request older than a queue clear is also suppressed on arrival. Deliberate reprint remains available.

Both Counter PCs can send while offline within the existing valid session; phone-to-counter pairing can dispatch saved local bookings. Waiter persists its kitchen request separately from its order draft before transmission and retries the same destination/payload after a timeout. Kitchen errors never add a financial sync conflict or stop ordinary sales.

Update Local Server, both Counter apps and Waiter. The existing Owner/Admin shell opens the updated server/cloud Admin pages. Installers retain all older versions under D:\alppine-restrent\Installers.
