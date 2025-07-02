import { useState } from "react";
import { useCollections } from "@/hooks/use-collections";
import { useWatches } from "@/hooks/use-watches";
import { CollectionSwitcher } from "@/components/collection-switcher";
import { CollectionStats } from "@/components/collection-stats";
import { WatchGrid } from "@/components/watch-grid";
import { WatchDetailModal } from "@/components/watch-detail-modal";
import { GridConfigModal } from "@/components/grid-config-modal";
import { AddWatchModal } from "@/components/add-watch-modal";
import { WearAnalyticsModal } from "@/components/wear-analytics-modal";
import { CollectionImageExport } from "@/components/collection-image-export";
import { Button } from "@/components/ui/button";
import { Plus, Grid3X3, BarChart3, Share2 } from "lucide-react";
import type { Watch } from "@shared/schema";

export default function Home() {
  const [currentCollectionId, setCurrentCollectionId] = useState<number>(1);
  const [selectedWatch, setSelectedWatch] = useState<Watch | null>(null);
  const [isGridConfigOpen, setIsGridConfigOpen] = useState(false);
  const [isAddWatchOpen, setIsAddWatchOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isImageExportOpen, setIsImageExportOpen] = useState(false);

  const { data: collections = [] } = useCollections();
  const { data: watches = [] } = useWatches(currentCollectionId);
  
  const currentCollection = collections.find(c => c.id === currentCollectionId);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-0 sm:h-16 gap-4 sm:gap-0">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-slate-900">SOTC</h1>
              <span className="text-slate-500 text-sm hidden sm:inline">State of the Collection</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="w-full sm:w-auto">
                <CollectionSwitcher
                  collections={collections}
                  currentCollectionId={currentCollectionId}
                  onCollectionChange={setCurrentCollectionId}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsImageExportOpen(true)}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  disabled={watches.length === 0}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Share as Image</span>
                  <span className="sm:hidden">Share</span>
                </Button>
                
                <Button
                  onClick={() => setIsGridConfigOpen(true)}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Configure Grid</span>
                  <span className="sm:hidden">Grid</span>
                </Button>
                
                <Button
                  onClick={() => setIsAnalyticsOpen(true)}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Analytics</span>
                  <span className="sm:hidden">Stats</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CollectionStats 
          watches={watches} 
          collectionId={currentCollectionId}
        />
        
        <WatchGrid
          watches={watches}
          collection={currentCollection}
          onWatchClick={setSelectedWatch}
          onAddWatch={() => setIsAddWatchOpen(true)}
        />
      </main>

      {/* Modals */}
      {selectedWatch && (
        <WatchDetailModal
          watch={selectedWatch}
          onClose={() => setSelectedWatch(null)}
          onSave={() => setSelectedWatch(null)}
        />
      )}

      {isGridConfigOpen && currentCollection && (
        <GridConfigModal
          collection={currentCollection}
          onClose={() => setIsGridConfigOpen(false)}
        />
      )}

      {isAddWatchOpen && (
        <AddWatchModal
          collectionId={currentCollectionId}
          onClose={() => setIsAddWatchOpen(false)}
        />
      )}

      {isAnalyticsOpen && (
        <WearAnalyticsModal
          watches={watches}
          onClose={() => setIsAnalyticsOpen(false)}
        />
      )}

      {isImageExportOpen && currentCollection && (
        <CollectionImageExport
          watches={watches}
          collection={currentCollection}
          onClose={() => setIsImageExportOpen(false)}
        />
      )}
    </div>
  );
}
