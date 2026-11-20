# Alpine Local Server 1.1.0 · SQLite test build

বর্তমান Windows Counter, Android Waiter এবং Admin রেখেই একটি PC-তে লোকাল সার্ভার চলে। নতুন KOT বা অন্য কাজের নিয়ম যোগ করা হয়নি। এই সংস্করণে নতুন সেটআপে SQLite ব্যবহৃত হয়; MongoDB ইনস্টল বা engine download লাগে না। Cloud আগের MongoDB-তেই থাকে।

## প্রথম পরীক্ষা

1. লক্ষ্য PC: Windows 10 x64, Pentium G3260, 4 GB RAM। SSD-তে ইনস্টল করুন। এই নির্দিষ্ট পুরোনো PC-তে installer ও server engine চালিয়ে বাস্তব পরীক্ষা বাকি; development-এর পরীক্ষা অন্য PC-তে হয়েছে।
2. Installer বসিয়ে Alpine Local Server খুলুন। প্রথমে **server engine প্রস্তুত করুন** চাপুন। এটি ইন্টারনেট ছাড়াই SQLite তৈরি ও integrity check করবে।
3. পুরোনো laptop server এখনো active থাকলে এই ধাপেই থামুন। একসঙ্গে দুইটি মূল সার্ভার চালু করা যাবে না। এই পরীক্ষার পুরোনো লোকাল হিসাব স্থানান্তরের প্রয়োজন নেই; পুরোনো cloud enrollment সরিয়ে নতুন PC সক্রিয় করার কাজ আলাদা।
4. নতুন মূল সার্ভার চালুর সময় সব Counter-এর Sync শেষ করে Sign out করুন এবং Waiter-এর অপেক্ষমাণ অর্ডার পাঠান। প্রথম Owner setup-এ ইন্টারনেট লাগবে। Owner-এর বর্তমান mobile/email ও password দিয়ে সেটআপ করুন। Staff/Admin দিয়ে server enrollment করা যাবে না।
5. দেখানো ঠিকানা, যেমন `http://192.168.1.100:4250`, Counter-এর **Restaurant server** এবং Waiter-এর **রেস্টুরেন্ট সার্ভার সেটিংস**-এ দিন। IP-টি সার্ভার PC-এর বর্তমান LAN/Wi-Fi IP হতে হবে। অন্য PC বা ফোনে database বসাতে হবে না।
6. প্রতিটি Counter-এ তার নিজের USB printer নির্বাচন করে Print test slip চালান। তারপর ফোন থেকে একটি পরীক্ষার অর্ডার, bill print ও payment যাচাই করুন। Physical printer এই সফটওয়্যার পরীক্ষায় ব্যবহার করা হয়নি।

## ইন্টারনেট ও নেটওয়ার্ক

প্রথম setup-এর পর একই LAN/Wi-Fi-তে স্থানীয় login, order, bill/payment এবং report চলে। Internet গেলে LAN/Wi-Fi চালু রাখতে হবে। Internet ফিরলে সংরক্ষিত পরিবর্তন cloud-এ যায়। দূর থেকে Admin-এর নতুন কাজের জন্য মূল সার্ভার PC online থাকতে হবে; offline cloud report-এ শেষ সিঙ্কের তথ্য থাকে।

Server PC-এর IP স্থায়ী রাখুন। LAN ও Wi-Fi আলাদা subnet হলে অ্যাপে সেই ডিভাইস থেকে পৌঁছানো যায় এমন server IP দিন। অন্য PC-এর Chrome-এ `http://SERVER-IP:4250/health` খুলে `status: ok` দিয়ে আগে যোগাযোগ যাচাই করুন।

LAN scan-এ PC, ফোন, router বা printer দেখা যেতে পারে; ARP-এর সংখ্যা মোট PC-র নিশ্চিত সংখ্যা নয়। **সংযুক্ত PC ও ফোন** তালিকায় এই server-এ app ব্যবহার করা কর্মী, IP, counter ও last seen দেখায়।

## চালু রাখা

Server PC-এর Sleep বন্ধ রাখুন। Window বন্ধ করলে app tray-তে চলে; **Stop and exit** করলে সার্ভার বন্ধ হয়। Auto-start Windows user sign-in করার পরে চলে। Printer যে Counter-এ লাগানো, সেখানেই printer নির্বাচন করতে হবে।

আগের MongoDB server configuration থাকলে সেটি চুপচাপ SQLite-তে বদলানো বা মুছে ফেলা হয় না। নতুন PC-তে fresh setup SQLite পাবে। বর্তমান টেস্টিংয়ে পুরোনো লোকাল data transfer বাদ দেওয়া হয়েছে। Optional encrypted backup-এর আগের সুবিধা রাখা আছে।

## Developer checks

Local SQLite uses WAL, FULL synchronous commits and serialized transactions. BSON encoding preserves dates, IDs and binary values for the existing cloud protocol. Each business mutation and its outbox pointer commit together. The existing Mongoose schemas, password hooks, API guards, counter leases and request reducers run over a local driver backed by the pinned Mingo query library. This is an adapter for this application's tested operations, not a general MongoDB-compatible database server.

The cloud entry continues to use MongoDB. The opt-in `dist/local-sqlite-server.js` entry installs the SQLite driver before loading models. SQLite files and private session configuration stay on the server PC; Windows DPAPI protects the manager's credentials.

Tests passed: 43 existing simple-app tests on SQLite; 43 on MongoDB; storage rollback/isolation/restart; fake-cloud offline login/order/payment, restart and mirror; remote Admin/password changes; original Admin login/menu; manager resume/startup, encrypted backup and current Electron Counter main/preload/SQLite with preview-only printing.

Build the API, prepare physical API production dependencies and the unchanged Admin standalone runtime, then run `node local-server/scripts/installer.cjs`. Dependency locks changed, so the old code-only `repack.cjs` shortcut must not be used. Use `node local-server/tests/sqlite.integration.cjs --manager`; `QA_PACKAGED_RUNTIME` can select the actual packaged resources for the same checks. QA creates independent databases and refuses occupied test ports. The live restaurant cloud is not contacted by these tests.
