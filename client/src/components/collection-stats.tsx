import { Card, CardContent } from "@/components/ui/card";
import { Clock, PoundSterling, Wrench, Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useBrands } from "@/hooks/use-brands";
import type { Watch } from "@shared/schema";

interface CollectionStatsProps {
  watches: Watch[];
  collectionId: number;
}

export function CollectionStats({ watches }: CollectionStatsProps) {
  const { data: brands = [] } = useBrands();

  const totalWatches = watches.length;
  const totalValue = watches.reduce((sum, watch) => sum + (watch.valuation || 0), 0);
  
  const watchesWithServiceInfo = watches.filter(w => w.lastServiced);
  const servicesDue = watchesWithServiceInfo.filter(watch => {
    if (!watch.lastServiced) return false;
    
    const lastServicedDate = new Date(watch.lastServiced);
    const servicePeriodMs = (watch.servicePeriod || 5) * 365 * 24 * 60 * 60 * 1000;
    const nextServiceDate = new Date(lastServicedDate.getTime() + servicePeriodMs);
    const now = new Date();
    
    return nextServiceDate <= now;
  }).length;

  const newestWatch = watches
    .filter(w => w.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const newestWatchBrand = newestWatch ? brands.find(b => b.id === newestWatch.brandId) : null;
  const daysSinceAdded = newestWatch 
    ? Math.floor((Date.now() - new Date(newestWatch.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const stats = [
    {
      title: "Total Watches",
      value: totalWatches.toString(),
      icon: Clock,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Value",
      value: totalValue > 0 ? formatCurrency(totalValue) : "£0",
      icon: PoundSterling,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Due for Service",
      value: servicesDue.toString(),
      icon: Wrench,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      title: "Newest Addition",
      value: newestWatch ? `${newestWatchBrand?.name || "Unknown"} ${newestWatch.name}` : "None",
      subtitle: newestWatch 
        ? daysSinceAdded === 0 
          ? "Added today" 
          : `${daysSinceAdded} day${daysSinceAdded === 1 ? '' : 's'} ago`
        : undefined,
      icon: Star,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-900 truncate" title={stat.value}>
                  {stat.value}
                </p>
                {stat.subtitle && (
                  <p className="text-sm text-slate-500">{stat.subtitle}</p>
                )}
              </div>
              <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`${stat.iconColor} w-6 h-6`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
