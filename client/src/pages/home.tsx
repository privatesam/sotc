import { useState } from "react";
import { useCollections } from "@/hooks/use-collections";
import { useWatches } from "@/hooks/use-watches";
import { CollectionSwitcher } from "@/components/collection-switcher";
import { CollectionStats } from "@/components/collection-stats";
import { WatchGrid } from "@/components/watch-grid";
import { WatchDetailModal } from "@/components/watch-detail-modal";
import { GridConfigModal } from "@/components/grid-config-modal";
import { AddWatchModal } from "@/components/add-watch-modal";
import { Button } from "@/components/ui/button";
import { Plus, Grid3X3 } from "lucide-react";
import type { Watch } from "@shared/schema";

export default function Home() {
  const [currentCollectionId, setCurrentCollectionId] = useState<number>(1);
  const [selectedWatch, setSelectedWatch] = useState<Watch | null>(null);
  const [isGridConfigOpen, setIsGridConfigOpen] = useState(false);
  const [isAddWatchOpen, setIsAddWatchOpen] = useState(false);

  const { data: collections = [] } = useCollections();
  const { data: watches = [] } = useWatches(currentCollectionId);
  
  const currentCollection = collections.find(c => c.id === currentCollectionId);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-slate-900">SOTC</h1>
              <span className="text-slate-500 text-sm">State of the Collection</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <CollectionSwitcher
                collections={collections}
                currentCollectionId={currentCollectionId}
                onCollectionChange={setCurrentCollectionId}
              />
              
              <Button
                onClick={() => setIsGridConfigOpen(true)}
                variant="outline"
                size="sm"
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Configure Grid
              </Button>
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
    </div>
  );
}
