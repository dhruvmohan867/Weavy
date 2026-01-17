"use client";

import React, {useEffect, useState} from "react";
import {useParams} from "next/navigation";
import {Loader2} from "lucide-react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/workflow/Sidebar";
import SidebarNodeList from "@/components/workflow/SidebarNodeList";
import Header from "@/components/workflow/Header";
import {useWorkflowStore} from "@/store/workflowStore";
import {loadWorkflowAction} from "@/app/actions/workflowActions";
import {DEMO_WORKFLOWS} from "@/lib/demoWorkflows";

// 1. DYNAMIC IMPORT: Disables SSR for the Canvas
// This replaces the need for useState/useEffect isMounted checks
const FlowEditor = dynamic(() => import("@/components/workflow/FlowEditor"), {
	ssr: false,
});

export default function EditorPage() {
	const params = useParams();
	const workflowId = params.id as string;

	const [loading, setLoading] = useState(true);
	const {setWorkflowId} = useWorkflowStore();

	useEffect(() => {
		async function initializeWorkflow() {
			if (!workflowId) {
				setLoading(false);
				return;
			}

			setLoading(true);

			//  Check for Demo Template
			const demo = DEMO_WORKFLOWS.find((d) => d.id === workflowId);
			if (demo) {
				console.log("Loading Demo Template:", demo.name);

				// Get the graph data from the function
				const {nodes, edges} = demo.getGraph();

				useWorkflowStore.setState({
					nodes: nodes,
					edges: edges,
					// Set ID to null so hitting "Save" creates a NEW entry
					workflowId: null,
					workflowName: demo.name, // Set the initial name from demo
				});

				setLoading(false);
				return; // Stop here, don't check DB
			}

			// Existing Logic: Check "New" or Database

			// Check if it's "new" - create empty workflow
			if (workflowId === "new") {
				useWorkflowStore.setState({
					nodes: [],
					edges: [],
					workflowId: null,
					workflowName: "Untitled Workflow", // Reset name for new workflow
				});
				setLoading(false);
				return;
			}

			// Try loading from the Database
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
					// Workflow not found, start with empty state
					console.log("Workflow not found, starting fresh.");
					useWorkflowStore.setState({
						nodes: [],
						edges: [],
						workflowId: null,
						workflowName: "Untitled Workflow",
					});
				}
			} catch (error) {
				console.error("Failed to load workflow:", error);
				// Fallback to empty state on error
				useWorkflowStore.setState({
					nodes: [],
					edges: [],
					workflowId: null,
					workflowName: "Untitled Workflow",
				});
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
			{/* 1. Header at the top */}
			<Header />

			<div className="flex flex-1 h-full overflow-hidden">
				{/* 2. Sidebar on the left */}
				<Sidebar>
					<SidebarNodeList />
				</Sidebar>

				{/* 3. Editor Canvas */}
				<main className="flex-1 relative h-full">
					<FlowEditor />
				</main>
			</div>
		</div>
	);
}
