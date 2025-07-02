import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2 } from "lucide-react";
import type { Collection, InsertCollection, UpdateCollection } from "@shared/schema";

interface CollectionSwitcherProps {
  collections: Collection[];
  currentCollectionId: number;
  onCollectionChange: (id: number) => void;
}

export function CollectionSwitcher({ 
  collections, 
  currentCollectionId, 
  onCollectionChange 
}: CollectionSwitcherProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState<InsertCollection>({
    name: "",
    description: "",
    gridColumns: 4,
    gridRows: 3,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const currentCollection = collections.find(c => c.id === currentCollectionId);

  const createCollectionMutation = useMutation({
    mutationFn: async (data: InsertCollection) => {
      const response = await apiRequest("POST", "/api/collections", data);
      return response.json();
    },
    onSuccess: (newCollection) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      onCollectionChange(newCollection.id);
      setIsCreateModalOpen(false);
      setFormData({ name: "", description: "", gridColumns: 4, gridRows: 3 });
      toast({ title: "Collection created successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to create collection",
        variant: "destructive",
      });
    },
  });

  const updateCollectionMutation = useMutation({
    mutationFn: async (data: UpdateCollection) => {
      const response = await apiRequest("PUT", `/api/collections/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      setIsEditModalOpen(false);
      setEditingCollection(null);
      toast({ title: "Collection updated successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to update collection",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || "",
      gridColumns: collection.gridColumns,
      gridRows: collection.gridRows,
    });
    setIsEditModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Please enter a collection name",
        variant: "destructive",
      });
      return;
    }
    createCollectionMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !editingCollection) {
      toast({
        title: "Please enter a collection name",
        variant: "destructive",
      });
      return;
    }
    updateCollectionMutation.mutate({
      id: editingCollection.id,
      name: formData.name,
      description: formData.description || "",
      gridColumns: formData.gridColumns,
      gridRows: formData.gridRows,
    });
  };

  return (
    <>
      <div className="flex items-center space-x-4">
        <Select 
          value={currentCollectionId.toString()} 
          onValueChange={(value) => onCollectionChange(parseInt(value))}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {collections.map(collection => (
              <SelectItem key={collection.id} value={collection.id.toString()}>
                {collection.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          onClick={() => currentCollection && handleEdit(currentCollection)}
          size="sm"
          variant="outline"
          disabled={!currentCollection}
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Rename
        </Button>
        
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Collection
        </Button>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <Label htmlFor="name">Collection Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Wish List, Wife's Collection"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="columns">Grid Columns</Label>
                <Select 
                  value={formData.gridColumns.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gridColumns: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => i + 2).map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="rows">Grid Rows</Label>
                <Select 
                  value={formData.gridRows.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gridRows: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 7 }, (_, i) => i + 2).map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={createCollectionMutation.isPending || !formData.name.trim()}
              >
                Create Collection
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Collection Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 mt-6">
            <div>
              <Label htmlFor="edit-name">Collection Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., SOTC, Wish List, Wife's Collection"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-columns">Grid Columns</Label>
                <Select 
                  value={formData.gridColumns?.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gridColumns: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => i + 2).map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-rows">Grid Rows</Label>
                <Select 
                  value={formData.gridRows?.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gridRows: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 7 }, (_, i) => i + 2).map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={updateCollectionMutation.isPending || !formData.name.trim()}
              >
                Update Collection
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
