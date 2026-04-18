import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return new Response("GEMINI_API_KEY not configured in .env.local", { status: 500 });
  }
  try {
    const { devices, country, currency, ratePerKwh } = await req.json();
    if (!devices?.length) return new Response("No devices", { status: 400 });

    const model = genai.getGenerativeModel({ model: "gemini-flash-latest" });

    const deviceList = devices.map((d: Record<string, unknown>, i: number) =>
      `${i + 1}. ${d.appliance} — ${d.wattageMin}–${d.wattageMax}W, ~${d.dailyHours}h/day`
    ).join("\n");

    const totalCO2 = devices.reduce((s: number, d: Record<string, unknown>) => s + Number(d.co2PerYear || 0), 0);
    const totalCost = devices.reduce((s: number, d: Record<string, unknown>) => {
      const avgW = (Number(d.wattageMin) + Number(d.wattageMax)) / 2;
      return s + (avgW / 1000) * Number(d.dailyHours) * 365 * Number(ratePerKwh || 0.13);
    }, 0);

    const prompt = `You are EcoFlow's AI Home Energy Auditor for a user in ${country || "the world"}.
Local electricity rate: ${ratePerKwh} USD/kWh. Currency symbol: ${currency}

Scanned appliances:
${deviceList}

Total CO2/year: ${totalCO2.toFixed(1)} kg
Total annual cost: ${currency}${totalCost.toFixed(2)}

Write a clear, friendly home energy audit. Use simple language anyone can understand — imagine explaining to someone who has never heard of carbon footprint before. Use ${currency} for all costs.

## ⚡ YOUR ENERGY GRADE
Give them a grade A–F and one sentence summary.

## 🔥 YOUR BIGGEST ENERGY EATERS
Which devices cost the most and why. Use ${currency} amounts.

## ✅ TOP 3 THINGS TO DO THIS WEEK
Simple, specific actions. Include how much ${currency} each saves per year.

## 📅 30-DAY SAVINGS PLAN
Week by week — what to do each week, written simply.

## 💰 YOUR POTENTIAL SAVINGS
How much ${currency} and how much CO2 they could save. Make it feel real and motivating.

## 🌍 YOUR IMPACT ON THE PLANET
Compare their CO2 to trees, car trips, or things they'd understand in ${country}.

Keep it warm, encouraging, and simple. No jargon.

FORMATTING RULES:
- Use ## for section headers
- Use plain sentences, no bullet points with dashes
- Use ✅ ⚡ 💰 🌍 emojis to start key points
- Write numbers clearly: "₦2,400 per month" not "2400NGN/mo"
- Maximum 4 sentences per section
- Sound like a friendly expert, not a robot`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await model.generateContentStream(prompt);
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (e) {
          controller.enqueue(encoder.encode(`\n\nError: ${e}`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    return new Response(`Server error: ${e}`, { status: 500 });
  }
}
