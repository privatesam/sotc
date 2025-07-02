import { useState, useEffect } from "react";
import { WatchCard } from "./watch-card";
import { Button } from "@/components/ui/button";
import { Plus, Clock, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Watch, Collection } from "@shared/schema";

interface WatchGridProps {
  watches: Watch[];
  collection?: Collection;
  onWatchClick: (watch: Watch) => void;
  onAddWatch: () => void;
}

interface SortableWatchCardProps {
  watch: Watch;
  onClick: () => void;
  isDragging?: boolean;
}

function SortableWatchCard({ watch, onClick, isDragging }: SortableWatchCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: watch.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <WatchCard watch={watch} onClick={onClick} />
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1 bg-black/20 rounded cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-4 h-4 text-white" />
      </div>
    </div>
  );
}

export function WatchGrid({ watches, collection, onWatchClick, onAddWatch }: WatchGridProps) {
  const [sortedWatches, setSortedWatches] = useState(watches);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const gridColumns = collection?.gridColumns || 4;
  const gridRows = collection?.gridRows || 3;
  const totalCells = gridColumns * gridRows;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updatePositionsMutation = useMutation({
    mutationFn: async (positions: { id: number; gridPosition: number }[]) => {
      await apiRequest("PUT", "/api/watches/positions", positions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watches"] });
      toast({ title: "Watch order updated" });
    },
    onError: () => {
      toast({ title: "Failed to update watch order", variant: "destructive" });
      setSortedWatches(watches); // Reset on error
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedWatches.findIndex(watch => watch.id === active.id);
    const newIndex = sortedWatches.findIndex(watch => watch.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newSortedWatches = arrayMove(sortedWatches, oldIndex, newIndex);
      setSortedWatches(newSortedWatches);

      // Update positions in backend
      const positionUpdates = newSortedWatches.map((watch, index) => ({
        id: watch.id,
        gridPosition: index,
      }));

      updatePositionsMutation.mutate(positionUpdates);
    }
  };

  // Update sorted watches when props change
  useEffect(() => {
    const watchesSortedByPosition = [...watches].sort((a, b) => {
      const posA = a.gridPosition ?? 999;
      const posB = b.gridPosition ?? 999;
      return posA - posB;
    });
    setSortedWatches(watchesSortedByPosition);
  }, [watches]);

  // Create grid with watches positioned sequentially
  const gridCells = Array.from({ length: totalCells }, (_, index) => {
    return sortedWatches[index] || null;
  });

  const gridStyles = {
    gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-6" style={gridStyles}>
        <SortableContext
          items={sortedWatches.map(w => w.id)}
          strategy={rectSortingStrategy}
        >
          {gridCells.map((watch, index) => {
            if (watch) {
              return (
                <SortableWatchCard
                  key={watch.id}
                  watch={watch}
                  onClick={() => onWatchClick(watch)}
                />
              );
            }

            // Show add button in first empty cell
            if (index === sortedWatches.length && sortedWatches.length < totalCells) {
              return (
                <div
                  key={`add-${index}`}
                  className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl overflow-hidden hover:border-primary hover:bg-slate-50 transition-all duration-300 cursor-pointer group aspect-square"
                  onClick={onAddWatch}
                >
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-slate-200 group-hover:bg-primary group-hover:text-white rounded-full flex items-center justify-center mx-auto mb-3 transition-all duration-300">
                        <Plus className="w-6 h-6" />
                      </div>
                      <p className="text-slate-500 group-hover:text-primary font-medium text-sm transition-colors duration-300">
                        Add Watch
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            // Empty cell
            return (
              <div
                key={`empty-${index}`}
                className="bg-slate-50 border border-slate-200 rounded-xl aspect-square flex items-center justify-center opacity-50"
              >
                <Clock className="w-8 h-8 text-slate-300" />
              </div>
            );
          })}
        </SortableContext>
      </div>
    </DndContext>
  );
}
