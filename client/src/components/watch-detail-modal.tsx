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
import { Edit, Save, Trash2, Upload, X, Watch as WatchIcon, Calendar as CalendarIcon, Eye } from "lucide-react";
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
  const [isWearCalendarOpen, setIsWearCalendarOpen] = useState(false);
  const [currentWatch, setCurrentWatch] = useState<Watch>(watch);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: brands = [] } = useBrands();

  const currentBrand = brands.find(b => b.id === currentWatch.brandId);

  useEffect(() => {
    setCurrentWatch(watch);
  }, [watch]);

  useEffect(() => {
    setFormData({
      name: currentWatch.name,
      brandId: currentWatch.brandId,
      model: currentWatch.model || "",
      purchaseDate: currentWatch.purchaseDate ? formatDate(new Date(currentWatch.purchaseDate)) : "",
      lastServiced: currentWatch.lastServiced ? formatDate(new Date(currentWatch.lastServiced)) : "",
      valuation: currentWatch.valuation || 0,
      servicePeriod: currentWatch.servicePeriod || 5,
      details: currentWatch.details || "",
    });
  }, [currentWatch]);

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/watches"] });
      // Update the current watch with new images immediately
      if (data.images) {
        setCurrentWatch(prev => ({ ...prev, images: data.images }));
        // Reset current image index if needed
        setCurrentImageIndex(0);
      }
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
    if (currentWatch.wearDates?.includes(today)) {
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
      // Keep calendar open for multiple date selections
    }
  };

  const handleSetPrimaryImage = (index: number) => {
    updateWatchMutation.mutate({
      id: watch.id,
      primaryImageIndex: index,
    });
  };

  const isWornToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return currentWatch.wearDates?.includes(today) || false;
  };

  const getServiceStatus = () => {
    if (!currentWatch.lastServiced) {
      return { label: "No Service Record", variant: "secondary", progress: 0 };
    }

    const lastServicedDate = new Date(currentWatch.lastServiced);
    const servicePeriodMs = (currentWatch.servicePeriod || 5) * 365 * 24 * 60 * 60 * 1000;
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
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-lg sm:text-xl font-semibold">{currentWatch.name}</span>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              ) : (
                <Button 
                  onClick={handleSave} 
                  size="sm"
                  disabled={updateWatchMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-4 sm:mt-6">
          {/* Image Carousel */}
          <div className="space-y-4">
            <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden relative">
              {currentWatch.images && currentWatch.images.length > 0 ? (
                <>
                  <img 
                    src={currentWatch.images[currentImageIndex]} 
                    alt={`${currentWatch.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {currentWatch.images.length}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-slate-400">No images</span>
                </div>
              )}
            </div>
            
            {/* Thumbnail Navigation */}
            {currentWatch.images && currentWatch.images.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Images</span>
                  {currentWatch.images.length > 1 && (
                    <span className="text-xs text-slate-500">
                      Image {(currentWatch.primaryImageIndex || 0) + 1} shown in collection
                    </span>
                  )}
                </div>
                <div className="flex space-x-3 overflow-x-auto pb-2">
                  {currentWatch.images.map((image, index) => (
                    <div key={index} className="relative flex-shrink-0">
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className={`w-16 h-16 object-cover rounded-lg border-2 cursor-pointer transition-colors ${
                          index === currentImageIndex ? 'border-primary' : 'border-slate-200 hover:border-primary'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                      {/* Primary image indicator */}
                      {index === (currentWatch.primaryImageIndex || 0) && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">★</span>
                        </div>
                      )}
                      {/* Make primary button when editing */}
                      {isEditing && index !== (currentWatch.primaryImageIndex || 0) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetPrimaryImage(index);
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-slate-500 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors"
                          title="Set as primary image"
                        >
                          <span className="text-white text-xs">★</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
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
                <p className="text-xs text-slate-500 mt-2">
                  💡 For best results in grid exports, use square (1:1) aspect ratio images
                </p>
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
                  <p className="text-sm font-medium mt-1">{currentWatch.name}</p>
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
                <p className="text-sm font-medium mt-1">{currentWatch.model || "Not specified"}</p>
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
                    {currentWatch.purchaseDate ? formatDate(new Date(currentWatch.purchaseDate)) : "Not specified"}
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
                    {currentWatch.lastServiced ? formatDate(new Date(currentWatch.lastServiced)) : "Never serviced"}
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
                    value={formData.valuation ? formData.valuation / 100 : ""}
                    onChange={(e) => {
                      const pounds = parseFloat(e.target.value) || 0;
                      const pence = Math.round(pounds * 100);
                      setFormData(prev => ({ ...prev, valuation: pence }));
                    }}
                    step="0.01"
                  />
                ) : (
                  <p className="text-sm font-medium mt-1">
                    {currentWatch.valuation ? formatCurrency(currentWatch.valuation) : "Not specified"}
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
                  <p className="text-sm font-medium mt-1">{currentWatch.servicePeriod || 5} years</p>
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
                <span className="text-sm font-medium text-slate-700">Wear Tracking</span>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    onClick={handleWearToday}
                    size="sm"
                    variant={isWornToday() ? "default" : "outline"}
                    className={cn(
                      "flex-1 sm:flex-none",
                      isWornToday() ? "bg-green-600 hover:bg-green-700" : ""
                    )}
                  >
                    <WatchIcon className="w-4 h-4 mr-2" />
                    WIT
                  </Button>
                  
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Add Date</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" align="end">
                      <div className="space-y-4">
                        <div className="text-center">
                          <h4 className="font-medium text-sm">Add Historical Wear Dates</h4>
                          <p className="text-xs text-slate-600">Click dates to add them to your wear history</p>
                        </div>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleAddWearDate}
                          disabled={(date) => date > new Date()}
                          modifiers={{
                            worn: currentWatch.wearDates?.map(date => new Date(date)) || []
                          }}
                          modifiersStyles={{
                            worn: {
                              backgroundColor: '#10b981',
                              color: 'white',
                              fontWeight: 'bold'
                            }
                          }}
                          initialFocus
                          className="rounded-md border"
                        />
                        <div className="text-center space-y-2">
                          <div className="flex items-center justify-center gap-2 text-xs">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span>Already worn</span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Calendar stays open for multiple selections
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setIsCalendarOpen(false)}
                            className="w-full"
                          >
                            Done
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Total Days Worn:</span>
                  <p className="font-medium">{currentWatch.totalWearDays || 0}</p>
                </div>
                <div>
                  <span className="text-slate-600">Longest Streak:</span>
                  <p className="font-medium">{currentWatch.longestStreak || 0} days</p>
                </div>
              </div>
              
              {currentWatch.wearDates && currentWatch.wearDates.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600">Wear History</p>
                    <Popover open={isWearCalendarOpen} onOpenChange={setIsWearCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Calendar
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-4" align="end">
                        <div className="space-y-4">
                          <div className="text-center">
                            <h4 className="font-medium">Wear History Calendar</h4>
                            <p className="text-xs text-slate-600">Green dates show when you wore this watch</p>
                          </div>
                          <Calendar
                            mode="multiple"
                            selected={currentWatch.wearDates?.map(date => new Date(date)) || []}
                            onSelect={(dates) => {
                              // Simple read-only calendar view
                              // Users can use the WIT button and Add Date for modifications
                            }}
                            disabled={(date) => date > new Date()}
                            modifiers={{
                              worn: currentWatch.wearDates?.map(date => new Date(date)) || []
                            }}
                            modifiersStyles={{
                              worn: {
                                backgroundColor: '#10b981',
                                color: 'white',
                                fontWeight: 'bold'
                              }
                            }}
                            className="rounded-md border"
                          />
                          <p className="text-xs text-center text-slate-500">
                            Use WIT button or "Add Date" to modify wear history
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
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
                  {currentWatch.details || "No additional details"}
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
