import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useBrands } from "@/hooks/use-brands";
import { Download, X } from "lucide-react";
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

  const handleExport = async () => {
    if (!exportRef.current) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#f8fafc',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: exportRef.current.scrollWidth,
        height: exportRef.current.scrollHeight,
      });

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
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 overflow-x-auto">
            <div
              ref={exportRef}
              style={{ 
                width: `${Math.max(gridColumns * 200, 800)}px`,
                background: '#f8fafc',
                padding: '40px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                margin: '0 auto'
              }}
            >
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  color: '#1e293b',
                  margin: '0 0 8px 0' 
                }}>
                  {exportTitle}
                </h1>
                <p style={{ 
                  color: '#64748b',
                  fontSize: '16px',
                  margin: '0'
                }}>
                  {watches.length} watch{watches.length !== 1 ? 'es' : ''}
                  {watches.reduce((sum, w) => sum + (w.valuation || 0), 0) > 0 && 
                    ` • Total value: £${(watches.reduce((sum, w) => sum + (w.valuation || 0), 0) / 100).toLocaleString()}`
                  }
                </p>
              </div>

              {/* Watch Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridColumns}, 180px)`,
                gap: '20px',
                justifyContent: 'center',
                marginBottom: '40px'
              }}>
                {gridCells.map((watch, index) => {
                  if (watch) {
                    const brand = brands.find(b => b.id === watch.brandId);
                    return (
                      <div
                        key={watch.id}
                        style={{
                          width: '180px',
                          height: '230px',
                          backgroundColor: 'white',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          overflow: 'visible',
                          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                          marginBottom: '10px'
                        }}
                      >
                        {/* Watch Image */}
                        <div style={{
                          height: '140px',
                          backgroundColor: '#f1f5f9',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          {watch.images && watch.images.length > 0 ? (
                            <img 
                              src={watch.images[0]} 
                              alt={watch.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                              }}
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#94a3b8',
                              fontSize: '12px'
                            }}>
                              No Image
                            </div>
                          )}
                        </div>
                        
                        {/* Watch Info */}
                        <div style={{
                          height: '90px',
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-start',
                          overflow: 'visible',
                          position: 'relative'
                        }}>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#1e293b',
                            marginBottom: '3px',
                            lineHeight: '1.3',
                            height: '32px',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            wordBreak: 'break-word'
                          }}>
                            {watch.name}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            color: '#64748b',
                            marginBottom: '2px',
                            lineHeight: '1.2',
                            height: '12px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {brand?.name || 'Unknown Brand'}
                          </div>
                          {watch.model && (
                            <div style={{
                              fontSize: '9px',
                              color: '#94a3b8',
                              lineHeight: '1.2',
                              height: '11px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {watch.model}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Empty slot
                  return (
                    <div
                      key={`empty-${index}`}
                      style={{
                        width: '180px',
                        height: '230px',
                        border: '2px dashed #cbd5e1',
                        borderRadius: '12px',
                        backgroundColor: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '10px'
                      }}
                    >
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>Empty</span>
                    </div>
                  );
                })}
              </div>

              {/* Watermark */}
              {showWatermark && (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#94a3b8', 
                  fontSize: '14px' 
                }}>
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