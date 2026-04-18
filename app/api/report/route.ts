import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  const { devices } = await req.json();

  const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });

  const deviceList = devices.map((d: Record<string,unknown>, i: number) =>
    `${i + 1}. ${d.appliance} — ${d.wattageMin}–${d.wattageMax}W, used ~${d.dailyHours}h/day`
  ).join("\n");

  const prompt = `You are EcoFlow's AI Home Energy Auditor. Based on this household's scanned appliances:

${deviceList}

Total estimated annual CO2: ${devices.reduce((s: number, d: Record<string,unknown>) => s + Number(d.co2PerYear || 0), 0).toFixed(1)} kg
Total estimated annual cost: $${devices.reduce((s: number, d: Record<string,unknown>) => s + Number(d.costPerYear || 0), 0).toFixed(2)}

Write a compelling, personalized home energy audit report. Include:
1. EXECUTIVE SUMMARY — overall efficiency grade (A-F) and key finding
2. TOP 3 QUICK WINS — specific actions ranked by impact and ease
3. BIGGEST ENERGY OFFENDERS — which devices to prioritize and why
4. 30-DAY ACTION PLAN — week by week changes
5. PROJECTED SAVINGS — realistic $ and CO2 savings if they follow your plan
6. GLOBAL IMPACT — equivalent trees planted, flights avoided, etc.

Be specific, data-driven, and motivating. Use the actual device names. Format with clear sections.`;

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
        controller.enqueue(encoder.encode(`\n\nError generating report: ${e}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}