import { WatchCard } from "./watch-card";
import { Button } from "@/components/ui/button";
import { Plus, Clock } from "lucide-react";
import type { Watch, Collection } from "@shared/schema";

interface WatchGridProps {
  watches: Watch[];
  collection?: Collection;
  onWatchClick: (watch: Watch) => void;
  onAddWatch: () => void;
}

export function WatchGrid({ watches, collection, onWatchClick, onAddWatch }: WatchGridProps) {
  const gridColumns = collection?.gridColumns || 4;
  const gridRows = collection?.gridRows || 3;
  const totalCells = gridColumns * gridRows;

  // Create grid with watches positioned at their gridPosition or fill sequentially
  const gridCells = Array.from({ length: totalCells }, (_, index) => {
    const watch = watches.find(w => w.gridPosition === index) || 
                 watches.find(w => w.gridPosition === null && watches.indexOf(w) === index);
    return watch || null;
  });

  const gridStyles = {
    gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
  };

  return (
    <div 
      className="grid gap-6" 
      style={gridStyles}
    >
      {gridCells.map((watch, index) => {
        if (watch) {
          return (
            <WatchCard
              key={watch.id}
              watch={watch}
              onClick={() => onWatchClick(watch)}
            />
          );
        }

        // Show add button in first empty cell
        if (index === watches.length && watches.length < totalCells) {
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
    </div>
  );
}
