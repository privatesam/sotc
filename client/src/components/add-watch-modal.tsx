import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useBrands } from "@/hooks/use-brands";
import { insertWatchSchema } from "@shared/schema";
import { Plus, Upload, X, Star } from "lucide-react";
import type { InsertWatch } from "@shared/schema";

interface AddWatchModalProps {
  collectionId: number;
  onClose: () => void;
}

export function AddWatchModal({ collectionId, onClose }: AddWatchModalProps) {
  const [formData, setFormData] = useState<Partial<InsertWatch>>({
    collectionId,
    name: "",
    brandId: undefined,
    model: "",
    purchaseDate: "",
    lastServiced: "",
    valuation: 0,
    servicePeriod: 5,
    details: "",
    history: "",
  });
  const [newBrandName, setNewBrandName] = useState("");
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: brands = [] } = useBrands();

  const addWatchMutation = useMutation({
    mutationFn: async (data: InsertWatch) => {
      const validatedData = insertWatchSchema.parse(data);
      const response = await apiRequest("POST", "/api/watches", validatedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watches"] });
      toast({ title: "Watch added successfully" });
      onClose();
    },
    onError: () => {
      toast({
        title: "Failed to add watch",
        variant: "destructive",
      });
    },
  });

  const uploadImagesMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('images', file);
      });
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const newImages = data.filePaths || [];
      setUploadedImages(prev => [...prev, ...newImages]);
      toast({ title: "Images uploaded successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to upload images",
        variant: "destructive",
      });
    },
  });

  const addBrandMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/brands", { 
        name, 
        isCustom: true 
      });
      return response.json();
    },
    onSuccess: (newBrand) => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      setFormData(prev => ({ ...prev, brandId: newBrand.id }));
      setNewBrandName("");
      setShowAddBrand(false);
      toast({ title: "Brand added successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to add brand",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.brandId) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const watchData = {
      ...formData,
      images: uploadedImages,
      primaryImageIndex: uploadedImages.length > 0 ? primaryImageIndex : undefined,
    } as InsertWatch;

    addWatchMutation.mutate(watchData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadImagesMutation.mutate(files);
    }
    // Reset the input
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    if (primaryImageIndex >= index && primaryImageIndex > 0) {
      setPrimaryImageIndex(prev => prev - 1);
    }
  };

  const handleSetPrimary = (index: number) => {
    setPrimaryImageIndex(index);
  };

  const handleAddBrand = () => {
    if (!newBrandName.trim()) return;
    addBrandMutation.mutate(newBrandName.trim());
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Watch</DialogTitle>
        </DialogHeader>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-6">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> After adding your watch, upload square (1:1) aspect ratio images for the best results in collection image exports
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Submariner"
                required
              />
            </div>
            <div>
              <Label htmlFor="brand">Brand *</Label>
              <div className="flex space-x-2">
                <Select 
                  value={formData.brandId?.toString()} 
                  onValueChange={(value) => {
                    if (value === "add-new") {
                      setShowAddBrand(true);
                    } else {
                      setFormData(prev => ({ ...prev, brandId: parseInt(value) }));
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map(brand => (
                      <SelectItem key={brand.id} value={brand.id.toString()}>
                        {brand.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="add-new">+ Add New Brand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {showAddBrand && (
            <div className="bg-slate-50 p-4 rounded-lg">
              <Label htmlFor="newBrand">New Brand Name</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="newBrand"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Enter brand name"
                />
                <Button 
                  type="button"
                  onClick={handleAddBrand}
                  disabled={!newBrandName.trim() || addBrandMutation.isPending}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddBrand(false)}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="model">Model Number</Label>
            <Input
              id="model"
              value={formData.model || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
              placeholder="e.g., 116610LN"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="lastServiced">Last Serviced</Label>
              <Input
                id="lastServiced"
                type="date"
                value={formData.lastServiced || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, lastServiced: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valuation">Valuation (£)</Label>
              <Input
                id="valuation"
                type="number"
                value={formData.valuation ? formData.valuation / 100 : ""}
                onChange={(e) => {
                  const pounds = parseFloat(e.target.value) || 0;
                  const pence = Math.round(pounds * 100);
                  setFormData(prev => ({ ...prev, valuation: pence }));
                }}
                placeholder="8500"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="servicePeriod">Service Period (years)</Label>
              <Select 
                value={formData.servicePeriod?.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, servicePeriod: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 years</SelectItem>
                  <SelectItem value="5">5 years</SelectItem>
                  <SelectItem value="7">7 years</SelectItem>
                  <SelectItem value="10">10 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="details">Details</Label>
            <Textarea
              id="details"
              rows={4}
              value={formData.details || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
              placeholder="Additional notes about the watch..."
            />
          </div>

          <div>
            <Label htmlFor="history">History & Background</Label>
            <Textarea
              id="history"
              rows={4}
              value={formData.history || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, history: e.target.value }))}
              placeholder="Tell the story of this watch - where it came from, special occasions, memories, provenance..."
            />
          </div>

          <div>
            <Label>Images</Label>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadImagesMutation.isPending}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadImagesMutation.isPending ? "Uploading..." : "Upload"}
                </Button>
              </div>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Watch ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={primaryImageIndex === index ? "default" : "secondary"}
                          onClick={() => handleSetPrimary(index)}
                          className="h-6 px-2 text-xs"
                        >
                          <Star className="w-3 h-3" fill={primaryImageIndex === index ? "currentColor" : "none"} />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveImage(index)}
                          className="h-6 px-2 text-xs"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      {primaryImageIndex === index && (
                        <div className="absolute -top-2 -right-2 bg-yellow-500 text-white rounded-full p-1">
                          <Star className="w-3 h-3" fill="currentColor" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {uploadedImages.length > 0 && (
                <p className="text-sm text-gray-600">
                  {uploadedImages.length} image(s) uploaded. Primary image marked with ⭐
                </p>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              type="submit"
              className="flex-1"
              disabled={addWatchMutation.isPending || !formData.name || !formData.brandId}
            >
              Add Watch
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
