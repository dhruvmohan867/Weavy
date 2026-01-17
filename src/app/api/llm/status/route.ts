import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { runs } from "@trigger.dev/sdk/v3";

export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get task ID from query params
        const { searchParams } = new URL(request.url);
        const taskId = searchParams.get("taskId");

        if (!taskId) {
            return NextResponse.json(
                { success: false, error: "Missing taskId" },
                { status: 400 }
            );
        }

        // Get the run status from Trigger.dev V4
        const run = await runs.retrieve(taskId);

        if (!run) {
            return NextResponse.json({
                success: false,
                status: "not_found",
                error: "Task not found",
            });
        }

        // Map Trigger.dev V4 status to our status
        let status: "pending" | "running" | "completed" | "failed";

        if (run.status === "COMPLETED") {
            status = "completed";
        } else if (
            run.status === "FAILED" ||
            run.status === "CRASHED" ||
            run.status === "TIMED_OUT" ||
            run.status === "CANCELED"
        ) {
            status = "failed";
        } else if (run.status === "EXECUTING") {
            status = "running";
        } else {
            status = "pending";
        }

        return NextResponse.json({
            success: true,
            status,
            output: run.output,
            error: run.status === "FAILED" ? run.error : undefined,
            runId: run.id,
        });

    } catch (error: any) {
        console.error("Error checking task status:", error);

        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to check status"
            },
            { status: 500 }
        );
    }
}