"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, History, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const RunHistorySidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Mock data based on your Prisma Schema
    const mockRuns = [
        { id: "1", status: "COMPLETED", createdAt: new Date().toISOString() },
        { id: "2", status: "FAILED", createdAt: new Date().toISOString() },
    ];

    return (
        <aside className={cn(
            "bg-[#111111] border-l border-white/10 transition-all duration-300 relative flex flex-col z-20",
            isCollapsed ? "w-16" : "w-72"
        )}>
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -left-3 top-6 bg-[#1a1a1a] border border-white/10 rounded-full p-1 text-white/60 hover:text-white z-50">
                {isCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>

            <div className="p-4 border-b border-white/10 flex items-center gap-2">
                <History size={18} className="text-white/60" />
                {!isCollapsed && <h2 className="text-sm font-bold text-white uppercase tracking-wider">Run History</h2>}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {mockRuns.map((run) => (
                    <div key={run.id} className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                        <div className="flex items-center gap-2">
                            {run.status === "COMPLETED" ? <CheckCircle2 size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-red-500" />}
                            {!isCollapsed && <span className="text-xs text-white/80">Run #{run.id}</span>}
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
};

export default RunHistorySidebar;