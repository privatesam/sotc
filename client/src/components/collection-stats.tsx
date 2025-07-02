import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Clock, PoundSterling, Wrench, Star, ChevronDown, TrendingUp, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useBrands } from "@/hooks/use-brands";
import type { Watch } from "@shared/schema";

interface CollectionStatsProps {
  watches: Watch[];
  collectionId: number;
}

export function CollectionStats({ watches }: CollectionStatsProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  // Wear tracking stats
  const mostWornWatch = watches.reduce((max, watch) => 
    (watch.totalWearDays || 0) > (max.totalWearDays || 0) ? watch : max, 
    watches[0] || null
  );
  const mostWornWatchBrand = mostWornWatch ? brands.find(b => b.id === mostWornWatch.brandId) : null;

  const longestStreakWatch = watches.reduce((max, watch) => 
    (watch.longestStreak || 0) > (max.longestStreak || 0) ? watch : max, 
    watches[0] || null
  );
  const longestStreakWatchBrand = longestStreakWatch ? brands.find(b => b.id === longestStreakWatch.brandId) : null;

  // Check if any watch was worn today
  const today = new Date().toISOString().split('T')[0];
  const wornToday = watches.some(watch => watch.wearDates?.includes(today));

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

  const wearStats = [
    {
      title: "Most Worn Watch",
      value: mostWornWatch ? `${mostWornWatchBrand?.name || "Unknown"} ${mostWornWatch.name}` : "None",
      subtitle: mostWornWatch && mostWornWatch.totalWearDays 
        ? `${mostWornWatch.totalWearDays} day${mostWornWatch.totalWearDays === 1 ? '' : 's'}`
        : "No wear data",
      icon: TrendingUp,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      title: "Longest Streak",
      value: longestStreakWatch ? `${longestStreakWatchBrand?.name || "Unknown"} ${longestStreakWatch.name}` : "None",
      subtitle: longestStreakWatch && longestStreakWatch.longestStreak 
        ? `${longestStreakWatch.longestStreak} consecutive day${longestStreakWatch.longestStreak === 1 ? '' : 's'}`
        : "No streak data",
      icon: Calendar,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
  ];

  return (
    <div className="mb-8">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Collection Stats</h2>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
            {stats.map((stat, index) => (
              <Card key={index} className="border border-slate-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600">{stat.title}</p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900 truncate" title={stat.value}>
                        {stat.value}
                      </p>
                      {stat.subtitle && (
                        <p className="text-xs sm:text-sm text-slate-500">{stat.subtitle}</p>
                      )}
                    </div>
                    <div className={`w-8 h-8 sm:w-12 sm:h-12 ${stat.iconBg} rounded-lg flex items-center justify-center ml-2`}>
                      <stat.icon className={`${stat.iconColor} w-4 h-4 sm:w-6 sm:h-6`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
            {wearStats.map((stat, index) => (
              <Card key={index} className="border border-slate-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600">{stat.title}</p>
                      <p className="text-lg sm:text-xl font-bold text-slate-900 truncate" title={stat.value}>
                        {stat.value}
                      </p>
                      {stat.subtitle && (
                        <p className="text-xs sm:text-sm text-slate-500">{stat.subtitle}</p>
                      )}
                    </div>
                    <div className={`w-8 h-8 sm:w-12 sm:h-12 ${stat.iconBg} rounded-lg flex items-center justify-center ml-2`}>
                      <stat.icon className={`${stat.iconColor} w-4 h-4 sm:w-6 sm:h-6`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {wornToday && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-medium">
            ✓ You're wearing a watch today!
          </p>
        </div>
      )}
    </div>
  );
}
