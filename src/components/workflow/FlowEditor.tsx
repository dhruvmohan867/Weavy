"use client";

import React, {useCallback, useRef, useEffect, useState} from "react";
import {
    ReactFlow, 
    Background, 
    MiniMap, 
    useReactFlow, 
    ReactFlowProvider, 
    Connection, 
    getOutgoers, 
    Edge, 
    Panel, 
    ConnectionLineType
} from "@xyflow/react";
import AnimatedEdge from "./edges/AnimatedEdge";
import "@xyflow/react/dist/style.css";

import TextNode from "@/components/workflow/nodes/TextNode";
import ImageNode from "@/components/workflow/nodes/ImageNode";
import LLMNode from "@/components/workflow/nodes/LLMNode";
import {useWorkflowStore} from "@/store/workflowStore";
import CanvasControls from "./CanvasControls";
import {useStore} from "zustand";
import {AppNode} from "@/lib/types";

const nodeTypes = {
    textNode: TextNode,
    imageNode: ImageNode,
    llmNode: LLMNode,
};

const edgeTypes = {
    animatedEdge: AnimatedEdge,
};

function FlowContent() {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const {nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode} = useWorkflowStore();
    const {screenToFlowPosition} = useReactFlow();
    const {undo, redo} = useStore(useWorkflowStore.temporal);

    // UI State for Hand/Pan Mode
    const [isHandMode, setIsHandMode] = useState(false);

    // VALIDATION LOGIC
    const isValidConnection = useCallback(
        (connection: Edge | Connection) => {
            if (connection.source === connection.target) return false;

            const sourceNode = nodes.find((node) => node.id === connection.source);
            const targetNode = nodes.find((node) => node.id === connection.target);

            if (!sourceNode || !targetNode) return false;

            if (connection.targetHandle?.startsWith("image")) {
                if (sourceNode.type !== "imageNode") return false;
            }

            if (connection.targetHandle === "prompt" || connection.targetHandle === "system-prompt") {
                const isTextProducer = sourceNode.type === "textNode" || sourceNode.type === "llmNode";
                if (!isTextProducer) return false;
            }

            if (connection.targetHandle === "input") {
                if (sourceNode.type === "imageNode") return false;
            }

            const hasCycle = (node: AppNode, visited = new Set<string>()): boolean => {
                if (visited.has(node.id)) return false;
                visited.add(node.id);
                const outgoers = getOutgoers(node, nodes, edges);
                if (outgoers.some((outgoer) => outgoer.id === sourceNode.id)) return true;
                return outgoers.some((outgoer) => hasCycle(outgoer, visited));
            };

            if (hasCycle(targetNode)) return false;

            return true;
        },
        [nodes, edges]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            const type = event.dataTransfer.getData("application/reactflow");
            if (!type) return;

            const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
            const newNodeId = crypto.randomUUID();
            let newNode: AppNode;

            if (type === "textNode") {
                newNode = { 
                    id: newNodeId, 
                    type: "textNode", 
                    position, 
                    data: {label: "Text Input", text: "", status: "idle"} 
                };
            } else if (type === "imageNode") {
                newNode = { 
                    id: newNodeId, 
                    type: "imageNode", 
                    position, 
                    data: {label: "Image Input", status: "idle", inputType: "upload"} 
                };
            } else {
                newNode = { 
                    id: newNodeId, 
                    type: "llmNode", 
                    position, 
                    data: { 
                        label: "Gemini Worker", 
                        status: "idle", 
                        model: "gemini-2.5-flash", 
                        temperature: 0.7, 
                        viewMode: "single", 
                        outputs: [], 
                        imageHandleCount: 1 
                    } 
                };
            }
            addNode(newNode);
        },
        [screenToFlowPosition, addNode]
    );

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { 
                e.preventDefault(); 
                undo(); 
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) { 
                e.preventDefault(); 
                redo(); 
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [undo, redo]);

    return (
        <div className="flex-1 relative h-full" ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                isValidConnection={isValidConnection}
                onDrop={onDrop}
                onDragOver={onDragOver}
                connectionLineStyle={{ stroke: '#fff', strokeWidth: 2 }}
                connectionLineType={ConnectionLineType.Bezier}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                colorMode="dark"
                fitView
                // 🚀 KEY: Control Interaction Mode here
                panOnDrag={isHandMode} 
                selectionOnDrag={!isHandMode}
                panOnScroll={true}
                nodesDraggable={!isHandMode}
            >
                <Background color="#333" gap={20} size={1} />
                
                <MiniMap 
                    className="bg-[#1a1a1a] border border-white/10 !bottom-4 !right-4" 
                    maskColor="rgba(0,0,0, 0.7)" 
                    nodeColor={() => "#dfff4f"} 
                />

                {/* 🚀 Centered Floating Bar with Undo/Redo + Zoom + Modes */}
                <Panel position="bottom-center" className="mb-8">
                    <CanvasControls 
                        isHandMode={isHandMode} 
                        toggleMode={setIsHandMode} 
                    />
                </Panel>
            </ReactFlow>
        </div>
    );
}

export default function FlowEditor() {
    return (
        <ReactFlowProvider>
            <FlowContent />
        </ReactFlowProvider>
    );
}
