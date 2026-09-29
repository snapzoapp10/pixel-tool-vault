# Pixel Line — AI Subscription, Credit ও Tools Reselling Website

একটি professional, দ্রুত লোড হওয়া, mobile-first website + নিজের admin dashboard। Fancy নয় — trust-building, brand-feel ডিজাইন। Brand color পরে দিলে সহজে বদলানো যাবে (একটি জায়গা থেকে পুরো সাইটের রং নিয়ন্ত্রণ)।

## Customer যা করতে পারবে

- **Home** — কী বিক্রি হয়, কেন Pixel Line বিশ্বাসযোগ্য (verified delivery, support time, রিভিউ), জনপ্রিয় product
- **Shop** — ক্যাটাগরি অনুযায়ী (AI Subscription / AI Credit / Tools License), সার্চ, ফিল্টার, দাম অনুযায়ী সাজানো
- **Product page** — প্ল্যান/ভ্যারিয়েন্ট (1 month / 3 month / credit pack), স্টক অবস্থা, ডেলিভারি সময়, FAQ, নিয়মকানুন
- **Checkout** — login ছাড়াও অর্ডার করা যাবে (guest), চাইলে account খুলে order history দেখা যাবে
- **Payment** — Binance, Bybit, bKash, Nagad, Rocket। প্রতিটির জন্য আপনার দেওয়া নম্বর/wallet address দেখাবে, customer transaction ID + screenshot দিবে → আপনি dashboard থেকে verify করবেন
- **Order tracking** — order ID দিয়ে স্ট্যাটাস দেখা (Pending → Verified → Delivered)
- **Delivery** — যেসব product-এ স্টকে key আছে সেগুলো payment approve হলে সাথে সাথেই customer এর কাছে দেখাবে; বাকিগুলো আপনি dashboard থেকে manual পাঠাবেন
- **আরও পেজ** — About, Contact (WhatsApp/Messenger), FAQ, Terms, Refund Policy, Blog (SEO এর জন্য)

দাম: Bangladesh এর visitor দেখবে BDT (পাশে USD), অন্য দেশের visitor দেখবে শুধু USD। Rate আপনি dashboard থেকে বদলাতে পারবেন।

## Admin Dashboard (শুধু আপনার জন্য)

- **Overview** — আজকের/এ মাসের sale, pending payment সংখ্যা, নতুন customer, best-selling product
- **Products & Tools** — add/edit/delete, ক্যাটাগরি, ভ্যারিয়েন্ট ও দাম, ছবি, স্টক, SEO টেক্সট, feature/hide করা
- **License stock** — প্রতিটি product এর key/credential যোগ করা, কোনটা কোন order এ গেছে দেখা
- **Orders** — সব অর্ডার, স্ট্যাটাস বদলানো, key ডেলিভারি, নোট লেখা
- **Payment verification** — payment proof, transaction ID, এক ক্লিকে Approve / Reject (reject হলে কারণ)
- **Customers** — তালিকা, যোগাযোগ তথ্য, কত টাকার কিনেছে, কয়টা অর্ডার, খারাপ customer block করা
- **Coupons & discount** — কোড, পরিমাণ, মেয়াদ, ব্যবহারের সীমা
- **Payment methods** — কোন মাধ্যম চালু/বন্ধ, নম্বর/wallet address ও নির্দেশনা এডিট
- **Reviews** — customer রিভিউ approve করে সাইটে দেখানো
- **Site settings** — logo, brand color, contact info, USD↔BDT rate, banner/announcement
- **Blog/Pages** — SEO কন্টেন্ট লেখা
- **Activity log** — কে কখন কী বদলেছে

## SEO ও Speed

- প্রতিটি product, ক্যাটাগরি ও পেজের আলাদা title, description, share-image ও clean URL (যেমন `/product/chatgpt-plus-1-month`)
- Server-rendered পেজ, তাই Google সহজেই index করবে; sitemap ও robots.txt, product schema (দাম/স্টক/রিভিউ Google-এ দেখাবে)
- হালকা ডিজাইন, ছবি optimize, অপ্রয়োজনীয় animation নেই — মোবাইলেও দ্রুত

## ধাপে ধাপে কাজ

1. **Design direction** — ৩টি সুন্দর professional ডিজাইন অপশন দেখাবো, আপনি একটি বাছবেন (brand color পরে সহজে বসানো যাবে)
2. Backend চালু করে database তৈরি (product, order, payment, customer, coupon, review, settings) ও নিরাপত্তা নিয়ম
3. Customer website: Home, Shop, Product, Checkout, Order tracking, Account, Policy পেজ
4. Admin dashboard: উপরের সব সেকশন
5. Payment instruction + proof submit + admin verification + auto/manual delivery
6. SEO, sitemap, speed ও মোবাইল টেস্ট, ডেমো product দিয়ে পুরো ফ্লো যাচাই

## প্রযুক্তিগত সংক্ষেপ

- TanStack Start (SSR) + Tailwind; সব রং semantic token, তাই brand color একবারে বদলানো যায়
- Lovable Cloud: Postgres + Auth + Storage (payment screenshot, product image); RLS দিয়ে customer শুধু নিজের data দেখবে
- Admin অধিকার আলাদা `user_roles` টেবিলে (নিরাপদ), সব admin কাজ server-side যাচাই করা
- License key encrypted/protected কলামে, শুধু নিজের delivered order এ দেখা যাবে
- Geo-অনুযায়ী currency server-side ধরা হবে, manual switch-ও থাকবে

## যা আপনার কাছ থেকে দরকার হবে (পরে দিলেও চলবে)

- প্রথম admin হিসেবে আপনার ইমেইল
- bKash/Nagad/Rocket নম্বর, Binance/Bybit wallet address ও network
- Logo এবং brand color (না দিলে আমি একটি professional রং দিয়ে শুরু করবো)
- আসল product তালিকা ও দাম (শুরুতে ডেমো দিয়ে দেখাবো)
