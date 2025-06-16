import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Globe } from "lucide-react";

interface MediaInterestProps {
  resourceId: number;
}

export default function MediaInterest({ resourceId }: MediaInterestProps) {
  const { data: metrics } = useQuery({
    queryKey: [`/api/resources/${resourceId}/metrics`],
    enabled: !!resourceId,
  });

  const { data: analytics } = useQuery({
    queryKey: [`/api/resources/${resourceId}/analytics`],
    enabled: !!resourceId,
  });

  return (
    <Card className="bg-card border border-border">
      <CardHeader>
        <CardTitle className="text-lg">Media Interest</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-3">
          <Globe className="w-5 h-5 text-primary" />
          <div className="bg-primary px-3 py-1 rounded text-sm font-mono font-medium text-primary-foreground">
            {(metrics as any)?.socialInteractions || 42850}
          </div>
          <span className="text-muted-foreground">Social interactions today</span>
        </div>

        <div className="h-32 bg-gradient-to-br from-primary/5 to-primary/15 rounded-lg border border-primary/20 relative overflow-hidden shadow-inner">
          <div className="absolute inset-0 flex items-end justify-around p-3">
            {[60, 80, 40, 90, 70, 85].map((height, index) => (
              <div 
                key={index}
                className="bg-gradient-to-t from-primary to-primary/80 rounded-t-md w-6 transition-all duration-500 hover:scale-105 shadow-sm"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="absolute top-2 right-2 text-xs text-primary/60 font-medium">
            Live Data
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-primary">Articles</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <Globe className="w-4 h-4 text-primary" />
                <Label className="text-sm">Articles published</Label>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <Globe className="w-4 h-4 text-primary" />
                <Label className="text-sm">Social media interactions on articles</Label>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox id="previous-period" />
              <Label htmlFor="previous-period" className="text-sm text-muted-foreground">
                Show previous period
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
