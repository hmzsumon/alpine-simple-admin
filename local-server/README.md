# Alpine Local Server · Windows

বর্তমান Counter, native Android Waiter ও Admin-এর কাজের নিয়ম রেখে একটি রেস্তোরাঁর PC-কে কেন্দ্রীয় সার্ভার করা হয়। নতুন KOT/ইনভেন্টরি ফিচার চালু করা হয়নি।

## রেস্তোরাঁয় বসানো

1. সার্ভারের জন্য নির্দিষ্ট Windows 11 x64 PC ব্যবহার করুন। সেটআপের সময় ইন্টারনেট, পর্যাপ্ত খালি জায়গা এবং Windows Private network প্রয়োজন। MongoDB অন্য কাউন্টার PC বা ফোনে লাগবে না। মূল PC-তে MongoDB 8.0.38 বা নতুন 8.0 patch থাকলে তার engine ব্যবহার হবে; না থাকলে অফিসিয়াল 8.0.38 ZIP checksum মিলিয়ে ব্যক্তিগত engine ডাউনলোড হবে। বিদ্যমান MongoDB service/data পরিবর্তন করা হয় না।
2. সার্ভার ইনস্টলার চালিয়ে `Alpine Local Server` খুলুন। `প্রথমে server engine প্রস্তুত করুন` চাপুন। প্রথমবার engine download বড় হতে পারে; progress দেখাবে এবং এই সময়ে আগের অ্যাপে কাজ চলতে পারে। প্রস্তুত হলে প্রত্যেক কাউন্টারের Sync শেষ করে Sign out করুন। ওয়েটারদের অপেক্ষমাণ অর্ডারও পাঠিয়ে দিন। তারপর Owner-এর বর্তমান mobile/email ও password দিন এবং released-counter checkbox টিক দিয়ে সেটআপ করুন। সাধারণ staff/Admin অ্যাকাউন্ট দিয়ে handoff করা যায় না।
3. সফটওয়্যার ব্যাকআপ তৈরি করে মেনু, কর্মী, পারমিশন, হল/টেবিল ও হিসাব লোকালে আনবে। অসম্পূর্ণ import আবার শুরু করা যায়; পুরোনো ব্যবসার রেকর্ড overwrite করা হয় না। প্রস্তুতির সময় নতুন cloud কাজ সাময়িক বন্ধ থাকে। অসম্পূর্ণ handoff ১৫ মিনিটে মেয়াদ শেষ হলে cloud-এর আগের ব্যবস্থা চালু থাকে; manager থেকে cancel করে আবার শুরু করুন। সক্রিয় সার্ভারকে ইচ্ছেমতো অন্য PC-তে পুনরায় handoff করা যাবে না।
4. সার্ভারে দেখানো LAN ঠিকানাটি নিন, যেমন `http://192.168.1.50:4250`। router-এ এই PC-র জন্য DHCP reservation দিন। `Private LAN-এ সংযোগ দিন` চাপলে শুধু Private network ও LocalSubnet-এর API port খোলার জন্য Windows অনুমতি চাইবে। MongoDB-র port LAN-এ খোলা হয় না।
5. বর্তমান Windows Counter-এর login screen-এ `Restaurant server` এবং Android Waiter-এর `রেস্টুরেন্ট সার্ভার সেটিংস`-এ এই ঠিকানা দিন। বর্তমান কর্মী অ্যাকাউন্টেই লগইন হবে। এই কেন্দ্রীয় সার্ভারের জন্য পুরোনো ৬ সংখ্যার Wi-Fi pairing প্রয়োজন নেই।
6. প্রতিটি কাউন্টার PC-তে তার নিজের USB printer নির্বাচন করুন। প্রথমে একটি পরীক্ষার অর্ডার ও বিল যাচাই করুন। বিদ্যমান bill/token/tea kitchen-copy এবং Foodpanda-র প্রিন্টের নিয়ম অপরিবর্তিত।
7. সার্ভারের `Admin খুলুন` দিয়ে মূল PC-তেই বর্তমান Admin ব্যবহার করা যায়। ইন্টারনেট ছাড়া লোকাল login/order/payment/report কাজ করে। Internet ফিরলে সিঙ্ক নিজে থেকে চলে। অনলাইন Admin দিয়ে দূর থেকে পরিবর্তন করতে মূল PC চালু ও online থাকতে হবে; PC offline থাকলে cloud-এ শেষ সিঙ্কের রিপোর্ট দেখা যায়, নতুন পরিবর্তন গ্রহণ করা হয় না।

## সংযুক্ত PC ও ফোন

সার্ভার ম্যানেজারের তালিকায় এই API-তে যুক্ত অ্যাপ, কর্মী, IP, কাউন্টার ও last seen দেখা যায়। গত ৯০ সেকেন্ডে authenticated request হলে সক্রিয় দেখায়। এটি Wi-Fi router-এর সব ডিভাইস scan করে না এবং remote cloud Admin-কে LAN device হিসেবে দেখায় না। Session token তালিকায় প্রকাশ হয় না।

## LAN কেবল লাগিয়ে নেটওয়ার্ক পরীক্ষা

সেটআপ বা Owner login করার আগেই `LAN / নেটওয়ার্ক পরীক্ষা` ব্যবহার করা যায়। রেস্তোরাঁর LAN কেবল লাগান, `সংযোগ দেখুন` চাপুন এবং আসল Ethernet adapter বেছে নিন। Wi-Fi দিয়ে পরীক্ষা করতে চাইলে Wi-Fi বেছে নিন। এরপর `নেটওয়ার্ক পরীক্ষা করুন` চাপুন।

নিজের PC-র নাম/IP, adapter link ও speed, Windows Private/Public profile, gateway/router এবং পাওয়া LAN ডিভাইসের নাম/IP/MAC ও ping সময় দেখা যায়। এ জন্য অন্য PC-তে Alpine app ইনস্টল থাকা দরকার নেই। অ্যাপে যুক্ত PC/ফোনের তালিকা আলাদা।

শুধু নির্বাচিত private IPv4 LAN পরীক্ষা হয়; একবারে সর্বোচ্চ একটি /24 অংশে সীমিত ICMP probe এবং Windows ARP neighbour তথ্য ব্যবহার করা হয়। বড় subnet হলে কোন অংশ পরীক্ষা হয়েছে তা দেখায়। Router বা PC firewall ping/discovery বন্ধ রাখলে উত্তর নাও আসতে পারে। ARP-এর পুরোনো এন্ট্রি থাকতেও পারে। তাই “পাওয়া ডিভাইস” সংখ্যা সব PC-র নিশ্চিত মোট সংখ্যা বা কেবল নষ্ট হওয়ার চূড়ান্ত পরীক্ষা নয়। Internet ছাড়া এই পরীক্ষা চলে।

## দৈনিক ব্যবহার ও ব্যাকআপ

- মূল PC ও router চালু রাখুন। Internet না থাকলেও LAN/Wi-Fi বন্ধ করা যাবে না। Window বন্ধ করলে সার্ভার tray-তে থাকে। Tray থেকে Stop and exit দিলে লোকাল পরিষেবা বন্ধ হবে। Windows-এ user sign-in করার পরে auto-start চলে; Windows login হওয়ার আগের service হিসেবে এই সংস্করণ চালু হয় না।
- `ব্যাকআপ সংরক্ষণ` দিয়ে অন্য drive-এ password-সহ encrypted backup রাখুন। Password হারালে backup খোলা যাবে না। Bootstrap backup এবং local MongoDB আলাদা folder-এ থাকে; uninstall app data মুছে দেয় না।
- server PC বদলানো/সম্পূর্ণ restore একটি migration; অন্য PC-তে পুরোনো server-এর পাশাপাশি clone চালাবেন না। Developer-কে encrypted backup ও চলমান server-এর অবস্থা দিন।
- মূল PC নষ্ট/বন্ধ থাকলে LAN waiter কাজ করবে না। কাউন্টার তার বর্তমান বৈধ session-এ আগের offline SQLite ব্যবস্থায় কাজ করতে পারে; server ফিরলে সিঙ্ক হবে।
- app update বসানোর আগে সব কাউন্টারের sync শেষ করুন এবং server-এর backup নিন। Counter ও Waiter-এর বর্তমান update channel আলাদা থাকে।

## Developer architecture ও validation

Dedicated authenticated loopback MongoDB single-node replica set, existing Express API on LAN, existing Next Admin standalone on loopback, DPAPI-protected manager configuration. Cloud handoff is inactive by default. One local authority captures MongoDB change streams into a durable outbox and sends sequenced, frozen BSON batches. On restart it reconciles current IDs with acknowledged/pending IDs, including deletions, before opening a fresh live stream; the last committed Windows writes do not depend on a stale resume token. Mirror replacement/deletion plus checkpoint commits atomically. Auth sessions, login buckets, push devices and relay credentials are excluded.

Cloud business requests are encrypted relay jobs delivered outbound to the restaurant PC. Existing local role/permission guards run under a MongoDB transaction with a durable result ledger. Committed local operations return immediately; the durable background mirror does not delay their response. Subsequent online reads use the same local authority; offline cloud reports show the last mirror. Timed-out requests are reported as unconfirmed; no blind automatic payment or printing retry occurs. Cloud JWT signing secrets are never exported. Initial encrypted bootstrap includes only the existing password-vault/developer-backup keys, developer-code hash and Cloudinary account name needed for compatibility.

Tests use dedicated localhost replica-set ports and generated fake databases. Current Counter main/preload/SQLite, offline staff login/order/payment, restart, cloud mirroring, remote password change, original local Admin cookies/pages, encrypted backup decryption and device presence are exercised. Physical printer testing must be completed on the restaurant PC. The test laptop is never activated as the live cloud authority.

Build with `node local-server/scripts/package.cjs` from the Admin repository after installing the existing project/desktop build dependencies. `runtime`, `dist`, MongoDB files and installer output are ignored by Git. Runtime packaging explicitly includes physical production dependencies so developer junctions cannot be required on the restaurant PC.

From `local-server`, run `npm run test:network` for bounded Windows link/self-ping checks and `npm run test:integration` for the isolated full system. Integration refuses to run if any reserved QA port is already occupied. Set `ALPINE_QA_MONGOD` to a MongoDB 8.0 executable if it is not in Program Files. Set `QA_PACKAGED_RUNTIME` to `release/win-unpacked/resources` to verify the actual packaged API/Admin, not the developer dependency tree. QA proof files are written to a generated temporary folder and their path is printed.

## v1.0.1 — interrupted setup recovery

Local startup waits up to 120 seconds for cold database/index initialization and uses direct loopback HTTP independently of proxy settings. A timed-out API child is stopped before the error is shown, and resume/cancel clean only processes owned by this manager. Existing MongoDB data and encrypted import backups are retained. A partial API/Admin start is recovered as a pair; active setup cannot be cancelled accidentally. Sanitized startup logs are stored in the server profile’s `logs` folder.

Use `npm run test:startup` for slow-start, failed-start retry, private identity, secret-redaction and active-service regression checks. `node scripts/repack.cjs` reuses the checksum-verified initial dependency payload only when the Admin/API dependency locks are unchanged; it verifies the complete new installer’s embedded code. For dependency changes use the full `package.cjs` build.
