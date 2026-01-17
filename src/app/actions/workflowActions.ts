"use server";

import { query } from "@/lib/db";
import type { SaveWorkflowParams } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";

export async function saveWorkflowAction({ id, name, nodes, edges }: SaveWorkflowParams) {
    try {
        // Get authenticated user ID
        const { userId } = await auth();

        if (!userId) {
            return { success: false, error: "Unauthorized. Please sign in." };
        }
        const workflowJson = JSON.stringify({ nodes, edges });

        if (id) {
            console.log(`Updating Workflow ID: ${id}`);

            // Verify ownership before updating
            const checkSql = `SELECT user_id FROM workflows WHERE id = $1`;
            const checkResult = await query(checkSql, [id]);

            if (checkResult.rows.length === 0) {
                return { success: false, error: "Workflow not found." };
            }

            if (checkResult.rows[0].user_id !== userId) {
                return { success: false, error: "Unauthorized. You don't own this workflow." };
            }

            const sql = `
                UPDATE workflows 
                SET data = $1, name = $2, updated_at = CURRENT_TIMESTAMP 
                WHERE id = $3 AND user_id = $4
                RETURNING id;
            `;
            await query(sql, [workflowJson, name, id, userId]);
            return { success: true, id };

        } else {
            console.log(`Creating New Workflow for User: ${userId}`);
            const sql = `
                INSERT INTO workflows (name, data, user_id, created_at, updated_at) 
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id;
            `;
            const result = await query(sql, [name, workflowJson, userId]);
            return { success: true, id: result.rows[0].id };
        }

    } catch (error) {
        console.error("Database Error:", error);
        return { success: false, error: "Failed to save workflow." };
    }
}

export async function loadWorkflowAction(id: string) {
    try {
        // Get authenticated user ID
        const { userId } = await auth();

        if (!userId) {
            return { success: false, error: "Unauthorized. Please sign in." };
        }

        const sql = `SELECT name, data, user_id FROM workflows WHERE id = $1`;
        const result = await query(sql, [id]);

        if (result.rows.length === 0) {
            return { success: false, error: "Workflow not found" };
        }

        // Verify ownership
        if (result.rows[0].user_id !== userId) {
            return { success: false, error: "Unauthorized. You don't own this workflow." };
        }

        return {
            success: true,
            data: result.rows[0].data,
            name: result.rows[0].name
        };
    } catch (error) {
        console.error("Load Error:", error);
        return { success: false, error: "Failed to load workflow." };
    }
}

export async function getAllWorkflowsAction() {
    try {
        // Get authenticated user ID
        const { userId } = await auth();

        if (!userId) {
            return { success: false, error: "Unauthorized. Please sign in.", workflows: [] };
        }

        const sql = `
            SELECT id, name, created_at, updated_at 
            FROM workflows 
            WHERE user_id = $1
            ORDER BY updated_at DESC
        `;
        const result = await query(sql, [userId]);

        return {
            success: true,
            workflows: result.rows
        };
    } catch (error) {
        console.error("Fetch Workflows Error:", error);
        return { success: false, error: "Failed to fetch workflows.", workflows: [] };
    }
}


export async function deleteWorkflowAction(id: string) {
    try {
        // Get authenticated user ID
        const { userId } = await auth();

        if (!userId) {
            return { success: false, error: "Unauthorized. Please sign in." };
        }

        // Delete only if the user owns the workflow
        const sql = `DELETE FROM workflows WHERE id = $1 AND user_id = $2 RETURNING id`;
        const result = await query(sql, [id, userId]);

        if (result.rows.length === 0) {
            return { success: false, error: "Workflow not found or unauthorized." };
        }

        return { success: true };
    } catch (error) {
        console.error("Delete Error:", error);
        return { success: false, error: "Failed to delete workflow." };
    }
}