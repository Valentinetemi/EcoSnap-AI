import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const PROMPT = `You are EcoFlow's AI Energy Auditor. Analyze this image and identify the primary electrical appliance visible.

Return ONLY a valid JSON object with no markdown, no backticks:
{
  "appliance": "specific appliance name",
  "category": "one of: heating|cooling|computing|kitchen|lighting|entertainment|laundry|other",
  "wattageMin": <number in watts>,
  "wattageMax": <number in watts>,
  "dailyHours": <estimated typical daily usage hours as number>,
  "habitChange": "one specific, actionable habit to reduce energy use",
  "alternative": "one specific energy-efficient product alternative available globally",
  "efficiencyScore": <number 1-10, where 10 is most efficient>,
  "co2PerYear": <estimated kg of CO2 per year based on average usage>,
  "costPerYear": <estimated USD cost per year at $0.13/kWh>,
  "funFact": "one surprising energy fact about this appliance"
}

If no appliance is clearly visible, return: {"error": "No appliance detected"}`;

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const model = genai.getGenerativeModel({ model: "gemini-flash-latest" });

    const result = await model.generateContent([
      { inlineData: { mimeType: "image/jpeg", data: image } },
      PROMPT,
    ]);

    const raw = result.response.text().trim().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw);

    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 422 });

    return NextResponse.json(parsed);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
