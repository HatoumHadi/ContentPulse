import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import { PLATFORM_ICONS, SUPPORTED_PLATFORMS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PlatformSelectorProps {
  activePlatforms: Record<string, boolean>;
  onToggle: (platform: string) => void;
}

// Use centralized platform configuration
const platforms = SUPPORTED_PLATFORMS;

export default function PlatformSelector({ activePlatforms, onToggle }: PlatformSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const activePlatformCount = Object.values(activePlatforms).filter(Boolean).length;
  const activePlatformNames = Object.entries(activePlatforms)
    .filter(([_, active]) => active)
    .map(([platform]) => platforms.find(p => p.id === platform)?.name)
    .filter(Boolean);

  return (
    <Card className="bg-card dark:bg-card border border-border dark:border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg text-foreground dark:text-foreground">Active Platforms</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="border-border hover:bg-muted text-foreground"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-background border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Platform Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {platforms.map((platform) => (
                <div key={platform.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg ${platform.color} flex items-center justify-center text-sm`}>
                      {(() => {
                        const IconComponent = PLATFORM_ICONS[platform.id as keyof typeof PLATFORM_ICONS];
                        return <IconComponent className="w-4 h-4 text-white" />;
                      })()}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground">{platform.name}</Label>
                      <p className="text-xs text-muted-foreground">{platform.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={activePlatforms[platform.id] || false}
                    onCheckedChange={() => onToggle(platform.id)}
                  />
                </div>
              ))}
              <div className="pt-4 border-t border-border">
                <Button 
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Apply Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Connected platforms</span>
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
              {activePlatformCount} active
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {activePlatformNames.slice(0, 3).map((name, index) => (
              <Badge key={index} variant="outline" className="border-border text-foreground">
                {name}
              </Badge>
            ))}
            {activePlatformNames.length > 3 && (
              <Badge variant="outline" className="border-border text-muted-foreground">
                +{activePlatformNames.length - 3} more
              </Badge>
            )}
          </div>
          
          {activePlatformCount === 0 && (
            <p className="text-sm text-muted-foreground italic">
              No platforms selected. Click "Manage" to add platforms.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}