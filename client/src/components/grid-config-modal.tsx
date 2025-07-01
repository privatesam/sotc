import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Collection, UpdateCollection } from "@shared/schema";

interface GridConfigModalProps {
  collection: Collection;
  onClose: () => void;
}

export function GridConfigModal({ collection, onClose }: GridConfigModalProps) {
  const [columns, setColumns] = useState([collection.gridColumns]);
  const [rows, setRows] = useState([collection.gridRows]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateCollectionMutation = useMutation({
    mutationFn: async (data: UpdateCollection) => {
      await apiRequest("PUT", `/api/collections/${collection.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      toast({ title: "Grid layout updated successfully" });
      onClose();
    },
    onError: () => {
      toast({
        title: "Failed to update grid layout",
        variant: "destructive",
      });
    },
  });

  const handleApply = () => {
    updateCollectionMutation.mutate({
      id: collection.id,
      gridColumns: columns[0],
      gridRows: rows[0],
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Grid Layout</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-6">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-3 block">
              Columns: {columns[0]}
            </Label>
            <Slider
              value={columns}
              onValueChange={setColumns}
              min={2}
              max={6}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>2</span>
              <span>6</span>
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-3 block">
              Rows: {rows[0]}
            </Label>
            <Slider
              value={rows}
              onValueChange={setRows}
              min={2}
              max={8}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>2</span>
              <span>8</span>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-3">Preview</p>
            <div 
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${columns[0]}, 1fr)` }}
            >
              {Array.from({ length: columns[0] * rows[0] }, (_, i) => (
                <div 
                  key={i}
                  className="bg-slate-200 aspect-square rounded border"
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3 mt-6">
          <Button
            onClick={handleApply}
            className="flex-1"
            disabled={updateCollectionMutation.isPending}
          >
            Apply
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
