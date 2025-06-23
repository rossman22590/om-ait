"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Webhook, Clock, Mail, Trash2 } from "lucide-react";
import { useWorkflow } from "../WorkflowContext";

interface TriggerNodeData {
  label: string;
  triggerType: string;
  config: any;
}

const TriggerNode = memo(({ data, selected, id }: NodeProps) => {
  const nodeData = data as unknown as TriggerNodeData;
  const { deleteNode } = useWorkflow();
  const getIcon = () => {
    switch (nodeData.triggerType) {
      case "webhook":
        return <Webhook className="h-4 w-4" />;
      case "schedule":
        return <Clock className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      default:
        return <Webhook className="h-4 w-4" />;
    }
  };

  return (
    <Card className={`min-w-[200px] ${selected ? "ring-2 ring-primary" : ""}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded">
              {getIcon()}
            </div>
            <Badge variant="outline" className="text-xs">Trigger</Badge>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-muted/80"
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
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-primary"
      />
    </Card>
  );
});

TriggerNode.displayName = "TriggerNode";

export default TriggerNode; 