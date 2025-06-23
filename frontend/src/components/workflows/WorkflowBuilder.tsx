"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  ConnectionLineType,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Play, 
  Save, 
  Workflow,
  Settings,
  Cloud,
  Check,
  Power,
  PowerOff,
  Loader2,
} from "lucide-react";
import NodePalette from "./NodePalette";
import WorkflowSettings from "./WorkflowSettings";
import AgentNode from "./nodes/AgentNode";
import ToolConnectionNode from "./nodes/ToolConnectionNode";
import InputNode from "./nodes/InputNode";
import MCPNode from "./nodes/MCPNode";
import { getProjects, createWorkflow, updateWorkflow, getWorkflow, executeWorkflow, type WorkflowNode, type WorkflowEdge } from "@/lib/api";
import { useAutoSaveWorkflowFlow, useUpdateWorkflowStatus } from "@/hooks/react-query/workflows/use-workflows";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { validateWorkflow, type ValidationResult } from "./WorkflowValidator";
import { WorkflowProvider } from "./WorkflowContext";
import { useSidebar } from "../ui/sidebar";

const nodeTypes = {
  inputNode: InputNode,
  agentNode: AgentNode,
  toolConnectionNode: ToolConnectionNode,
  mcpNode: MCPNode,
};

const initialNodes: Node[] = [
  {
    id: 'agent-1',
    type: 'agentNode',
    position: { x: 400, y: 200 },
    data: { 
      label: 'Test Agent', 
      nodeId: 'agent',
      connectedTools: [
        {
          id: 'tool-1',
          name: 'Web Search',
          type: 'web_search_tool'
        }
      ],
      inputConnections: [
        {
          id: 'tool-1',
          name: 'Web Search',
          type: 'tool',
          handleId: 'tools'
        }
      ]
    }
  },
  {
    id: 'tool-1',
    type: 'toolConnectionNode',
    position: { x: 100, y: 200 },
    data: { 
      label: 'Web Search', 
      nodeId: 'web_search_tool',
      instructions: '',
      outputConnections: [
        {
          id: 'agent-1',
          name: 'Test Agent',
          type: 'agent',
          handleId: 'tool-connection'
        }
      ]
    }
  }
];

const initialEdges: Edge[] = [
  {
    id: 'e-tool-1-agent-1',
    source: 'tool-1',
    sourceHandle: 'tool-connection',
    target: 'agent-1',
    targetHandle: 'tools',
    type: 'smoothstep',
    animated: true,
    style: { strokeWidth: 2, stroke: '#6366f1' },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#6366f1',
    },
  }
];

// Default edge style
const defaultEdgeOptions = {
  animated: true,
  style: { 
    strokeWidth: 2, 
    stroke: '#6366f1',
  },
  type: 'smoothstep',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: '#6366f1',
  },
};

interface WorkflowBuilderProps {
  workflowId?: string;
}

export default function WorkflowBuilder({ workflowId }: WorkflowBuilderProps = {}) {
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showSettings, setShowSettings] = useState(false);
  const [showNodePalette, setShowNodePalette] = useState(true);
  const [isNodePaletteCollapsed, setIsNodePaletteCollapsed] = useState(false);
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult>({ valid: true, errors: [] });
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<'draft' | 'active' | 'paused' | 'disabled' | 'archived'>('draft');
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [lastSavedState, setLastSavedState] = useState<{
    nodes: any[];
    edges: any[];
    name: string;
    description: string;
  } | null>(null);
  const router = useRouter();

  const { state, setOpen, setOpenMobile } = useSidebar();
  const autoSaveMutation = useAutoSaveWorkflowFlow();
  const updateStatusMutation = useUpdateWorkflowStatus();
  const initialLayoutAppliedRef = useRef(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!initialLayoutAppliedRef.current) {
      setOpen(false);
      initialLayoutAppliedRef.current = true;
    }
  }, [setOpen]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const projects = await getProjects();
        if (projects.length === 0) {
          toast.error("No projects found. Please create a project first.");
          return;
        }

        const firstProject = projects[0];
        setProjectId(firstProject.id);
        if (workflowId) {
          const workflow = await getWorkflow(workflowId);
          console.log('Loaded workflow:', workflow);
          
          const displayName = workflow.name || workflow.definition.name || "Untitled Workflow";
          const displayDescription = workflow.description || workflow.definition.description || "";
          
          console.log('Setting workflow name to:', displayName);
          setWorkflowName(displayName);
          setWorkflowDescription(displayDescription);
          setWorkflowStatus(workflow.status);
          
          if (workflow.definition.nodes && workflow.definition.edges) {
            setNodes(workflow.definition.nodes);
            setEdges(workflow.definition.edges);
          }

          // Set initial saved state
          setLastSavedState({
            nodes: workflow.definition.nodes || [],
            edges: workflow.definition.edges || [],
            name: displayName,
            description: displayDescription
          });
        }
      } catch (err) {
        console.error('Error loading workflow data:', err);
        toast.error(err instanceof Error ? err.message : 'Failed to load workflow data');
      }
    };

    loadData();
  }, [workflowId, setNodes, setEdges]);

  useEffect(() => {
    const result = validateWorkflow(nodes, edges);
    setValidationResult(result);
  }, [nodes, edges]);

  const updateNodeData = useCallback((nodeId: string, updates: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  }, [setNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    // Remove the node
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    
    // Remove any connected edges
    setEdges((eds) => 
      eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
    
    // Show confirmation toast
    toast.success('Node deleted successfully');
  }, [setNodes, setEdges]);

  // Function to check if current state differs from last saved state
  const hasChanges = useCallback(() => {
    if (!lastSavedState) return false;
    
    // Compare nodes (deep comparison of relevant properties)
    const currentNodesSimplified = nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data
    }));
    
    const savedNodesSimplified = lastSavedState.nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data
    }));
    
    if (JSON.stringify(currentNodesSimplified) !== JSON.stringify(savedNodesSimplified)) {
      return true;
    }
    
    // Compare edges
    const currentEdgesSimplified = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle
    }));
    
    const savedEdgesSimplified = lastSavedState.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle
    }));
    
    if (JSON.stringify(currentEdgesSimplified) !== JSON.stringify(savedEdgesSimplified)) {
      return true;
    }
    
    // Compare name and description
    if (workflowName !== lastSavedState.name || workflowDescription !== lastSavedState.description) {
      return true;
    }
    
    return false;
  }, [nodes, edges, workflowName, workflowDescription, lastSavedState]);

  const debouncedAutoSave = useCallback(() => {
    if (!workflowId || !projectId || !hasChanges()) return;
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        setAutoSaving(true);
        
        const nodesToSave = nodes.map(node => ({
          id: node.id,
          type: node.type || 'default',
          position: node.position,
          data: node.data
        })) as WorkflowNode[];

        const edgesToSave = edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle
        })) as WorkflowEdge[];
        
        await autoSaveMutation.mutateAsync({
          id: workflowId,
          nodes: nodesToSave,
          edges: edgesToSave,
          metadata: {
            name: workflowName,
            description: workflowDescription,
            max_execution_time: 300,
            max_retries: 3,
            is_template: false
          }
        });

        // Update the last saved state
        setLastSavedState({
          nodes: nodesToSave,
          edges: edgesToSave,
          name: workflowName,
          description: workflowDescription
        });

        setLastSaved(new Date());
      } catch (err) {
        console.error('Auto-save failed:', err);
      } finally {
        setAutoSaving(false);
      }
    }, 2000);
  }, [workflowId, projectId, nodes, edges, workflowName, workflowDescription, autoSaveMutation, hasChanges]);

  useEffect(() => {
    if (workflowId && lastSavedState) {
      debouncedAutoSave();
    }
  }, [nodes, edges, workflowName, workflowDescription, debouncedAutoSave, workflowId, lastSavedState]);

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const handleSaveWorkflow = async () => {
    if (!projectId) {
      toast.error("No project selected");
      return;
    }
    const validation = validateWorkflow(nodes, edges);
    if (!validation.valid) {
      const errorMessages = validation.errors
        .filter(e => e.type === 'error')
        .map(e => e.message)
        .join(', ');
      toast.error(`Cannot save workflow: ${errorMessages}`);
      return;
    }

    try {
      setSaving(true);
      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        project_id: projectId,
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type || 'default',
          position: node.position,
          data: node.data
        })) as WorkflowNode[],
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle
        })) as WorkflowEdge[],
        variables: {}
      };

      if (workflowId) {
        await updateWorkflow(workflowId, workflowData);
        toast.success("Workflow updated successfully!");
        setLastSavedState({
          nodes: workflowData.nodes,
          edges: workflowData.edges,
          name: workflowName,
          description: workflowDescription
        });
        setLastSaved(new Date());
      } else {
        const newWorkflow = await createWorkflow(workflowData);
        toast.success("Workflow created successfully!");
        router.push(`/workflows/builder/${newWorkflow.id}`);
      }
    } catch (err) {
      console.error('Error saving workflow:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  const handleRunWorkflow = async () => {
    if (!workflowId) {
      toast.error("Please save the workflow first");
      return;
    }

    if (!projectId) {
      toast.error("No project selected");
      return;
    }

    try {
      setRunning(true);
      const result = await executeWorkflow(workflowId);
      toast.success("Workflow execution started! Redirecting to chat...");
      console.log('Workflow execution started:', result);
      
      // Redirect to the thread page
      if (result.thread_id) {
        router.push(`/projects/${projectId}/thread/${result.thread_id}`);
      }
    } catch (err) {
      console.error('Error running workflow:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to run workflow');
    } finally {
      setRunning(false);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `e-${params.source}-${params.target}-${Date.now()}`,
        type: "smoothstep",
        animated: true,
        style: { 
          strokeWidth: 2, 
          stroke: '#6366f1',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#6366f1',
        },
      } as Edge;
      setEdges((eds) => addEdge(newEdge, eds));
      
      // Update both source and target nodes with connection information
      setNodes((nds) => 
        nds.map((node) => {
          // Update target node (receiving the connection)
          if (node.id === params.target) {
            const sourceNode = nds.find(n => n.id === params.source);
            if (sourceNode) {
              const inputConnections = (node.data.inputConnections as any[]) || [];
              const connectedTools = (node.data.connectedTools as any[]) || [];
              
              const newInputConnection = {
                id: sourceNode.id,
                name: sourceNode.data.label,
                type: sourceNode.type === 'toolConnectionNode' ? 'tool' : sourceNode.type || 'unknown',
                handleId: params.targetHandle || 'input'
              };
              
              // Check if connection already exists
              const isInputAlreadyConnected = inputConnections.some((conn: any) => 
                conn.id === newInputConnection.id && conn.handleId === newInputConnection.handleId
              );
              
              let updatedData = { ...node.data };
              
              if (!isInputAlreadyConnected) {
                updatedData.inputConnections = [...inputConnections, newInputConnection];
              }
              
              // If it's a tool connection to an agent, also update connectedTools
              if (params.targetHandle === "tools" && params.sourceHandle === "tool-connection") {
                const newTool = {
                  id: sourceNode.id,
                  name: sourceNode.data.label,
                  type: sourceNode.data.nodeId || "unknown"
                };
                
                const isToolAlreadyConnected = connectedTools.some((tool: any) => tool.id === newTool.id);
                if (!isToolAlreadyConnected) {
                  updatedData.connectedTools = [...connectedTools, newTool];
                }
              }
              
              return {
                ...node,
                data: updatedData
              };
            }
          }
          
          // Update source node (sending the connection)
          if (node.id === params.source) {
            const targetNode = nds.find(n => n.id === params.target);
            if (targetNode) {
              const outputConnections = (node.data.outputConnections as any[]) || [];
              
              const newOutputConnection = {
                id: targetNode.id,
                name: targetNode.data.label,
                type: targetNode.type === 'agentNode' ? 'agent' : targetNode.type || 'unknown',
                handleId: params.sourceHandle || 'output'
              };
              
              // Check if connection already exists
              const isOutputAlreadyConnected = outputConnections.some((conn: any) => 
                conn.id === newOutputConnection.id && conn.handleId === newOutputConnection.handleId
              );
              
              if (!isOutputAlreadyConnected) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    outputConnections: [...outputConnections, newOutputConnection]
                  }
                };
              }
            }
          }
          
          return node;
        })
      );
    },
    [setEdges, setNodes]
  );

  // Handle edge removal to update connected tools
  const handleEdgesChange = useCallback(
    (changes: any[]) => {
      const removedEdges = changes.filter((change: any) => change.type === 'remove');
      
      if (removedEdges.length > 0) {
        // Get the current edges before removal
        const currentEdges = edges;
        
        setNodes((nds) => 
          nds.map((node) => {
            let updatedData = { ...node.data };
            let hasChanges = false;
            
            // Handle agent nodes
            if (node.type === 'agentNode') {
              const connectedTools = (node.data.connectedTools as any[]) || [];
              const inputConnections = (node.data.inputConnections as any[]) || [];
              
              // Update connected tools
              const updatedTools = connectedTools.filter((tool: any) => {
                const isBeingRemoved = removedEdges.some((removedEdge: any) => {
                  if (!removedEdge.id) return false;
                  const edgeToRemove = currentEdges.find(e => e.id === removedEdge.id);
                  return edgeToRemove && 
                         edgeToRemove.source === tool.id && 
                         edgeToRemove.target === node.id &&
                         edgeToRemove.targetHandle === 'tools' &&
                         edgeToRemove.sourceHandle === 'tool-connection';
                });
                return !isBeingRemoved;
              });
              
              // Update input connections
              const updatedInputConnections = inputConnections.filter((conn: any) => {
                const isBeingRemoved = removedEdges.some((removedEdge: any) => {
                  if (!removedEdge.id) return false;
                  const edgeToRemove = currentEdges.find(e => e.id === removedEdge.id);
                  return edgeToRemove && 
                         edgeToRemove.source === conn.id && 
                         edgeToRemove.target === node.id &&
                         edgeToRemove.targetHandle === conn.handleId;
                });
                return !isBeingRemoved;
              });
              
              if (updatedTools.length !== connectedTools.length) {
                updatedData.connectedTools = updatedTools;
                hasChanges = true;
              }
              
              if (updatedInputConnections.length !== inputConnections.length) {
                updatedData.inputConnections = updatedInputConnections;
                hasChanges = true;
              }
            }
            
            // Handle tool nodes and other nodes with output connections
            if (node.type === 'toolConnectionNode' || node.data.outputConnections) {
              const outputConnections = (node.data.outputConnections as any[]) || [];
              
              const updatedOutputConnections = outputConnections.filter((conn: any) => {
                const isBeingRemoved = removedEdges.some((removedEdge: any) => {
                  if (!removedEdge.id) return false;
                  const edgeToRemove = currentEdges.find(e => e.id === removedEdge.id);
                  return edgeToRemove && 
                         edgeToRemove.source === node.id && 
                         edgeToRemove.target === conn.id &&
                         edgeToRemove.sourceHandle === conn.handleId;
                });
                return !isBeingRemoved;
              });
              
              if (updatedOutputConnections.length !== outputConnections.length) {
                updatedData.outputConnections = updatedOutputConnections;
                hasChanges = true;
              }
            }
            
            return hasChanges ? { ...node, data: updatedData } : node;
          })
        );
      }
      
      onEdgesChange(changes);
    },
    [edges, setNodes, onEdgesChange]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      const nodeDataString = event.dataTransfer.getData("nodeData");

      if (typeof type === "undefined" || !type || !nodeDataString) {
        return;
      }

      const nodeData = JSON.parse(nodeDataString);
      const position = {
        x: event.clientX - 250,
        y: event.clientY - 100,
      };

      let nodeType = "toolConnectionNode";
      if (nodeData.nodeId === "agent") {
        nodeType = "agentNode";
      } else if (type === "inputNode" || nodeData.nodeId === "inputNode") {
        nodeType = "inputNode";
      } else if (type === "mcpNode" || nodeData.mcpType) {
        nodeType = "mcpNode";
      }

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: nodeType,
        position,
        data: {
          ...nodeData,
          id: `${type}-${Date.now()}`,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const handleToggleWorkflowStatus = async () => {
    if (!workflowId) return;
    
    try {
      setTogglingStatus(true);
      const newStatus = workflowStatus === 'active' ? 'draft' : 'active';
      
      await updateStatusMutation.mutateAsync({
        id: workflowId,
        status: newStatus
      });

      setWorkflowStatus(newStatus);
    } catch (err) {
      console.error('Error updating workflow status:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update workflow status');
    } finally {
      setTogglingStatus(false);
    }
  };

  return (
    <>
      {/* Workflow Builder Welcome Modal */}
      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent className="max-w-md z-[100]" style={{ zIndex: 1000 }}>
          <DialogHeader>
            <DialogTitle className="text-xl">Welcome to Machine Flow</DialogTitle>
            <DialogDescription className="text-base">
              Build powerful automated workflows with a visual interface
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                  <rect width="8" height="8" x="8" y="8" rx="2" />
                  <path d="M4 10a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2" />
                  <path d="M14 20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2" />
                  <path d="M10 20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2" />
                  <path d="M20 10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-sm">Drag & Connect Nodes</h4>
                <p className="text-sm text-muted-foreground">Add nodes from the left panel and connect them to create workflow logic.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400">
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-sm">Configure Node Settings</h4>
                <p className="text-sm text-muted-foreground">Click on any node to configure its settings and behavior.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-2 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 dark:text-purple-400">
                  <path d="M12 5v14" />
                  <path d="m19 12-7 7-7-7" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-sm">Save & Run Workflow</h4>
                <p className="text-sm text-muted-foreground">Save your workflow and run it to see results in real time.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowWelcomeModal(false)} className="w-full sm:w-auto">
              Continue to Builder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <style jsx global>{`
        .react-flow__edge-path {
          stroke: #6366f1 !important;
          stroke-width: 2 !important;
        }
        
        .react-flow__edge.animated .react-flow__edge-path {
          stroke-dasharray: 5;
          animation: dashdraw 0.5s linear infinite;
        }
        
        @keyframes dashdraw {
          to {
            stroke-dashoffset: -10;
          }
        }
        
        .react-flow__connection-path {
          stroke: #6366f1 !important;
          stroke-width: 2 !important;
        }
        
        .react-flow__edge-text {
          fill: #6366f1 !important;
        }
        
        .react-flow__edge.selected .react-flow__edge-path {
          stroke: #818cf8 !important;
          stroke-width: 3 !important;
        }
      `}</style>
      
      <div className="flex h-full bg-background">
        {showNodePalette && (
          <div className={`${isNodePaletteCollapsed ? 'w-17' : 'w-80'} border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-300 ease-in-out`}>
            <NodePalette onCollapseChange={setIsNodePaletteCollapsed} />
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <div className="h-16 px-6 border-b border-border bg-background">
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20">
                  <Workflow className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-lg font-semibold">{workflowName}</h1>
                  {workflowId && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {autoSaving ? (
                        <>
                          <Cloud className="h-3 w-3 animate-pulse" />
                          <span>Saving...</span>
                        </>
                      ) : lastSaved ? (
                        <>
                          <Check className="h-3 w-3 text-green-500" />
                          <span>Saved {lastSaved.toLocaleTimeString()}</span>
                        </>
                      ) : (
                        <>
                          <Cloud className="h-3 w-3" />
                          <span>Ready</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {workflowId && (
                  <Button
                    variant={workflowStatus === 'active' ? "default" : "outline"}
                    size="sm"
                    onClick={handleToggleWorkflowStatus}
                    disabled={togglingStatus}
                    className={workflowStatus === 'active' ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {togglingStatus ? (
                      <Loader2 className="animate-spin rounded-full h-4 w-4" />
                    ) : workflowStatus === 'active' ? (
                      <PowerOff className="h-4 w-4" />
                    ) : (
                      <Power className="h-4 w-4" />
                    )}
                    {workflowStatus === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={handleSaveWorkflow}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="animate-spin rounded-full h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button
                  onClick={handleRunWorkflow}
                  disabled={running || !workflowId}
                >
                  {running ? (
                    <Loader2 className="animate-spin rounded-full h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {running ? "Running..." : "Run Workflow"}
                </Button>
              </div>
            </div>
          </div>

          
          {/* {validationResult.errors.length > 0 && (
            <Card className="mx-4 mt-4 border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  {validationResult.valid ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    {validationResult.valid ? 'Warnings' : 'Validation Errors'}
                  </span>
                  <Badge variant={validationResult.valid ? "secondary" : "destructive"} className="text-xs">
                    {validationResult.errors.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {validationResult.errors.map((error, index) => (
                    <div key={index} className={`flex items-start gap-2 text-sm p-2 rounded ${
                      error.type === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300' : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-300'
                    }`}>
                      {error.type === 'error' ? (
                        <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )}
                      <span>{error.message}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )} */}

          <div className="flex-1 border border-border/50 bg-background backdrop-blur-sm overflow-hidden">
            <WorkflowProvider updateNodeData={updateNodeData} deleteNode={deleteNode} workflowId={workflowId}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                connectionLineType={ConnectionLineType.SmoothStep}
                connectionLineStyle={{ 
                  strokeWidth: 2, 
                  stroke: '#6366f1',
                }}
                fitView
                className="bg-transparent"
              >
                {/* <Controls 
                  className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg"
                  showZoom={true}
                  showFitView={true}
                  showInteractive={true}
                />
                <MiniMap 
                  className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg"
                  nodeColor={(node) => {
                    if (node.type === 'agentNode') return '#6366f1';
                    return '#9ca3af';
                  }}
                /> */}
                {/* <Background 
                  variant={BackgroundVariant.Dots} 
                  gap={20} 
                  size={1}
                /> */}
                
                {/* Machine Flow branding overlay */}
                <div className="absolute bottom-4 right-4 z-[9999] bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-sm border border-border/50 text-xs font-medium pointer-events-none" style={{ zIndex: 9999 }}>
                  Machine Flow
                </div>
              </ReactFlow>
            </WorkflowProvider>
          </div>
          {/* <Card className="h-13.5 rounded-none border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-0">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-muted-foreground">Ready</span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-muted-foreground">
                    {nodes.length} nodes, {edges.length} connections
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                    <Zap className="h-3 w-3 mr-1" />
                    AgentPress
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>

        <WorkflowSettings 
          open={showSettings} 
          onOpenChange={setShowSettings} 
          nodes={nodes}
          edges={edges}
          workflowName={workflowName}
          workflowDescription={workflowDescription}
          workflowId={workflowId}
          onWorkflowNameChange={setWorkflowName}
          onWorkflowDescriptionChange={setWorkflowDescription}
        />
      </div>
    </>
  );
} 