import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";

interface PublicInterestProps {
  resourceId: number;
}

export default function PublicInterest({ resourceId }: PublicInterestProps) {
  const { data: metrics } = useQuery({
    queryKey: [`/api/resources/${resourceId}/metrics`],
    enabled: !!resourceId,
  });

  const { data: analytics } = useQuery({
    queryKey: [`/api/resources/${resourceId}/analytics`],
    enabled: !!resourceId,
  });

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <Card className="bg-card border border-border">
      <CardHeader>
        <CardTitle className="text-lg">Public Interest</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-3">
          <Globe className="w-5 h-5 text-primary" />
          <div className="bg-primary px-3 py-1 rounded text-sm font-mono font-medium text-primary-foreground">
            {formatNumber((metrics as any)?.totalReach || 185600)}
          </div>
          <span className="text-muted-foreground">Total reach across platforms</span>
        </div>

        <div className="h-32 bg-gradient-to-br from-primary/5 to-primary/15 rounded-lg border border-primary/20 relative overflow-hidden shadow-inner">
          <svg className="w-full h-full" viewBox="0 0 400 100">
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.4"/>
                <stop offset="50%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.2"/>
                <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0"/>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path 
              d="M0,80 Q100,20 200,40 T400,30 L400,100 L0,100 Z" 
              fill="url(#gradient)" 
              stroke="hsl(217, 91%, 60%)" 
              strokeWidth="2.5"
              filter="url(#glow)"
              className="drop-shadow-sm"
            />
          </svg>
          <div className="absolute top-2 right-2 text-xs text-primary/60 font-medium">
            Real-time
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
