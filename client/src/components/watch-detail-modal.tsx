import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useBrands } from "@/hooks/use-brands";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Edit, Save, Trash2, Upload, X, Watch as WatchIcon, Calendar as CalendarIcon } from "lucide-react";
import type { Watch, UpdateWatch } from "@shared/schema";

interface WatchDetailModalProps {
  watch: Watch;
  onClose: () => void;
  onSave: () => void;
}

export function WatchDetailModal({ watch, onClose, onSave }: WatchDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [formData, setFormData] = useState<Partial<UpdateWatch>>({});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: brands = [] } = useBrands();

  const currentBrand = brands.find(b => b.id === watch.brandId);

  useEffect(() => {
    setFormData({
      name: watch.name,
      brandId: watch.brandId,
      model: watch.model || "",
      purchaseDate: watch.purchaseDate ? formatDate(new Date(watch.purchaseDate)) : "",
      lastServiced: watch.lastServiced ? formatDate(new Date(watch.lastServiced)) : "",
      valuation: watch.valuation || 0,
      servicePeriod: watch.servicePeriod || 5,
      details: watch.details || "",
    });
  }, [watch]);

  const updateWatchMutation = useMutation({
    mutationFn: async (data: UpdateWatch) => {
      await apiRequest("PUT", `/api/watches/${watch.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watches"] });
      toast({ title: "Watch updated successfully" });
      setIsEditing(false);
      onSave();
    },
    onError: () => {
      toast({
        title: "Failed to update watch",
        variant: "destructive",
      });
    },
  });

  const deleteWatchMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/watches/${watch.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watches"] });
      toast({ title: "Watch deleted successfully" });
      onClose();
    },
    onError: () => {
      toast({
        title: "Failed to delete watch",
        variant: "destructive",
      });
    },
  });

  const uploadImagesMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });
      
      const response = await fetch(`/api/watches/${watch.id}/images`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watches"] });
      toast({ title: "Images uploaded successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to upload images",
        variant: "destructive",
      });
    },
  });

  const addWearDateMutation = useMutation({
    mutationFn: async (date: string) => {
      await apiRequest("POST", `/api/watches/${watch.id}/wear`, { date });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watches"] });
      toast({ title: "Wear date added successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to add wear date",
        variant: "destructive",
      });
    },
  });

  const removeWearDateMutation = useMutation({
    mutationFn: async (date: string) => {
      await apiRequest("DELETE", `/api/watches/${watch.id}/wear/${date}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watches"] });
      toast({ title: "Wear date removed successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to remove wear date",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateWatchMutation.mutate({
      id: watch.id,
      ...formData,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadImagesMutation.mutate(files);
    }
  };

  const handleWearToday = () => {
    const today = new Date().toISOString().split('T')[0];
    if (watch.wearDates?.includes(today)) {
      removeWearDateMutation.mutate(today);
    } else {
      addWearDateMutation.mutate(today);
    }
  };

  const handleAddWearDate = (date: Date | undefined) => {
    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      addWearDateMutation.mutate(dateStr);
      setSelectedDate(undefined);
      setIsCalendarOpen(false);
    }
  };

  const isWornToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return watch.wearDates?.includes(today) || false;
  };

  const getServiceStatus = () => {
    if (!watch.lastServiced) {
      return { label: "No Service Record", variant: "secondary", progress: 0 };
    }

    const lastServicedDate = new Date(watch.lastServiced);
    const servicePeriodMs = (watch.servicePeriod || 5) * 365 * 24 * 60 * 60 * 1000;
    const nextServiceDate = new Date(lastServicedDate.getTime() + servicePeriodMs);
    const now = new Date();
    const totalPeriod = servicePeriodMs;
    const elapsed = now.getTime() - lastServicedDate.getTime();
    const progress = Math.min(100, (elapsed / totalPeriod) * 100);

    if (progress >= 100) {
      return { 
        label: "Overdue", 
        variant: "destructive", 
        progress: 100,
        nextService: `Overdue since ${formatDate(nextServiceDate)}`
      };
    } else if (progress >= 80) {
      return { 
        label: "Due Soon", 
        variant: "secondary", 
        progress,
        nextService: `Next service: ${formatDate(nextServiceDate)}`
      };
    } else {
      return { 
        label: "Up to Date", 
        variant: "default", 
        progress,
        nextService: `Next service: ${formatDate(nextServiceDate)}`
      };
    }
  };

  const serviceStatus = getServiceStatus();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{watch.name}</span>
            <div className="flex items-center space-x-3">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <Button 
                  onClick={handleSave} 
                  size="sm"
                  disabled={updateWatchMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          {/* Image Carousel */}
          <div className="space-y-4">
            <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden relative">
              {watch.images && watch.images.length > 0 ? (
                <>
                  <img 
                    src={watch.images[currentImageIndex]} 
                    alt={`${watch.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {watch.images.length}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-slate-400">No images</span>
                </div>
              )}
            </div>
            
            {/* Thumbnail Navigation */}
            {watch.images && watch.images.length > 0 && (
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {watch.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className={`w-16 h-16 object-cover rounded-lg border-2 cursor-pointer flex-shrink-0 transition-colors ${
                      index === currentImageIndex ? 'border-primary' : 'border-slate-200 hover:border-primary'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            )}

            {/* Upload Images */}
            {isEditing && (
              <div>
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
                    <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                    <span className="text-sm text-slate-600">Upload Images</span>
                  </div>
                </Label>
                <input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            )}
          </div>

          {/* Watch Details */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                {isEditing ? (
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm font-medium mt-1">{watch.name}</p>
                )}
              </div>
              <div>
                <Label>Brand</Label>
                {isEditing ? (
                  <Select 
                    value={formData.brandId?.toString()} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, brandId: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map(brand => (
                        <SelectItem key={brand.id} value={brand.id.toString()}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium mt-1">{currentBrand?.name || "Unknown"}</p>
                )}
              </div>
            </div>

            <div>
              <Label>Model Number</Label>
              {isEditing ? (
                <Input
                  value={formData.model || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                />
              ) : (
                <p className="text-sm font-medium mt-1">{watch.model || "Not specified"}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Purchase Date</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formData.purchaseDate || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm font-medium mt-1">
                    {watch.purchaseDate ? formatDate(new Date(watch.purchaseDate)) : "Not specified"}
                  </p>
                )}
              </div>
              <div>
                <Label>Last Serviced</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formData.lastServiced || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastServiced: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm font-medium mt-1">
                    {watch.lastServiced ? formatDate(new Date(watch.lastServiced)) : "Never serviced"}
                  </p>
                )}
              </div>
            </div>

            {/* Valuation and Service Period */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valuation (£)</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.valuation || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, valuation: parseInt(e.target.value) || 0 }))}
                  />
                ) : (
                  <p className="text-sm font-medium mt-1">
                    {watch.valuation ? formatCurrency(watch.valuation) : "Not specified"}
                  </p>
                )}
              </div>
              <div>
                <Label>Service Period (years)</Label>
                {isEditing ? (
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
                ) : (
                  <p className="text-sm font-medium mt-1">{watch.servicePeriod || 5} years</p>
                )}
              </div>
            </div>

            {/* Service Status */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Service Status</span>
                <Badge variant={serviceStatus.variant as any}>
                  {serviceStatus.label}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mb-3">{serviceStatus.nextService}</p>
              <div className="bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    serviceStatus.progress >= 100 ? 'bg-red-500' :
                    serviceStatus.progress >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(serviceStatus.progress, 100)}%` }}
                />
              </div>
            </div>

            {/* Wear Tracking */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-700">Wear Tracking</span>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleWearToday}
                    size="sm"
                    variant={isWornToday() ? "default" : "outline"}
                    className={isWornToday() ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    <WatchIcon className="w-4 h-4 mr-2" />
                    WIT
                  </Button>
                  
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Add Date
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleAddWearDate}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Total Days Worn:</span>
                  <p className="font-medium">{watch.totalWearDays || 0}</p>
                </div>
                <div>
                  <span className="text-slate-600">Longest Streak:</span>
                  <p className="font-medium">{watch.longestStreak || 0} days</p>
                </div>
              </div>
              
              {watch.wearDates && watch.wearDates.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-slate-600 mb-2">Recent wear dates:</p>
                  <div className="flex flex-wrap gap-1">
                    {watch.wearDates
                      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                      .slice(0, 10)
                      .map((date) => (
                        <Badge
                          key={date}
                          variant="secondary"
                          className="text-xs cursor-pointer hover:bg-red-100"
                          onClick={() => removeWearDateMutation.mutate(date)}
                        >
                          {new Date(date).toLocaleDateString('en-GB')}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <Label>Details</Label>
              {isEditing ? (
                <Textarea
                  rows={4}
                  value={formData.details || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                  placeholder="Additional notes about the watch..."
                />
              ) : (
                <p className="text-sm mt-1 whitespace-pre-wrap">
                  {watch.details || "No additional details"}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-slate-200">
              {isEditing ? (
                <>
                  <Button 
                    onClick={handleSave}
                    className="flex-1"
                    disabled={updateWatchMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => deleteWatchMutation.mutate()}
                  disabled={deleteWatchMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
