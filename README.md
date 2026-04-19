
# ⚡ EcoSnap — See Which Device is Drinking Your Money

> Point your camera at any appliance. Pinch your fingers. Know instantly what it costs you and the planet.

---

## 🌍 The Story Behind This

Last month, my dad got our electricity bill and just stared at it.

He couldn't understand why it was so high. He had no idea which device was the problem. Was it the iron my mum uses every morning? The old fridge that runs all night? The TV nobody turns off?

He just paid it. Like he always does. Because there was no easy way to find out.

That moment stayed with me.

**Millions of families across Nigeria, India, Ghana, Kenya, across the entire world pay electricity bills they don't understand.** Not because they're careless. But because nobody ever made it simple enough to see where the money is actually going.

So I built EcoFlow for Earth Day.

---

## ✨ How It Works

1. **📷 Point** your camera at any electrical appliance
2. **🤌 Pinch** your thumb and index finger together
3. **📊 See** exactly what it costs you per month — in your local currency

No typing. No forms. No complicated settings.

Just point and pinch. Like magic.

---

## 💡 What It Tells You

The moment you pinch, Gemini 2.0 Flash Vision looks at your appliance and tells you:

- **What it is** — even if you don't know the name
- **How many watts it drinks** every hour it's on
- **What it costs you per month** in your local currency
- **Your CO₂ footprint** from that one device
- **One simple habit** to cut the cost immediately
- **A better alternative** available in your country

Then your **live dashboard** builds up as you scan more devices — showing you the full picture of your home's energy use with real charts and real numbers.

---

## 🌱 Why This Matters

- The average household wastes **30% of electricity** without knowing it
- A single electric iron running 2 hours a day costs **₦8,400 per year** in Nigeria
- An old fridge running 24/7 can cost **3× more** than a new efficient one
- If every household reduced energy use by just 10%, we'd offset **hundreds of millions of tonnes of CO₂** every year

**My dad didn't need a lecture about climate change. He needed to know which appliance was eating his money. That's EcoFlow.**

---

## 🚀 Features

- **Real-time gesture detection** — MediaPipe HandLandmarker runs in the browser via WebAssembly. No backend needed for hand tracking
- **AI appliance identification** — Gemini 2.0 Flash Vision identifies the device from a live camera frame
- **Live energy dashboard** — Charts and stats update in real-time as you scan more devices
- **20 countries supported** — Costs shown in local currency: Nigeria ₦, UK £, India ₹, Ghana ₵, Kenya KSh, USA $ and 14 more

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | Frontend framework + API routes |
| **Google Gemini Flash** | Vision AI — appliance identification |
| **MediaPipe HandLandmarker** | Real-time pinch gesture detection (WebAssembly) |
| **Framer Motion** | Animations and transitions |
| **Recharts** | Live energy dashboard charts |

---

## Use of Google Gemini

Gemini Flash lite Vision is the heart of EcoFlow:

- Identifies any appliance from a single camera frame
- Returns structured data — wattage, CO₂, efficiency score, money-saving tips
- Adapts every recommendation to the user's country and local electricity rate
- Makes a complex technical problem feel effortless for anyone — even my dad

---

## 🔧 Running Locally

```bash
# 1. Clone the repo
git clone https://github.com/Valentinetemi/EcoSnap-AI
cd EcoSnap-AI

# 2. Install dependencies
npm install

# 3. Add your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env.local

# 4. Run the app
npm run dev
```

Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com/app/apikey)

---

## 👤 Built by

Valentine Temi — Built for the DEV Earth Day Weekend Challenge 2025.

---

*My dad still doesn't know which appliance was draining our electricity bill.*
*Now he can find out in 3 seconds.*
*That's why I built EcoFlow.* 🌍
