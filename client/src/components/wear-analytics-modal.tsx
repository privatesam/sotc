import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar } from "@/components/ui/calendar";
import { useBrands } from "@/hooks/use-brands";
import type { Watch } from "@shared/schema";

interface WearAnalyticsModalProps {
  watches: Watch[];
  onClose: () => void;
}

export function WearAnalyticsModal({ watches, onClose }: WearAnalyticsModalProps) {
  const { data: brands = [] } = useBrands();

  // Prepare data for the bar chart
  const chartData = watches
    .filter(watch => (watch.totalWearDays || 0) > 0)
    .map(watch => {
      const brand = brands.find(b => b.id === watch.brandId);
      return {
        name: `${brand?.name || "Unknown"} ${watch.name}`,
        wearDays: watch.totalWearDays || 0,
        longestStreak: watch.longestStreak || 0,
      };
    })
    .sort((a, b) => b.wearDays - a.wearDays);

  // Collect all unique wear dates across all watches
  const allWearDates = new Set<string>();
  watches.forEach(watch => {
    if (watch.wearDates) {
      watch.wearDates.forEach(date => allWearDates.add(date));
    }
  });

  // Convert to Date objects for calendar
  const wearDatesArray = Array.from(allWearDates).map(dateStr => new Date(dateStr));

  if (allWearDates.size === 0) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Wear Analytics</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-lg text-slate-600 mb-2">No wear data available</p>
              <p className="text-sm text-slate-500">Start tracking your watch wears to see analytics here.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wear Analytics</DialogTitle>
        </DialogHeader>
        
        <div className="mt-6 space-y-8">
          {/* Calendar View */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Wear Calendar Overview</h3>
            <div className="bg-slate-50 p-6 rounded-lg">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex justify-center">
                    <Calendar
                      mode="multiple"
                      selected={wearDatesArray}
                      disabled={(date) => date > new Date()}
                      modifiers={{
                        worn: wearDatesArray
                      }}
                      modifiersStyles={{
                        worn: {
                          backgroundColor: '#10b981',
                          color: 'white',
                          fontWeight: 'bold'
                        }
                      }}
                      className="rounded-md border bg-white"
                    />
                  </div>
                </div>
                <div className="lg:w-80 space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">Legend</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span>Days you wore a watch</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">Calendar Stats</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total wear days:</span>
                        <span className="font-medium">{allWearDates.size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>This month:</span>
                        <span className="font-medium">
                          {wearDatesArray.filter(date => {
                            const now = new Date();
                            return date.getMonth() === now.getMonth() && 
                                   date.getFullYear() === now.getFullYear();
                          }).length}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">Usage Tips</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Green dates show tracking days</li>
                      <li>• Spot missing days easily</li>
                      <li>• Use WIT button for today</li>
                      <li>• Add past dates in watch details</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Total Wear Days Chart */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Total Days Worn</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 80,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    labelStyle={{ color: '#1f2937' }}
                    contentStyle={{ 
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="wearDays" 
                    fill="#3b82f6" 
                    name="Days Worn"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Longest Streak Chart */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Longest Consecutive Wear Streak</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 80,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    labelStyle={{ color: '#1f2937' }}
                    contentStyle={{ 
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="longestStreak" 
                    fill="#10b981" 
                    name="Longest Streak (days)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">
                {chartData.reduce((sum, item) => sum + item.wearDays, 0)}
              </p>
              <p className="text-sm text-slate-600">Total Wear Days</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">
                {Math.max(...chartData.map(item => item.longestStreak))}
              </p>
              <p className="text-sm text-slate-600">Best Streak</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">
                {Math.round(chartData.reduce((sum, item) => sum + item.wearDays, 0) / chartData.length)}
              </p>
              <p className="text-sm text-slate-600">Average per Watch</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}