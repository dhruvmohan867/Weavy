import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { triggerClient } from "@/trigger/client"; // ✅ your client instance
import type { LLMExecutePayload } from "@/trigger/llm-execute";

const schema = z.object({
  model: z.string().min(1),
  prompt: z.string().min(1),
  systemPrompt: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  temperature: z.number().min(0).max(2).optional(),
  nodeId: z.string().min(1),
  workflowId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = schema.parse(await request.json());

    const payload: LLMExecutePayload = {
      userId,
      workflowId: body.workflowId,
      nodeId: body.nodeId,
      model: body.model,
      prompt: body.prompt,
      systemPrompt: body.systemPrompt,
      imageUrls: body.imageUrls,
      temperature: body.temperature,
    };

    // ✅ trigger the task properly
    const handle = await triggerClient.trigger({
      id: "llm-execute",
      payload,
    });

    return NextResponse.json({
      success: true,
      runId: handle.id,
    });
  } catch (error: any) {
    console.error("LLM execute route error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to trigger LLM" },
      { status: 500 }
    );
  }
}

