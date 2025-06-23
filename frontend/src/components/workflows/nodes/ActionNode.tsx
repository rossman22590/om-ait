"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Trash2 } from "lucide-react";
import { useWorkflow } from "../WorkflowContext";

interface ActionNodeData {
  label: string;
  actionType: string;
  config: any;
}

const ActionNode = memo(({ data, selected, id }: NodeProps) => {
  const nodeData = data as unknown as ActionNodeData;
  const { deleteNode } = useWorkflow();

  return (
    <Card className={`min-w-[200px] ${selected ? "ring-2 ring-green-500" : ""}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-500/10 rounded">
              <Zap className="h-4 w-4 text-green-600" />
            </div>
            <Badge variant="outline" className="text-xs text-green-600">Action</Badge>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-gray-500 hover:text-red-500 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              deleteNode(id as string);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        <h3 className="font-medium text-sm">{nodeData.label}</h3>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-green-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-green-500"
      />
    </Card>
  );
});

ActionNode.displayName = "ActionNode";

export default ActionNode; 