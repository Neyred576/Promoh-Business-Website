import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export async function POST(req: NextRequest) {
  const aiKey = process.env.AI_API_KEY;

  try {
    const { type, data } = await req.json();

    // Without AI key, return sensible defaults
    if (!aiKey || aiKey === "your_ai_api_key") {
      return NextResponse.json({ result: getFallback(type, data) });
    }

    const prompt = buildPrompt(type, data);
    const res = await fetch(`${GEMINI_API_URL}?key=${aiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ result: getFallback(type, data) });
    }

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || getFallback(type, data);
    return NextResponse.json({ result: text.trim() });
  } catch (error) {
    return NextResponse.json({ result: getFallback("default", {}) });
  }
}

function buildPrompt(type: string, data: any): string {
  switch (type) {
    case "recommend":
      return `You are a service marketplace AI. A customer is searching for: "${data.query}". 
Based on their query, suggest 3 related service categories they might also be interested in. 
Return ONLY a JSON array of strings, e.g. ["Electricians", "Plumbers", "Home Repair"]. No explanation.`;

    case "banner":
      return `Create a professional marketing tagline for a service provider.
Business: ${data.businessName || "Professional Services"}
Services: ${data.services || "General Services"}  
Location: ${data.location || "Your Area"}
Return ONLY a single punchy tagline (max 15 words). No quotes, no explanation.`;

    case "description":
      return `Write a professional 2-sentence business description for:
Business: ${data.businessName}
Services: ${data.services}
Location: ${data.location}
Keep it concise, professional, and persuasive. Return only the description.`;

    case "fraud_check":
      return `Analyze this review for spam or fraud indicators. 
Review: "${data.review}"
Author: ${data.author || "Unknown"}
Rating: ${data.rating}/5

Is this review suspicious? Reply with JSON: {"suspicious": boolean, "reason": "brief reason or null"}`;

    case "assistant":
      return `You are Promoh Assistant, a helpful AI for a service marketplace called Promoh.
Promoh connects customers with verified service professionals (electricians, plumbers, cleaners, tutors, etc.)
User message: "${data.message}"
Reply helpfully in 1-3 sentences. Be friendly and guide them to find or book services on Promoh.`;

    default:
      return "Hello, how can I help you?";
  }
}

function getFallback(type: string, data: any): string {
  switch (type) {
    case "recommend":
      return JSON.stringify(["Electricians", "Plumbers", "Home Repair"]);
    case "banner":
      return "Your trusted local professional, ready to help.";
    case "description":
      return `Professional ${data?.services || "service"} provider serving ${data?.location || "your area"} with excellence and reliability.`;
    case "fraud_check":
      return JSON.stringify({ suspicious: false, reason: null });
    case "assistant":
      return "I'd be happy to help! You can search for professionals on Promoh using the search bar or browse by category.";
    default:
      return "How can I help you today?";
  }
}
