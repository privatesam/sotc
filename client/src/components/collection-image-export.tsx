import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WatchCard } from "./watch-card";
import { useToast } from "@/hooks/use-toast";
import { useBrands } from "@/hooks/use-brands";
import { Share2, Download, X } from "lucide-react";
import html2canvas from "html2canvas";
import type { Watch, Collection } from "@shared/schema";

interface CollectionImageExportProps {
  watches: Watch[];
  collection: Collection;
  onClose: () => void;
}

export function CollectionImageExport({ watches, collection, onClose }: CollectionImageExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportTitle, setExportTitle] = useState(collection.name);
  const [showWatermark, setShowWatermark] = useState(true);
  const exportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { data: brands = [] } = useBrands();

  const gridColumns = collection.gridColumns || 4;
  const gridRows = collection.gridRows || 3;
  const totalCells = gridColumns * gridRows;

  // Sort watches by grid position
  const sortedWatches = [...watches].sort((a, b) => {
    const posA = a.gridPosition ?? 999;
    const posB = b.gridPosition ?? 999;
    return posA - posB;
  });

  // Create grid with watches positioned sequentially
  const gridCells = Array.from({ length: totalCells }, (_, index) => {
    return sortedWatches[index] || null;
  });

  const gridStyles = {
    gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
    gridTemplateRows: `repeat(${gridRows}, 1fr)`,
  };

  const handleExport = async () => {
    if (!exportRef.current) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#f8fafc',
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: exportRef.current.scrollWidth,
        height: exportRef.current.scrollHeight,
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `${exportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_collection.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({ title: "Collection image exported successfully!" });
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Failed to export collection image",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Export Collection as Image</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <Label htmlFor="export-title">Collection Title</Label>
              <Input
                id="export-title"
                value={exportTitle}
                onChange={(e) => setExportTitle(e.target.value)}
                placeholder="Collection name for the image"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="watermark"
                checked={showWatermark}
                onChange={(e) => setShowWatermark(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="watermark">Include SOTC watermark</Label>
            </div>
          </div>

          {/* Preview */}
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-4">
            <div
              ref={exportRef}
              className="bg-slate-50 p-8 rounded-lg"
              style={{ minWidth: '800px' }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{exportTitle}</h1>
                <p className="text-slate-600">
                  {watches.length} watch{watches.length !== 1 ? 'es' : ''} • 
                  {watches.reduce((sum, w) => sum + (w.valuation || 0), 0) > 0 && 
                    ` Total value: £${(watches.reduce((sum, w) => sum + (w.valuation || 0), 0) / 100).toLocaleString()}`
                  }
                </p>
              </div>

              {/* Watch Grid */}
              <div 
                className="grid gap-6 mb-8" 
                style={gridStyles}
              >
                {gridCells.map((watch, index) => {
                  if (watch) {
                    const brand = brands.find(b => b.id === watch.brandId);
                    return (
                      <div
                        key={watch.id}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                        style={{ aspectRatio: '1/1', minHeight: '200px' }}
                      >
                        {/* Watch Image */}
                        <div className="bg-slate-100 relative" style={{ aspectRatio: '1/1', height: '70%' }}>
                          {watch.images && watch.images.length > 0 ? (
                            <img 
                              src={watch.images[0]} 
                              alt={watch.name}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                if (nextElement) nextElement.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full flex items-center justify-center text-slate-400" style={{ display: (watch.images && watch.images.length > 0) ? 'none' : 'flex' }}>
                            No image
                          </div>
                        </div>
                        
                        {/* Watch Info */}
                        <div className="p-3" style={{ height: '30%' }}>
                          <h3 className="font-semibold text-slate-900 text-sm leading-tight truncate">{watch.name}</h3>
                          <p className="text-xs text-slate-600 truncate">{brand?.name || 'Unknown Brand'}</p>
                          {watch.model && (
                            <p className="text-xs text-slate-500 truncate">{watch.model}</p>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Empty slot
                  return (
                    <div
                      key={`empty-${index}`}
                      className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50"
                      style={{ aspectRatio: '1/1', minHeight: '200px' }}
                    />
                  );
                })}
              </div>

              {/* Watermark */}
              {showWatermark && (
                <div className="text-center text-slate-400 text-sm">
                  Created with SOTC - State of the Collection
                </div>
              )}
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Download Image'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}