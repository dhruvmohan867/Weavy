"use client";

import React, {useEffect, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Loader2, Plus, Search, Clock, Trash2, ChevronRight} from "lucide-react";
import {getAllWorkflowsAction, deleteWorkflowAction, saveWorkflowAction} from "@/app/actions/workflowActions";
import {DEMO_WORKFLOWS} from "@/lib/demoWorkflows";
import Sidebar from "@/components/workflow/Sidebar";
import SidebarNavigation from "@/components/workflow/SidebarNavigation";
import type {Workflow} from "@/lib/types";
import {useUser} from "@clerk/nextjs";

export default function DashboardPage() {
    const router = useRouter();
    const {user} = useUser();
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchWorkflows = async () => {
            setLoading(true);
            const res = await getAllWorkflowsAction();
            if (res.success) {
                setWorkflows(res.workflows);
            } else if (res.error) {
                console.error("Error fetching workflows:", res.error);
            }
            setLoading(false);
        };

        fetchWorkflows();
    }, []);

    const handleCreateNew = async () => {
        setCreating(true);

        try {
            // Create a new workflow in the database with empty nodes/edges
            const result = await saveWorkflowAction({
                name: "Untitled Workflow",
                nodes: [],
                edges: [],
            });

            if (result.success && result.id) {
                // Redirect to the new workflow editor
                router.push(`/workflows/${result.id}`);
            } else {
                alert(`Failed to create workflow: ${result.error}`);
                setCreating(false);
            }
        } catch (error) {
            console.error("Error creating workflow:", error);
            alert("Something went wrong while creating the workflow.");
            setCreating(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm("Are you sure you want to delete this workflow?")) return;

        const res = await deleteWorkflowAction(id);
        if (res.success) {
            setWorkflows(workflows.filter((wf) => wf.id !== id));
        } else {
            alert(`Failed to delete: ${res.error}`);
        }
    };

    // Filter workflows by search
    const filteredWorkflows = workflows.filter((wf) => wf.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Format relative time
    const getRelativeTime = (date: string) => {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now.getTime() - past.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;
        return past.toLocaleDateString();
    };

    // Get user display name for header
    const getUserDisplayName = () => {
        if (!user) return "Your";
        // Check fullName first (from OAuth providers like Google)
        if (user.fullName) return `${user.fullName}'s`;
        if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}'s`;
        if (user.firstName) return `${user.firstName}'s`;
        if (user.username) return `${user.username}'s`;
        return "Your";
    };

    return (
        <div className="flex h-screen w-full bg-[#0a0a0a] text-white font-sans">
            {/* --- SIDEBAR --- */}
            <Sidebar>
                <SidebarNavigation onCreateNew={handleCreateNew} creating={creating} />
            </Sidebar>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-14 border-b border-white/5 flex items-center justify-between px-8">
                    <h1 className="text-sm font-semibold text-white/80">{getUserDisplayName()} Workspace</h1>
                    <button
                        onClick={handleCreateNew}
                        disabled={creating}
                        className="flex items-center gap-2 border border-[#dfff4f] text-[#dfff4f] px-4 py-1.5 rounded-lg font-bold text-xs hover:bg-[#dfff4f] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        {creating ? "Creating..." : "Create New File"}
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    {/* --- WORKFLOW LIBRARY --- */}
                    <section className="mb-10">
                        <div className="flex items-center gap-6 mb-5">
                            <h2 className="text-sm font-semibold text-white/90 px-3 py-1 bg-white/5 rounded-full">Workflow library</h2>
                            <span className="text-sm text-white/40 hover:text-white cursor-pointer transition-colors">Tutorials</span>
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {DEMO_WORKFLOWS.map((demo) => (
                                <Link
                                    key={demo.id}
                                    href={`/workflows/${demo.id}`}
                                    className="group relative min-w-[200px] h-[140px] rounded-xl overflow-hidden border border-white/10 hover:border-[#dfff4f]/50 transition-all hover:-translate-y-1 bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a]">
                                    {/* Content */}
                                    <div className="relative h-full p-4 flex flex-col">
                                        {/* Thumbnail/Icon */}
                                        <div className="flex-1 flex items-center justify-center">
                                            <div className="text-4xl">{demo.thumbnail}</div>
                                        </div>

                                        {/* Name */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-white truncate">{demo.name}</h3>
                                            <p className="text-xs text-white/50 truncate mt-0.5">{demo.description}</p>
                                        </div>
                                    </div>

                                    {/* Arrow on hover */}
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight size={16} className="text-white" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* --- MY FILES --- */}
                    <section className="overflow-hidden">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-semibold">My files</h2>

                            {/* Search Bar */}
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type="text"
                                    placeholder="Search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors w-48"
                                />
                            </div>
                        </div>

                        {/* Files Grid */}
                        {loading ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="animate-spin text-white/30" size={32} />
                            </div>
                        ) : filteredWorkflows.length === 0 ? (
                            <div className="text-center p-12 border border-dashed border-white/10 rounded-xl">
                                <p className="text-white/50">{searchQuery ? "No workflows found." : "No files yet. Create one to get started!"}</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-3">
                                {filteredWorkflows.map((wf) => (
                                    <Link
                                        key={wf.id}
                                        href={`/workflows/${wf.id}`}
                                        className="group rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition-all w-[200px]">
                                        <div>
                                            {/* Thumbnail Section - Fixed height */}
                                            <div className="h-32 bg-[#1a1a1a] flex items-center justify-center">
                                                {/* Workflow Icon */}
                                                <div className="text-white/20 group-hover:text-white/30 transition-colors">
                                                    <WorkflowIcon size={40} />
                                                </div>
                                            </div>

                                            <div className="flex justify-between mx-4 my-4">
                                                {/* Info Section */}
                                                <div className="">
                                                    <h3 className="font-medium text-xs text-white truncate mb-0.5">{wf.name}</h3>
                                                    <p className="text-[9px] text-white/40 flex items-center gap-1">
                                                        <Clock size={8} />
                                                        Last edited {getRelativeTime(wf.updated_at)}
                                                    </p>
                                                </div>
                                                {/* Delete Button */}
                                                <button
                                                    onClick={(e) => handleDelete(wf.id, e)}
                                                    className="p-1 rounded-md bg-black/50 backdrop-blur-sm hover:bg-red-500/90 text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Delete workflow">
                                                    <Trash2 size={11} />
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}

// Workflow Icon
function WorkflowIcon({size}: {size?: number}) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size || 24}
            height={size || 24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round">
            <rect x="3" y="3" width="6" height="6" rx="1" />
            <rect x="15" y="3" width="6" height="6" rx="1" />
            <rect x="9" y="15" width="6" height="6" rx="1" />
            <path d="M6 9v3a1 1 0 0 0 1 1h4" />
            <path d="M18 9v3a1 1 0 0 1-1 1h-4" />
            <path d="M12 13v2" />
        </svg>
    );
}
