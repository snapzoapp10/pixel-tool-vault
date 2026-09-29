# Homepage UI redesign: glossy, colorful 3D look with scroll animation

এবার শুধু দেখতে কেমন লাগে সেটা বদলাবে। Order, payment, dashboard আর database যেমন আছে তেমনই থাকবে। ছোট ও নির্দিষ্ট কাজ রাখা হয়েছে, যাতে credit কম খরচ হয়।

## যা বদলাবে

1. **নতুন রং ও glossy look**: গাঢ় রঙের background, তার উপর violet, cyan আর pink আলোর আভা। Card-গুলো কাচের মতো স্বচ্ছ ও চকচকে হবে, আর button-এ রঙিন gradient থাকবে। পুরো website-এ (shop, product, checkout) একই রং আপনা-আপনি বসে যাবে।
2. **3D banner**: উপরের বড় অংশে ভাসমান একটি 3D দৃশ্য থাকবে। সেখানে চকচকে গোলক ও রিং ঘুরবে, আর কাচের মতো code editor ও AI chat card ভেসে থাকবে, যাতে "vibe coding / AI app building" ভাবটা আসে। Mouse নড়ালে দৃশ্যটা একটু হেলবে।
3. **Scroll animation**: scroll করলে 3D দৃশ্যটা ঘুরবে ও দূরে সরে যাবে। নিচের section-গুলো একটু বাঁকা অবস্থা থেকে সোজা হয়ে ভেসে উঠবে।
4. **Homepage ছোট করা**: শুধু ৪টি অংশ থাকবে:
   - 3D banner ও "Shop now" button
   - Category (৩টি চকচকে card)
   - জনপ্রিয় product
   - ছোট একটি trust ও CTA অংশ
   
   আগের "how it works" আর review-এর বড় অংশগুলো বাদ যাবে।
5. **Header ও product card**: header কাচের মতো স্বচ্ছ হবে। Product card-এ mouse রাখলে card-টা 3D-ভাবে হেলবে।

## Mobile ও speed

- 3D দৃশ্যটা শুধু banner-এ থাকবে, আর page খোলার পরে load হবে। তাই page দ্রুত খুলবে এবং Google SEO-ও ঠিক থাকবে।
- ফোনে 3D-র কাজ হালকা রাখা হবে। কেউ ফোনে animation কমানোর setting চালু রাখলে animation-ও কম দেখাবে।

## Technical

- `three`, `@react-three/fiber@^9` ও `@react-three/drei@^10` যোগ হবে। Banner-এর 3D অংশ `React.lazy` আর `ClientOnly` দিয়ে শুধু browser-এ load হবে।
- 3D-তে থাকবে `MeshTransmissionMaterial` ও `MeshDistortMaterial` দিয়ে তৈরি চকচকে বস্তু এবং local `Lightformer` environment (বাইরের কোনো সাইট থেকে HDR আনা হবে না)।
- Scroll-এর অবস্থা `window.scrollY` থেকে পড়ে `useFrame`-এ camera ও group নাড়ানো হবে। Section-গুলোর ভেসে ওঠা হবে IntersectionObserver আর CSS 3D transform দিয়ে।
- `src/styles.css`-এর token বদলানো হবে, আর নতুন `--gradient-*`, glass ও glow token যোগ হবে।
- যে file-গুলো বদলাবে: `src/styles.css`, `src/routes/index.tsx`, `Header.tsx`, `ProductCard.tsx`। নতুন file হবে `src/components/site/Hero3D.tsx` আর `Reveal.tsx`।
- কাজ শেষে একবার screenshot নিয়ে যাচাই করা হবে।
