import { task } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

// V4 uses task() instead of client.defineJob()
export const llmExecuteTask = task({
    id: "llm-execute",
    retry: {
        maxAttempts: 3,
        minTimeoutInMs: 1000,
        maxTimeoutInMs: 10000,
        factor: 2,
        randomize: true,
    },
    run: async (payload: LLMExecutePayload, { ctx }) => {
        // Step 1: Log the start
        console.log("🚀 Starting LLM execution", {
            model: payload.model,
            userId: payload.userId,
            nodeId: payload.nodeId,
            hasImages: !!payload.imageUrls?.length,
        });

        try {
            // Step 2: Validate inputs
            if (!payload.model || !payload.prompt) {
                throw new Error("Missing required fields: model and prompt");
            }

            // Step 3: Initialize Gemini model
            console.log("🤖 Initializing Gemini model", { model: payload.model });

            const model = genAI.getGenerativeModel({
                model: payload.model,
            });

            // Step 4: Prepare content parts
            const parts: any[] = [];

            // Add system prompt if provided
            if (payload.systemPrompt) {
                console.log("📝 Adding system prompt");
                parts.push({
                    text: `System Instructions: ${payload.systemPrompt}\n\n`,
                });
            }

            // Add user prompt
            parts.push({
                text: payload.prompt,
            });

            // Step 5: Process images if provided
            if (payload.imageUrls && payload.imageUrls.length > 0) {
                console.log(`🖼️ Processing ${payload.imageUrls.length} images`);

                for (let i = 0; i < payload.imageUrls.length; i++) {
                    const imageUrl = payload.imageUrls[i];

                    // Extract base64 data and mime type
                    const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

                    if (matches && matches.length === 3) {
                        const mimeType = matches[1];
                        const base64Data = matches[2];

                        parts.push({
                            inlineData: {
                                data: base64Data,
                                mimeType: mimeType,
                            },
                        });

                        console.log(`✅ Image ${i + 1} processed`, { mimeType });
                    } else {
                        console.warn(`⚠️ Invalid image format at index ${i}`);
                    }
                }
            }

            // Step 6: Generate content
            console.log("🔄 Calling Gemini API...");

            const generationConfig = {
                temperature: payload.temperature || 0.7,
                maxOutputTokens: 8192,
            };

            const result = await model.generateContent({
                contents: [{ role: "user", parts }],
                generationConfig,
            });

            const text = result.response.text();

            // Step 7: Log success
            console.log("✅ LLM execution completed successfully", {
                responseLength: text.length,
                tokensUsed: result.response.usageMetadata,
            });

            // Step 8: Return the result
            return {
                success: true,
                text,
                model: payload.model,
                nodeId: payload.nodeId,
                timestamp: new Date().toISOString(),
            } as LLMExecuteOutput;

        } catch (error: any) {
            // Step 9: Handle errors
            console.error("❌ LLM execution failed", {
                error: error.message,
                stack: error.stack,
                nodeId: payload.nodeId,
            });

            return {
                success: false,
                error: error.message || "Unknown error occurred",
                nodeId: payload.nodeId,
                model: payload.model,
                timestamp: new Date().toISOString(),
            } as LLMExecuteOutput;
        }
    },
});