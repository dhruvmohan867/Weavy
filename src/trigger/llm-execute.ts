import { task } from "@trigger.dev/sdk/v3";

export interface LLMExecutePayload {
  model: string;
  prompt: string;
  systemPrompt?: string;
  imageUrls?: string[];
  temperature?: number;
  userId: string;
  nodeId: string;
  workflowId?: string;
}

export interface LLMExecuteOutput {
  success: boolean;
  text?: string;
  error?: string;
  nodeId: string;
  model: string;
  timestamp: string;
}

export const llmExecuteTask = task({
  id: "llm-execute",
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    factor: 2,
    randomize: true,
  },
  run: async (payload: LLMExecutePayload) => {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing in environment variables");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    console.log("🚀 Starting LLM execution", {
      model: payload.model,
      userId: payload.userId,
      nodeId: payload.nodeId,
      hasImages: !!payload.imageUrls?.length,
    });

    try {
      if (!payload.model || !payload.prompt) {
        throw new Error("Missing required fields: model and prompt");
      }

      const model = genAI.getGenerativeModel({ model: payload.model });

      const parts: any[] = [];

      if (payload.systemPrompt) {
        parts.push({
          text: `System Instructions: ${payload.systemPrompt}\n\n`,
        });
      }

      parts.push({ text: payload.prompt });

      // ✅ Currently supports base64 data: URLs.
      // Later for assignment we will extend to fetch Transloadit https URLs.
      if (payload.imageUrls?.length) {
        for (let i = 0; i < payload.imageUrls.length; i++) {
          const imageUrl = payload.imageUrls[i];

          const matches = imageUrl.match(
            /^data:([A-Za-z-+\/]+);base64,(.+)$/
          );

          if (matches?.length === 3) {
            const mimeType = matches[1];
            const base64Data = matches[2];

            parts.push({
              inlineData: {
                data: base64Data,
                mimeType,
              },
            });

            console.log(`✅ Image ${i + 1} processed`, { mimeType });
          } else {
            console.warn(`⚠️ Invalid image format at index ${i}`);
          }
        }
      }

      const result = await model.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: payload.temperature ?? 0.7,
          maxOutputTokens: 8192,
        },
      });

      const text = result.response.text();

      console.log("✅ LLM execution completed successfully", {
        responseLength: text?.length ?? 0,
        usage: result.response.usageMetadata,
      });

      return {
        success: true,
        text,
        model: payload.model,
        nodeId: payload.nodeId,
        timestamp: new Date().toISOString(),
      } satisfies LLMExecuteOutput;
    } catch (error: any) {
      console.error("❌ LLM execution failed", {
        error: error?.message,
        stack: error?.stack,
        nodeId: payload.nodeId,
      });

      return {
        success: false,
        error: error?.message || "Unknown error occurred",
        nodeId: payload.nodeId,
        model: payload.model,
        timestamp: new Date().toISOString(),
      } satisfies LLMExecuteOutput;
    }
  },
});
