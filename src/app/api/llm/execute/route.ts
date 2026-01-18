import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ✅ Required for Node libraries like @google/generative-ai

type LLMExecutePayload = {
  model: string;
  prompt: string;
  systemPrompt?: string;
  imageUrls?: string[];
  temperature?: number;
  userId?: string;
  nodeId?: string;
  workflowId?: string;
};

function buildError(message: string, status = 400) {
  return NextResponse.json(
    { ok: false, error: message },
    { status }
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LLMExecutePayload;

    const modelName = body?.model;
    const prompt = body?.prompt;

    if (!modelName || !prompt) {
      return buildError("Missing required fields: model and prompt");
    }

    if (!process.env.GEMINI_API_KEY) {
      return buildError("GEMINI_API_KEY missing in .env", 500);
    }

    // ✅ Import Gemini SDK only on server
    const { GoogleGenerativeAI } = await import("@google/generative-ai");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });

    const parts: any[] = [];

    // System prompt (optional)
    if (body.systemPrompt?.trim()) {
      parts.push({
        text: `System Instructions: ${body.systemPrompt}\n\n`,
      });
    }

    // Main prompt
    parts.push({ text: prompt });

    // ✅ Images (optional) - Only supports base64 "data:" URLs
    if (body.imageUrls?.length) {
      for (let i = 0; i < body.imageUrls.length; i++) {
        const imageUrl = body.imageUrls[i];

        const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

        if (matches?.length === 3) {
          const mimeType = matches[1];
          const base64Data = matches[2];

          parts.push({
            inlineData: {
              data: base64Data,
              mimeType,
            },
          });
        }
      }
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: body.temperature ?? 0.7,
        maxOutputTokens: 8192,
      },
    });

    const text = result.response.text();

    return NextResponse.json({
      ok: true,
      text,
      model: modelName,
      nodeId: body.nodeId ?? null,
      workflowId: body.workflowId ?? null,
      timestamp: new Date().toISOString(),
      usage: result.response.usageMetadata ?? null,
    });
  } catch (err: any) {
    console.error("❌ /api/llm/execute error:", err);

    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
