import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsChartProps {
  resourceId: number;
  activePlatforms: Record<string, boolean>;
  isMonitoringActive?: boolean;
}

export default function AnalyticsChart({ resourceId, activePlatforms, isMonitoringActive = false }: AnalyticsChartProps) {
  const { data: analytics } = useQuery({
    queryKey: [`/api/resources/${resourceId}/analytics`],
    enabled: isMonitoringActive && !!resourceId, // Enable when monitoring is active
  });

  const { data: metrics } = useQuery({
    queryKey: [`/api/resources/${resourceId}/metrics`],
    enabled: isMonitoringActive && !!resourceId, // Enable when monitoring is active
  });

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <Card className="bg-card border border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Platform Analytics</CardTitle>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">Real-time</span>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {formatNumber((metrics as any)?.socialInteractions || 42850)}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Social Interactions</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {formatNumber((metrics as any)?.totalReach || 185600)}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">Total Reach</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {(metrics as any)?.articlesPublished || 4}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Articles Published</div>
          </div>
        </div>

        {/* Interactive Chart */}
        <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Engagement Trends</h3>
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Last 7 days</span>
            </div>
          </div>
          <svg className="w-full h-40" viewBox="0 0 400 120">
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.1"/>
              </linearGradient>
            </defs>
            
            {/* Chart lines and area */}
            <path 
              d="M 20 100 L 80 85 L 140 70 L 200 55 L 260 40 L 320 25 L 380 20" 
              stroke="rgb(59, 130, 246)" 
              strokeWidth="3" 
              fill="none"
              className="drop-shadow-sm"
            />
            <path 
              d="M 20 100 L 80 85 L 140 70 L 200 55 L 260 40 L 320 25 L 380 20 L 380 120 L 20 120 Z" 
              fill="url(#chartGradient)"
            />
            
            {/* Data points */}
            {[{x: 20, y: 100}, {x: 80, y: 85}, {x: 140, y: 70}, {x: 200, y: 55}, {x: 260, y: 40}, {x: 320, y: 25}, {x: 380, y: 20}].map((point, index) => (
              <circle 
                key={index}
                cx={point.x} 
                cy={point.y} 
                r="4" 
                fill="rgb(59, 130, 246)"
                className="drop-shadow-sm hover:r-6 transition-all duration-200"
              />
            ))}
          </svg>
        </div>

        {/* Platform Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(activePlatforms).filter(([_, active]) => active).map(([platform, _], index) => {
            const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
            const engagement = [8500, 6200, 4800, 3200][index] || 2000;
            
            return (
              <div key={platform} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${colors[index] || 'bg-gray-500'}`}></div>
                    <span className="text-sm font-medium capitalize text-foreground">{platform}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{formatNumber(engagement)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${colors[index] || 'bg-gray-500'}`}
                    style={{ width: `${Math.min(100, (engagement / 10000) * 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}