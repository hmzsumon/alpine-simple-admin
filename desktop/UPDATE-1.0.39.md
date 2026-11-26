# Alpine Counter 1.0.39

কিচেনে অর্ডার পাঠানো এখন সম্পূর্ণ ঐচ্ছিক। অর্ডার সেভ, গ্রাহকের বিল প্রিন্ট, পেমেন্ট ও পরের অর্ডার আগের মতো চলবে। সেভ করা অর্ডারে **কিচেনে অর্ডার পাঠান** চাপলে প্রস্তুতির স্টেশন অনুযায়ী আলাদা বাংলা কপি হবে।

- Admin → Menu & categories → Stations & kitchen printing থেকে স্টেশন ও আইটেম পরিচালনা করুন।
- স্টেশনের কপিতে আইটেমের নাম, দাম, পরিমাণ, ওয়েটার, তারিখ/সময় ও স্টেশনের মোট থাকবে। আপাতত অর্ডারের দায়িত্বে থাকা Counter PC-র বর্তমান প্রিন্টার ব্যবহার হবে।
- একই অনুরোধ আবার পাঠানো বা অ্যাপ রিস্টার্টে ডাবল কপি হবে না। বদলানো অর্ডারের সংশোধিত কপি আলাদাভাবে চিহ্নিত থাকবে।
- Settings → Print queue → Clear print queue অপেক্ষায় থাকা কপি বাদ দেয়; অর্ডার, বিক্রি ও পেমেন্ট অক্ষত থাকে।
- Foodpanda অর্ডারে বাইরের রেফারেন্স লাগবে না। ক্যাটাগরির আলাদা Edit পেজে আইটেম সরানো ও transfer করা যায়; Uncategorized items-এ ক্যাটাগরি ছাড়া আইটেম পাওয়া যায়।

স্টেশনের নতুন সুবিধার জন্য Local Server **1.1.18** এবং Waiter **1.0.22-simple** ব্যবহার করুন। মূল ও দ্বিতীয় Counter PC দুটিই আপডেট করুন। অ্যাপ আপডেট ডাউনলোড করবে; কাজ সেভ করে **Update during break** চাপুন। আপডেট ইনস্টল করার আগে বর্তমান save, print ও sync শেষ করুন।

Validation: 104 Counter tests, 58 API MongoDB tests, 58 Local Server SQLite tests, 63 Waiter tests and isolated Admin/receipt UI checks passed. Existing money-conflict safeguards remain in place.
