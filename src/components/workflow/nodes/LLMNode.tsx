"use client";

import React, {useCallback, useState, useEffect, useRef} from "react";
import {Handle, Position, NodeProps, useReactFlow, useUpdateNodeInternals} from "@xyflow/react";
import {Bot, Plus, Loader2, MoreHorizontal, Settings2, Copy, Check, Trash2, X} from "lucide-react";
import {cn} from "@/lib/utils";
import type {LLMNodeData, LLMNodeType, TextNodeData, ImageNodeData} from "@/lib/types";
import {useWorkflowStore} from "@/store/workflowStore";
import {useAuth} from "@clerk/nextjs";

export default function LLMNode({id, data, isConnectable, selected}: NodeProps<LLMNodeType>) {
	const {userId} = useAuth();
	const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
	const deleteNode = useWorkflowStore((state) => state.deleteNode);

	const {getNodes, getEdges, setEdges} = useReactFlow();
	const updateNodeInternals = useUpdateNodeInternals();

	const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [showMenu, setShowMenu] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

	const imageHandleCount = data.imageHandleCount ?? 1;

	useEffect(() => {
		updateNodeInternals(id);
	}, [id, imageHandleCount, updateNodeInternals]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setShowMenu(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		return () => {
			if (pollIntervalRef.current) {
				clearInterval(pollIntervalRef.current);
			}
		};
	}, []);

	const onModelChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			updateNodeData(id, {model: e.target.value as LLMNodeData["model"]});
		},
		[id, updateNodeData]
	);

	const handleCopy = useCallback(async () => {
		if (data.outputs && data.outputs.length > 0) {
			const textToCopy = data.outputs[data.outputs.length - 1].content;
			await navigator.clipboard.writeText(textToCopy);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	}, [data.outputs]);

	const handleAddImageInput = useCallback(() => {
		updateNodeData(id, {imageHandleCount: imageHandleCount + 1});
	}, [id, imageHandleCount, updateNodeData]);

	const handleRemoveImageInput = useCallback(
		(index: number) => {
			if (imageHandleCount <= 1) return;

			setEdges((edges) =>
				edges.filter((edge) => {
					if (edge.target !== id) return true;
					if (!edge.targetHandle?.startsWith("image")) return true;

					const handleIndex = parseInt(edge.targetHandle.split("-")[1]);
					return handleIndex < imageHandleCount - 1;
				})
			);

			updateNodeData(id, {imageHandleCount: imageHandleCount - 1});
		},
		[imageHandleCount, id, updateNodeData, setEdges]
	);

	const pollTaskStatus = useCallback(
		async (taskId: string) => {
			let attempts = 0;
			const maxAttempts = 120;

			if (pollIntervalRef.current) {
				clearInterval(pollIntervalRef.current);
			}

			pollIntervalRef.current = setInterval(async () => {
				attempts++;

				if (attempts > maxAttempts) {
					clearInterval(pollIntervalRef.current!);
					updateNodeData(id, {
						status: "error",
						errorMessage: "⏱️ Execution timeout. Please try again.",
					});
					return;
				}

				try {
					const statusResponse = await fetch(`/api/llm/status?taskId=${taskId}`);
					const result = await statusResponse.json();

					console.log(`[Poll ${attempts}] Status:`, result.status);

					if (result.status === "completed") {
						clearInterval(pollIntervalRef.current!);

						updateNodeData(id, {
							status: "success",
							outputs: [
								{
									id: crypto.randomUUID(),
									type: "text",
									content: result.output?.text || "No response.",
									timestamp: Date.now(),
								},
							],
						});
					} else if (result.status === "failed") {
						clearInterval(pollIntervalRef.current!);

						updateNodeData(id, {
							status: "error",
							errorMessage: result.error || "❌ Execution failed",
						});
					}
				} catch (pollError: any) {
					console.error("Polling error:", pollError);
				}
			}, 1000);
		},
		[id, updateNodeData]
	);

	const handleRun = useCallback(async () => {
		if (!userId) {
			updateNodeData(id, {status: "error", errorMessage: "🔐 You must be signed in to run the model."});
			return;
		}

		updateNodeData(id, {
			status: "loading",
			errorMessage: undefined,
			outputs: undefined,
		});

		console.log("--- RUN STARTED ---");

		try {
			const allNodes = getNodes();
			const allEdges = getEdges();
			const incomingEdges = allEdges.filter((edge) => edge.target === id);

			console.log(`Found ${incomingEdges.length} connections to this node`);

			let systemPromptBase = "";
			let userPromptBase = "";
			let incomingContext = "";
			const imageUrls: string[] = [];

			for (const edge of incomingEdges) {
				const sourceNode = allNodes.find((n) => n.id === edge.source);
				if (!sourceNode) continue;

				console.log(`Connected node type: ${sourceNode.type}, target handle: ${edge.targetHandle}`);

				if (sourceNode.type === "textNode") {
					const text = (sourceNode.data as TextNodeData).text;
					if (edge.targetHandle === "system-prompt") {
						systemPromptBase = text || "";
					} else if (edge.targetHandle === "prompt") {
						userPromptBase = text || "";
					}
				}

				if (sourceNode.type === "llmNode") {
					const outputs = (sourceNode.data as LLMNodeData).outputs;
					if (outputs && outputs.length > 0) {
						const lastOutput = outputs[outputs.length - 1].content || "";
						const nodeLabel = (sourceNode.data as LLMNodeData).label || "Previous Step";

						if (edge.targetHandle === "system-prompt") {
							incomingContext += `\n\n--- CONTEXT FROM: ${nodeLabel} ---\n${lastOutput}`;
						} else if (edge.targetHandle === "prompt") {
							userPromptBase = lastOutput;
						}
					}
				}

				if (sourceNode.type === "imageNode" && edge.targetHandle?.startsWith("image")) {
					const imageData = sourceNode.data as ImageNodeData;
					const imageUrl = imageData.file?.url || imageData.image;

					if (imageUrl && typeof imageUrl === "string") {
						console.log("Found image:", imageData.file?.name || "image");

						if (imageUrl.startsWith("data:")) {
							imageUrls.push(imageUrl);
						} else if (imageUrl.startsWith("/") || imageUrl.startsWith("http")) {
							console.log("Converting URL to base64:", imageUrl);
							try {
								const base64 = await urlToBase64(imageUrl);
								imageUrls.push(base64);
							} catch (error) {
								console.error("Failed to convert image:", error);
								throw new Error(`Failed to load image: ${imageUrl}`);
							}
						} else {
							imageUrls.push(imageUrl);
						}
					}
				}
			}

			let finalSystemPrompt = systemPromptBase;
			if (incomingContext) {
				finalSystemPrompt += incomingContext;
			}

			const finalUserPrompt = userPromptBase || "Process this request based on the system instructions and context.";

			console.log("Final Inputs:", {
				systemPrompt: finalSystemPrompt.substring(0, 100) + "...",
				userPrompt: finalUserPrompt.substring(0, 100) + "...",
				imageCount: imageUrls.length,
			});

			if (!finalSystemPrompt.trim() && !finalUserPrompt.trim() && imageUrls.length === 0) {
				throw new Error("Input required: Connect a prompt or image");
			}

			console.log("Using model:", data.model);

			const response = await fetch("/api/llm/execute", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model: data.model,
					prompt: finalUserPrompt,
					systemPrompt: finalSystemPrompt || undefined,
					imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
					temperature: data.temperature || 0.7,
					userId: userId,
					nodeId: id,
				}),
			});

			const result = await response.json();

			if (!response.ok || !result.success) {
				throw new Error(result.error || "Failed to start LLM execution");
			}

			console.log("Task triggered:", result.taskId);

			pollTaskStatus(result.taskId);
		} catch (error: unknown) {
			console.error("Run Failed:", error);
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			updateNodeData(id, {status: "error", errorMessage});
		}
	}, [id, userId, updateNodeData, getNodes, getEdges, data.model, data.temperature, pollTaskStatus]);

	const isLoading = data.status === "loading";

	// Shift handles higher to create more space for image inputs
	const getHandlePositions = () => {
		const baseTop = 20; // System prompt at 20% (moved up from 30%)
		const promptTop = 32; // Prompt at 32% (moved up from 45%)

		// Calculate image handles starting position
		// Start at 50% to leave plenty of room for growth
		const imageStartTop = 50;
		const imageSpacing = Math.min(8, 30 / Math.max(1, imageHandleCount)); // Adjust spacing based on count

		return {
			systemPrompt: baseTop,
			prompt: promptTop,
			imageStart: imageStartTop,
			imageSpacing,
		};
	};

	const handlePositions = getHandlePositions();

	return (
		<div
			className={cn(
				"rounded-xl border bg-[#1a1a1a] min-w-[320px] max-w-[400px] shadow-2xl transition-all duration-200 flex flex-col",
				selected ? "border-[#dfff4f] ring-1 ring-[#dfff4f]/50" : "border-white/10 hover:border-white/30",
				data.status === "error" && "border-red-500 ring-1 ring-red-500/50",
				isLoading && "border-purple-500 ring-2 ring-purple-500/50 animate-pulse"
			)}
			// 🔥 NEW: Add min-height to ensure proper spacing for handles
			style={{
				minHeight: imageHandleCount > 3 ? `${400 + (imageHandleCount - 3) * 30}px` : "400px",
			}}>
			{/* Header */}
			<div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 bg-[#111] rounded-t-xl">
				<div className="flex items-center gap-2">
					<span className="text-xs font-semibold text-white">{data.model || "gemini-2.5-flash"}</span>
				</div>

				<div className="relative" ref={menuRef}>
					<button
						onClick={(e) => {
							e.stopPropagation();
							setShowMenu(!showMenu);
						}}
						className={cn("p-1 rounded transition-colors", showMenu ? "bg-white/10 text-white" : "hover:bg-white/5 text-white/50")}>
						<MoreHorizontal size={14} />
					</button>

					{showMenu && (
						<div className="absolute right-0 top-6 w-32 bg-[#222] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
							<button
								onClick={(e) => {
									e.stopPropagation();
									deleteNode(id);
								}}
								className="w-full text-left px-3 py-2 text-[10px] text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors font-medium">
								<Trash2 size={10} />
								Delete Node
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Body */}
			<div className="p-6 space-y-3 flex-1">
				{/* Model Selection */}
				<div className="space-y-1.5">
					<label className="text-[10px] text-white/50 uppercase font-semibold flex items-center gap-1.5">
						<Settings2 size={10} /> Model Configuration
					</label>
					<select
						value={data.model}
						onChange={onModelChange}
						disabled={isLoading}
						className="w-full bg-[#0a0a0a] text-xs text-white rounded-lg border border-white/10 p-2 focus:outline-none focus:border-[#dfff4f]/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
						<option value="gemini-1.5-flash-latest">Gemini 1.5 Flash (Fast)</option>
						<option value="gemini-1.5-pro-latest">Gemini 1.5 Pro (Powerful)</option>
						<option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
					</select>
				</div>

				{/* Output Display Area */}
				<div className="bg-[#2a2a2a] rounded-lg border border-white/10 flex flex-col">
					{data.status === "success" && data.outputs && data.outputs.length > 0 && (
						<div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
							<span className="text-[10px] text-white/40 uppercase font-semibold">Output</span>
							<button
								onClick={handleCopy}
								className="flex items-center gap-1 px-2 py-1 text-[10px] text-white/60 hover:text-white/90 hover:bg-white/5 rounded transition-colors">
								{copied ? (
									<>
										<Check size={11} />
										Copied!
									</>
								) : (
									<>
										<Copy size={11} />
										Copy
									</>
								)}
							</button>
						</div>
					)}

					<div className="p-3 overflow-y-auto custom-scrollbar" style={{height: "180px", maxHeight: "180px"}}>
						{isLoading ? (
							<div className="flex flex-col items-center justify-center h-full gap-2">
								<Loader2 size={24} className="animate-spin text-purple-400" />
								<p className="text-xs text-white/50">Processing your request...</p>
							</div>
						) : data.status === "success" && data.outputs && data.outputs.length > 0 ? (
							<div className="w-full text-xs text-white/80 font-mono leading-relaxed whitespace-pre-wrap break-words">
								{data.outputs[data.outputs.length - 1].content}
							</div>
						) : data.status === "error" && data.errorMessage ? (
							<div className="flex items-center justify-center h-full">
								<p className="text-xs text-red-400 text-center">{data.errorMessage}</p>
							</div>
						) : (
							<div className="flex items-center justify-center h-full">
								<span className="text-xs text-white/30">The generated text will appear here</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Footer: Add image + Run button */}
			<div className="px-6 mb-6 pb-3 flex items-center justify-between gap-2">
				<button
					onClick={handleAddImageInput}
					disabled={isLoading}
					className="flex items-center gap-1.5 text-[11px] text-white/50 hover:text-white/80 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
					<Plus size={12} />
					Add another image input
				</button>

				<button
					onClick={handleRun}
					disabled={isLoading}
					className={cn(
						"flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all",
						isLoading ? "bg-white/5 text-white/30 cursor-not-allowed" : "bg-white/90 text-black hover:bg-white active:scale-95"
					)}>
					{isLoading ? (
						<>
							<Loader2 size={12} className="animate-spin" />
							Processing...
						</>
					) : (
						<>
							<Bot size={12} />
							Run Model
						</>
					)}
				</button>
			</div>

			{/* System Prompt Handle */}
			<div className="absolute left-0" style={{top: `${handlePositions.systemPrompt}%`}}>
				<Handle
					type="target"
					position={Position.Left}
					id="system-prompt"
					isConnectable={isConnectable}
					onMouseEnter={() => setHoveredHandle("system-prompt")}
					onMouseLeave={() => setHoveredHandle(null)}
					className="!w-2.5 !h-2.5 !bg-[#1a1a1a] !border-2 !border-emerald-400"
				/>
				{hoveredHandle === "system-prompt" && (
					<div className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/90 text-emerald-400 text-[10px] font-semibold px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
						System Prompt
					</div>
				)}
			</div>

			{/* Prompt Handle */}
			<div className="absolute left-0" style={{top: `${handlePositions.prompt}%`}}>
				<Handle
					type="target"
					position={Position.Left}
					id="prompt"
					isConnectable={isConnectable}
					onMouseEnter={() => setHoveredHandle("prompt")}
					onMouseLeave={() => setHoveredHandle(null)}
					className="!w-2.5 !h-2.5 !bg-[#1a1a1a] !border-2 !border-pink-400"
				/>
				{hoveredHandle === "prompt" && (
					<div className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/90 text-pink-400 text-[10px] font-semibold px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
						Prompt
					</div>
				)}
			</div>

			{/* Dynamic Image Handles  */}
			{Array.from({length: imageHandleCount}).map((_, index) => {
				const topPosition = handlePositions.imageStart + index * handlePositions.imageSpacing;
				return (
					<div key={`image-${index}`} className="absolute left-0 flex items-center" style={{top: `${topPosition}%`}}>
						<Handle
							type="target"
							position={Position.Left}
							id={`image-${index}`}
							isConnectable={isConnectable}
							onMouseEnter={() => setHoveredHandle(`image-${index}`)}
							onMouseLeave={() => setHoveredHandle(null)}
							className="!w-2.5 !h-2.5 !bg-[#1a1a1a] !border-2 !border-purple-400"
						/>
						{hoveredHandle === `image-${index}` && (
							<div className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/90 text-purple-400 text-[10px] font-semibold px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none flex items-center gap-2">
								Image {index + 1}
								{imageHandleCount > 1 && (
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleRemoveImageInput(index);
										}}
										className="hover:text-red-400 transition-colors">
										<X size={10} />
									</button>
								)}
							</div>
						)}
					</div>
				);
			})}

			{/* Output Source Handle (Right Side) */}
			<div className="absolute right-0 top-1/2 -translate-y-1/2">
				<Handle
					type="source"
					position={Position.Right}
					id="response"
					isConnectable={isConnectable}
					onMouseEnter={() => setHoveredHandle("response")}
					onMouseLeave={() => setHoveredHandle(null)}
					className="!w-3 !h-3 !bg-[#1a1a1a] !border-2 !border-[#dfff4f] hover:!bg-[#dfff4f] transition-colors"
				/>
				{hoveredHandle === "response" && (
					<div className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/90 text-[#dfff4f] text-[10px] font-semibold px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
						Response Output
					</div>
				)}
			</div>
		</div>
	);
}

// Helper: Convert image URL to base64
async function urlToBase64(url: string): Promise<string> {
	try {
		const response = await fetch(url);
		const blob = await response.blob();
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	} catch (error) {
		console.error("Failed to convert URL to base64:", error);
		throw error;
	}
}
