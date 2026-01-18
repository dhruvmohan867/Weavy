import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { tasks } from "@trigger.dev/sdk/v3";
import type { LLMExecutePayload } from "@/trigger/llm-execute";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { model, prompt, systemPrompt, imageUrls, temperature, nodeId, workflowId } = body;

    if (!model || !prompt || !nodeId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const payload: LLMExecutePayload = {
      userId,
      workflowId,
      nodeId,
      model,
      prompt,
      systemPrompt,
      imageUrls,
      temperature,
    };

    const handle = await tasks.trigger("llm-execute", payload);

    return NextResponse.json({ success: true, taskId: (handle as any)?.id || (handle as any)?.runId || null });
  } catch (error: any) {
    console.error("LLM execute route error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to trigger LLM" }, { status: 500 });
  }
}