import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "GEMINI_API_KEY missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Say 'Gemini connected' in 1 line.");

    return NextResponse.json({
      success: true,
      text: result.response.text(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message ?? "Gemini test failed" },
      { status: 500 }
    );
  }
}
