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
import { Plus } from "lucide-react";
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
  });
  const [newBrandName, setNewBrandName] = useState("");
  const [showAddBrand, setShowAddBrand] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: brands = [] } = useBrands();

  const addWatchMutation = useMutation({
    mutationFn: async (data: InsertWatch) => {
      const validatedData = insertWatchSchema.parse(data);
      await apiRequest("POST", "/api/watches", validatedData);
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

    addWatchMutation.mutate(formData as InsertWatch);
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
