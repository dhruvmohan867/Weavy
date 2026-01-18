"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// Layout Components
import Sidebar from "@/components/workflow/Sidebar";
import SidebarNodeList from "@/components/workflow/SidebarNodeList";
import Header from "@/components/workflow/Header";
import RunHistorySidebar from "@/components/workflow/RunHistorySidebar"; // Your new sidebar

// State & Actions
import { useWorkflowStore } from "@/store/workflowStore";
import { loadWorkflowAction } from "@/app/actions/workflowActions";
import { DEMO_WORKFLOWS } from "@/lib/demoWorkflows";

// Disable SSR for the Canvas to prevent hydration errors
const FlowEditor = dynamic(() => import("@/components/workflow/FlowEditor"), {
  ssr: false,
});

export default function EditorPage() {
  const params = useParams();
  const workflowId = params.id as string;
  const [loading, setLoading] = useState(true);
  const { setWorkflowId } = useWorkflowStore();

  useEffect(() => {
    async function initializeWorkflow() {
      if (!workflowId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // 1. Check for Demo Template
      const demo = DEMO_WORKFLOWS.find((d) => d.id === workflowId);
      if (demo) {
        const { nodes, edges } = demo.getGraph();
        useWorkflowStore.setState({
          nodes: nodes,
          edges: edges,
          workflowId: null, // Set to null so 'Save' creates a new entry
          workflowName: demo.name,
        });
        setLoading(false);
        return;
      }

      // 2. Check if it's "new"
      if (workflowId === "new") {
        useWorkflowStore.setState({
          nodes: [],
          edges: [],
          workflowId: null,
          workflowName: "Untitled Workflow",
        });
        setLoading(false);
        return;
      }

      // 3. Load from Database
      try {
        const res = await loadWorkflowAction(workflowId);
        if (res.success && res.data) {
          const flowData = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
          useWorkflowStore.setState({
            nodes: flowData.nodes || [],
            edges: flowData.edges || [],
            workflowId: workflowId,
            workflowName: res.name || "Untitled Workflow",
          });
        } else {
          useWorkflowStore.setState({
            nodes: [],
            edges: [],
            workflowId: null,
            workflowName: "Untitled Workflow",
          });
        }
      } catch (error) {
        console.error("Failed to load workflow:", error);
      } finally {
        setLoading(false);
      }
    }

    initializeWorkflow();
  }, [workflowId, setWorkflowId]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <Loader2 className="animate-spin mb-2" size={32} />
        <span className="text-sm text-white/50 ml-2">Loading workflow...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-black text-white overflow-hidden">
      {/* Top Header */}
      <Header />

      <div className="flex flex-1 h-full overflow-hidden">
        {/* Left Sidebar: Node Selection */}
        <Sidebar>
          <SidebarNodeList />
        </Sidebar>

        {/* Center Canvas: Workflow Editor */}
        <main className="flex-1 relative h-full">
          <FlowEditor />
        </main>

        {/* Right Sidebar: Run History */}
        <RunHistorySidebar />
      </div>
    </div>
  );
}