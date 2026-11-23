# Counter 1.0.28

Keeps the developer-only 100-item demo and secondary unpaid item editor from 1.0.27, and removes the long network explanation from the regular sign-in card. Normal sign-in has no demo button. Updates remain available without sign-in.

For developer testing only, run `npm run demo` from the desktop source directory, or start the installed `Alpine Cash Counter.exe` with `--lan-demo`. Sample codes 801–896 add 96 products to the original four demo items. No production server is contacted; the home demo has separate SQLite data and preview printing. Existing demo records are retained.

Secondary order editing requires Local Server 1.1.9 or the updated cloud API. Use **Orders → Edit items** on an unpaid bill. Once any payment is recorded, edits must be handled on the main counter. Main counter collections, price override restrictions, menu records and audit history are retained.
