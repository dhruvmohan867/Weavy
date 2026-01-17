"use client";

import React, {useState, useCallback} from "react";
import {Save, Loader2, Share2, FolderOpen} from "lucide-react";
import {useWorkflowStore} from "@/store/workflowStore";
import {saveWorkflowAction} from "@/app/actions/workflowActions";
import LoadWorkflowModal from "./LoadWorkflowModal";

export default function Header() {
	// 1. Get state and actions from the store - now includes workflowName
	const {nodes, edges, workflowId, workflowName, setWorkflowId, setWorkflowName} = useWorkflowStore();
	const [isSaving, setIsSaving] = useState(false);
	const [isLoadOpen, setIsLoadOpen] = useState(false);

	// 2. Remove local workflowName state - now using store
	const [isEditingName, setIsEditingName] = useState(false);

	// --- HANDLE SAVE (Existing Logic) ---
	const handleSave = async () => {
		if (nodes.length === 0) {
			alert("Canvas is empty!");
			return;
		}

		setIsSaving(true);

		try {
			const result = await saveWorkflowAction({
				id: workflowId,
				name: workflowName,
				nodes,
				edges,
			});

			if (result.success) {
				setWorkflowId(result.id);
				alert(`Saved! (ID: ${result.id})`);
			} else {
				alert(`Error: ${result.error}`);
			}
		} catch (error) {
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	// --- HANDLE SHARE (Export as JSON) ---
	const handleShare = useCallback(() => {
		if (nodes.length === 0) {
			alert("Nothing to share! The canvas is empty.");
			return;
		}

		// 1. Create the JSON object
		const workflowData = {
			name: workflowName,
			nodes: nodes,
			edges: edges,
			version: "1.0.0",
			exportedAt: new Date().toISOString(),
		};

		// 2. Convert to string
		const jsonString = JSON.stringify(workflowData, null, 2); // Pretty print with 2 spaces

		// 3. Create a Blob (a file-like object)
		const blob = new Blob([jsonString], {type: "application/json"});

		// 4. Create a temporary download link
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;

		// 5. Set filename (e.g., "My_First_Weavy.json")
		const filename = workflowName.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "workflow";
		link.download = `${filename}.json`;

		// 6. Trigger download and cleanup
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}, [nodes, edges, workflowName]);

	return (
		<>
			<header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#111]">
				{/* --- LEFT SIDE (Logo + Name Input) --- */}
				<div className="flex items-center gap-3">
					<div className="w-6 h-6 rounded bg-gradient-to-tr from-pink-500 to-purple-500"></div>

					{/* Editable Workflow Name */}
					{isEditingName ? (
						<input
							type="text"
							value={workflowName}
							onChange={(e) => setWorkflowName(e.target.value)}
							onBlur={() => setIsEditingName(false)}
							onKeyDown={(e) => {
								if (e.key === "Enter") setIsEditingName(false);
								if (e.key === "Escape") {
									setIsEditingName(false);
								}
							}}
							autoFocus
							className="bg-[#222] text-sm font-bold text-white px-2 py-1 rounded border border-[#dfff4f] focus:outline-none"
						/>
					) : (
						<h1
							onClick={() => setIsEditingName(true)}
							className="text-sm font-bold text-white tracking-wider cursor-text hover:bg-white/10 px-2 py-1 rounded transition-colors flex items-center gap-2">
							{workflowName}
							{workflowId && <span className="opacity-50 font-normal text-xs">#{workflowId}</span>}
						</h1>
					)}
				</div>

				{/* --- RIGHT SIDE (Buttons) --- */}
				<div className="flex gap-2">
					{/* Open Button */}
					<button
						onClick={() => setIsLoadOpen(true)}
						className="flex items-center gap-2 px-3 py-2 bg-[#222] border border-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/10 transition-all">
						<FolderOpen size={14} />
						OPEN
					</button>

					{/* Share Button */}
					<button
						onClick={handleShare}
						className="flex items-center gap-2 px-3 py-2 bg-[#222] border border-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/10 transition-all group">
						<Share2 size={14} className="group-hover:text-[#dfff4f] transition-colors" />
						SHARE
					</button>

					{/* Save Button */}
					<button
						onClick={handleSave}
						disabled={isSaving}
						className="flex items-center gap-2 px-4 py-2 bg-[#dfff4f] text-black text-xs font-bold rounded-lg hover:bg-white transition-all disabled:opacity-50 hover:scale-105 active:scale-95">
						{isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
						{isSaving ? "SAVING..." : "SAVE"}
					</button>
				</div>
			</header>

			<LoadWorkflowModal isOpen={isLoadOpen} onClose={() => setIsLoadOpen(false)} />
		</>
	);
}
