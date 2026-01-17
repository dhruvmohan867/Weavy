import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { tasks } from "@trigger.dev/sdk/v3";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { model, prompt, systemPrompt, imageUrls, temperature, nodeId, workflowId } = body;

    // Validate required fields
    if (!model || !prompt) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: model and prompt" },
        { status: 400 }
      );
    }

    if (!nodeId) {
      return NextResponse.json(
        { success: false, error: "Missing nodeId" },
        { status: 400 }
      );
    }

    // 🔥 Trigger the task using Trigger.dev V3
    const handle = await tasks.trigger(
      "llm-execute", // Task identifier
      {
        model,
        prompt,
        systemPrompt,
        imageUrls,
        temperature: temperature || 0.7,
        userId,
        nodeId,
        workflowId,
      }
    );

    // Return the task ID for polling
    return NextResponse.json({
      success: true,
      taskId: handle.id,
      message: "LLM execution started",
    });

  } catch (error: any) {
    console.error("Error triggering LLM task:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to execute LLM" 
      },
      { status: 500 }
    );
  }
}