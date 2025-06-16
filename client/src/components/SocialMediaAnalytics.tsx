import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SocialMediaAnalyticsProps {
  resourceId: number;
  activePlatforms: Record<string, boolean>;
}

interface EngagementData {
  platform: string;
  likes: number;
  shares: number;
  comments: number;
  views: number;
  date: string;
}

export default function SocialMediaAnalytics({ resourceId, activePlatforms }: SocialMediaAnalyticsProps) {
  const { data: analytics = [] } = useQuery({
    queryKey: [`/api/resources/${resourceId}/analytics`, 'engagement'],
    refetchInterval: 30000
  });

  const { data: content = [] } = useQuery<any[]>({
    queryKey: [`/api/resources/${resourceId}/content`],
    refetchInterval: 30000
  });

  // Process social media engagement data
  const socialPlatforms = ['instagram', 'facebook', 'twitter', 'reddit'];
  const contentArray = Array.isArray(content) ? content : [];
  const filteredContent = contentArray.filter((item: any) => 
    socialPlatforms.includes(item.platform) && activePlatforms[item.platform]
  );

  // Aggregate engagement metrics by platform
  const platformMetrics = socialPlatforms.reduce((acc: any, platform) => {
    const platformContent = filteredContent.filter((item: any) => item.platform === platform);
    
    if (platformContent.length > 0) {
      acc[platform] = {
        totalLikes: platformContent.reduce((sum: number, item: any) => sum + (item.engagement?.likes || 0), 0),
        totalShares: platformContent.reduce((sum: number, item: any) => sum + (item.engagement?.shares || 0), 0),
        totalComments: platformContent.reduce((sum: number, item: any) => sum + (item.engagement?.comments || 0), 0),
        totalViews: platformContent.reduce((sum: number, item: any) => sum + (item.engagement?.views || 0), 0),
        postCount: platformContent.length
      };
    }
    return acc;
  }, {});

  // Platform engagement comparison chart
  const platformComparisonData = {
    labels: Object.keys(platformMetrics).map(platform => 
      platform.charAt(0).toUpperCase() + platform.slice(1)
    ),
    datasets: [
      {
        label: 'Likes',
        data: Object.values(platformMetrics).map((metrics: any) => metrics.totalLikes),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2
      },
      {
        label: 'Shares',
        data: Object.values(platformMetrics).map((metrics: any) => metrics.totalShares),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2
      },
      {
        label: 'Comments',
        data: Object.values(platformMetrics).map((metrics: any) => metrics.totalComments),
        backgroundColor: 'rgba(168, 85, 247, 0.6)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 2
      }
    ]
  };

  // Engagement over time (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const timelineData = {
    labels: last7Days.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Total Engagement',
        data: last7Days.map(date => {
          const dayContent = filteredContent.filter((item: any) => 
            item.publishedAt && item.publishedAt.startsWith(date)
          );
          return dayContent.reduce((sum: number, item: any) => 
            sum + (item.engagement?.likes || 0) + (item.engagement?.shares || 0) + (item.engagement?.comments || 0), 0
          );
        }),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const chartOptions: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const totalEngagement = Object.values(platformMetrics).reduce(
    (sum: number, metrics: any) => sum + metrics.totalLikes + metrics.totalShares + metrics.totalComments,
    0
  );

  const totalPosts = Object.values(platformMetrics).reduce(
    (sum: number, metrics: any) => sum + metrics.postCount,
    0
  );

  if (Object.keys(platformMetrics).length === 0) {
    return (
      <Card className="glass-card professional-shadow border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Social Media Analytics</CardTitle>
          <CardDescription>
            No social media content available yet. Start monitoring to see engagement data.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card professional-shadow border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Engagement</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-600">{totalEngagement.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Likes, shares, and comments</p>
          </CardContent>
        </Card>

        <Card className="glass-card professional-shadow border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Platforms</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-600">{Object.keys(platformMetrics).length}</div>
            <p className="text-xs text-muted-foreground">Social media platforms</p>
          </CardContent>
        </Card>

        <Card className="glass-card professional-shadow border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-600">{totalPosts}</div>
            <p className="text-xs text-muted-foreground">Content pieces tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Comparison Chart */}
      <Card className="glass-card professional-shadow border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Platform Engagement Comparison</CardTitle>
          <CardDescription>
            Compare engagement metrics across different social media platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Bar data={platformComparisonData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Engagement Timeline */}
      <Card className="glass-card professional-shadow border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Engagement Over Time</CardTitle>
          <CardDescription>
            7-day engagement trend across all active platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Line data={timelineData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Platform Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(platformMetrics).map(([platform, metrics]: [string, any]) => (
          <Card key={platform} className="glass-card professional-shadow border-0">
            <CardHeader>
              <CardTitle className="text-base font-semibold capitalize">{platform} Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Likes:</span>
                <span className="font-medium">{metrics.totalLikes.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Shares:</span>
                <span className="font-medium">{metrics.totalShares.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Comments:</span>
                <span className="font-medium">{metrics.totalComments.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Posts:</span>
                <span className="font-medium">{metrics.postCount}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}