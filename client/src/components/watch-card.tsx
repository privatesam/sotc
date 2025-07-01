import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { Watch } from "@shared/schema";

interface WatchCardProps {
  watch: Watch;
  onClick: () => void;
}

export function WatchCard({ watch, onClick }: WatchCardProps) {
  const primaryImage = watch.images?.[watch.primaryImageIndex || 0];
  const serviceStatus = getServiceStatus(watch);
  
  // Check if worn today
  const today = new Date().toISOString().split('T')[0];
  const wornToday = watch.wearDates?.includes(today);
  
  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg watch-card-hover cursor-pointer group ${
        wornToday ? 'border-green-400 bg-green-50' : 'border-slate-200'
      }`}
      onClick={onClick}
    >
      <div className="aspect-square bg-slate-100 relative overflow-hidden">
        {primaryImage ? (
          <img 
            src={primaryImage} 
            alt={watch.name}
            className="w-full h-full object-cover watch-image-hover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-200">
            <span className="text-slate-400 text-sm">No Image</span>
          </div>
        )}
        
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
        
        {watch.valuation && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 price-overlay">
            <span className="bg-white bg-opacity-90 text-slate-700 px-2 py-1 rounded-full text-xs font-medium">
              {formatCurrency(watch.valuation)}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 text-sm mb-1 truncate">
          {watch.name}
        </h3>
        {watch.model && (
          <p className="text-slate-500 text-xs mb-2 truncate">
            {watch.model}
          </p>
        )}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600">Brand Name</span>
          <Badge 
            variant={serviceStatus.variant as any}
            className="text-xs"
          >
            {serviceStatus.label}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function getServiceStatus(watch: Watch) {
  if (!watch.lastServiced) {
    return { label: "No Service", variant: "secondary" };
  }

  const lastServicedDate = new Date(watch.lastServiced);
  const servicePeriodMs = (watch.servicePeriod || 5) * 365 * 24 * 60 * 60 * 1000;
  const nextServiceDate = new Date(lastServicedDate.getTime() + servicePeriodMs);
  const now = new Date();
  const daysUntilService = Math.ceil((nextServiceDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

  if (daysUntilService < 0) {
    return { label: "Overdue", variant: "destructive" };
  } else if (daysUntilService < 365) {
    return { label: "Due Soon", variant: "secondary" };
  } else {
    return { label: "Serviced", variant: "default" };
  }
}
