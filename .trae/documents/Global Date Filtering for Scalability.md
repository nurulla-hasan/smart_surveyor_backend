# Blocked Dates এবং Dashboard-এ তারিখ ফিল্টার যোগ করার পরিকল্পনা

প্রজেক্টকে সম্পূর্ণ স্কেলেবল করার জন্য আমি নিম্নলিখিত পরিবর্তনগুলো করার পরিকল্পনা করছি:

## ১. Blocked Dates আপডেট
[blockedDate.controller.ts](file:///c:/Users/golap/Desktop/smart-surveyor-api/src/controllers/blockedDate.controller.ts) ফাইলে `month` এবং `year` প্যারামিটার যোগ করা হবে।
- **কাজ:** ক্যালেন্ডারে যে মাসটি লোড হবে (যেমন: February 2026), ফ্রন্টএন্ড থেকে `?month=2&year=2026` পাঠালে শুধু ঐ মাসের অফ-ডে গুলো আসবে। এতে ডাটা লোডিং ফাস্ট হবে।

## ২. Dashboard আপডেট
[dashboard.controller.ts](file:///c:/Users/golap/Desktop/smart-surveyor-api/src/controllers/dashboard.controller.ts) ফাইলে `year` প্যারামিটার যোগ করা হবে।
- **কাজ:** বর্তমানে শুধু বর্তমান বছরের স্ট্যাটাস দেখায়। পরিবর্তনের পর ইউজার চাইলে গত বছরের বা নির্দিষ্ট বছরের ইনকাম ও বুকিং স্ট্যাটাস দেখতে পারবেন (যেমন: `?year=2025`)।

## ৩. Postman Collection আপডেট
এই নতুন প্যারামিটারগুলো (month, year) পোস্টম্যানের সংশ্লিষ্ট রিকোয়েস্টগুলোতে যোগ করে দেওয়া হবে।

এই পরিবর্তনগুলো করলে আপনার অ্যাপের সব ক্যালেন্ডার সেকশন প্রফেশনাল এবং স্কেলেবল হয়ে যাবে। আপনি অনুমতি দিলে আমি কাজ শুরু করব।