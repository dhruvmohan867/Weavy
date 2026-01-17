"use client";

import React from "react";
import {Search, Type, ImageIcon, Bot} from "lucide-react";
import {cn} from "@/lib/utils";

interface SidebarNodeListProps {
	isCollapsed?: boolean;
}

const SidebarNodeList = ({isCollapsed}: SidebarNodeListProps) => {
	const onDragStart = (event: React.DragEvent, nodeType: string) => {
		event.dataTransfer.setData("application/reactflow", nodeType);
		event.dataTransfer.effectAllowed = "move";
	};

	return (
		<>
			{/* Header / Search */}
			<div className="p-4 border-b border-white/10">
				{!isCollapsed ? (
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
						<input
							type="text"
							placeholder="Search nodes..."
							className="w-full bg-[#1a1a1a] text-xs text-white rounded-md pl-9 pr-3 py-2 border border-white/5 focus:outline-none focus:border-white/20 placeholder:text-white/20"
						/>
					</div>
				) : (
					<div className="flex justify-center py-2">
						<Search className="text-white/40" size={18} />
					</div>
				)}
			</div>

			{/* Node List (Quick Access) */}
			<div className="flex-1 overflow-y-auto p-4">
				{!isCollapsed && <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Quick Access</h3>}

				<div className="space-y-3">
					{/* 1. TEXT NODE */}
					<div
						className={cn(
							"bg-[#1a1a1a] border border-white/5 hover:border-[#dfff4f]/50 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-colors group",
							isCollapsed ? "flex justify-center p-2" : "flex items-center gap-3"
						)}
						draggable
						onDragStart={(e) => onDragStart(e, "textNode")}>
						<div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:text-blue-300">
							<Type size={18} />
						</div>
						{!isCollapsed && (
							<div>
								<p className="text-sm font-medium text-white group-hover:text-[#dfff4f]">Text</p>
								<p className="text-[10px] text-white/40">Input plain text</p>
							</div>
						)}
					</div>

					{/* 2. IMAGE NODE */}
					<div
						className={cn(
							"bg-[#1a1a1a] border border-white/5 hover:border-[#dfff4f]/50 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-colors group",
							isCollapsed ? "flex justify-center p-2" : "flex items-center gap-3"
						)}
						draggable
						onDragStart={(e) => onDragStart(e, "imageNode")}>
						<div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:text-purple-300">
							<ImageIcon size={18} />
						</div>
						{!isCollapsed && (
							<div>
								<p className="text-sm font-medium text-white group-hover:text-[#dfff4f]">Image</p>
								<p className="text-[10px] text-white/40">Upload images</p>
							</div>
						)}
					</div>

					{/* 3. RUN ANY LLM NODE */}
					<div
						className={cn(
							"bg-[#1a1a1a] border border-white/5 hover:border-[#dfff4f]/50 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-colors group",
							isCollapsed ? "flex justify-center p-2" : "flex items-center gap-3"
						)}
						draggable
						onDragStart={(e) => onDragStart(e, "llmNode")}>
						<div className="w-8 h-8 rounded bg-[#dfff4f]/10 flex items-center justify-center text-[#dfff4f] group-hover:text-white">
							<Bot size={18} />
						</div>
						{!isCollapsed && (
							<div>
								<p className="text-sm font-medium text-white group-hover:text-[#dfff4f]">Run Any LLM</p>
								<p className="text-[10px] text-white/40">Gemini Processing</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Bottom Profile/Mock User */}
			<div className="p-4 border-t border-white/10">
				<div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
					<div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 shrink-0" />
					{!isCollapsed && (
						<div className="overflow-hidden">
							<p className="text-xs font-bold text-white truncate">Demo User</p>
							<p className="text-[10px] text-white/40 truncate">Free Plan</p>
						</div>
					)}
				</div>
			</div>
		</>
	);
};

export default SidebarNodeList;
