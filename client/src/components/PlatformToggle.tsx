import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORM_CONFIG, PLATFORM_ICONS } from "@/lib/constants";

interface PlatformToggleProps {
  activePlatforms: Record<string, boolean>;
  onToggle: (platform: string) => void;
}

export default function PlatformToggle({ activePlatforms, onToggle }: PlatformToggleProps) {
  const platforms = [
    { key: 'website', name: 'Website', description: 'Articles from websites' },
    { key: 'facebook', name: 'Facebook', description: 'Posts and updates' },
    { key: 'instagram', name: 'Instagram', description: 'Photos and stories' },
    { key: 'twitter', name: 'Twitter/X', description: 'Tweets and threads' },
    { key: 'reddit', name: 'Reddit', description: 'Posts and discussions' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Platform Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {platforms.map((platform) => {
          const config = PLATFORM_CONFIG[platform.key as keyof typeof PLATFORM_CONFIG];
          const IconComponent = PLATFORM_ICONS[platform.key as keyof typeof PLATFORM_ICONS];
          
          return (
            <div key={platform.key} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config?.color || 'bg-gray-500'}`}>
                  {IconComponent && <IconComponent className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <Label className="text-sm font-medium">{platform.name}</Label>
                  <p className="text-xs text-muted-foreground">{platform.description}</p>
                </div>
              </div>
              <Switch
                checked={activePlatforms[platform.key] || false}
                onCheckedChange={() => onToggle(platform.key)}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}