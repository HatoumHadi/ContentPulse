import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, MessageCircle, Share2 } from "lucide-react";

interface PlatformCategoryToggleProps {
  activePlatforms: {
    website: boolean;
    reddit: boolean;
    social: boolean; // Covers Facebook, Instagram, Twitter
  };
  onToggle: (platform: 'website' | 'reddit' | 'social') => void;
}

export default function PlatformCategoryToggle({ activePlatforms, onToggle }: PlatformCategoryToggleProps) {
  const platforms = [
    {
      key: 'website' as const,
      label: 'Website/Blog Articles',
      icon: Globe,
      description: 'News articles and blog posts',
      count: 'Articles'
    },
    {
      key: 'reddit' as const,
      label: 'Reddit Discussions',
      icon: MessageCircle,
      description: 'Community discussions and threads',
      count: 'Discussions'
    },
    {
      key: 'social' as const,
      label: 'Social Media',
      icon: Share2,
      description: 'Facebook, Instagram, and X posts',
      count: 'Posts'
    }
  ];

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Platform Categories</h3>
        <div className="space-y-4">
          {platforms.map((platform) => {
            const IconComponent = platform.icon;
            return (
              <div
                key={platform.key}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <IconComponent className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <Label
                      htmlFor={`toggle-${platform.key}`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                    >
                      {platform.label}
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {platform.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={`toggle-${platform.key}`}
                  checked={activePlatforms[platform.key]}
                  onCheckedChange={() => onToggle(platform.key)}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}