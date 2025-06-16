import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PLATFORM_CONFIG, PLATFORM_ICONS } from '@/lib/constants';
import { ExternalLink, Trash2 } from 'lucide-react';

interface SavedArticlesViewProps {
  folderId: number;
  activePlatforms: Record<string, boolean>;
}

interface SavedContentItem {
  id: number;
  userId: string;
  folderId: number;
  contentId: number;
  notes?: string;
  createdAt: string;
  content: {
    id: number;
    platform: string;
    title: string;
    description: string;
    authorName?: string;
    authorImage?: string;
    imageUrl?: string;
    url?: string;
    publishedAt: string;
    engagement?: {
      likes?: number;
      comments?: number;
      shares?: number;
      views?: number;
    };
  };
}

export default function SavedArticlesView({ folderId, activePlatforms }: SavedArticlesViewProps) {
  const { data: savedArticles = [], isLoading } = useQuery<SavedContentItem[]>({
    queryKey: [`/api/folders/${folderId}/articles`],
    enabled: !!folderId,
  });

  // Direct image system
  const getImageUrl = (originalUrl: string, title: string, platform: string): string => {
    if (originalUrl && originalUrl.startsWith('https://images.unsplash.com')) {
      return originalUrl;
    }
    return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?ixlib=rb-4.0.3&w=600&h=400&fit=crop';
  };

  const formatEngagement = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const filteredArticles = savedArticles.filter(item => 
    activePlatforms[item.content.platform]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (filteredArticles.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No saved articles found in this collection.</p>
        </CardContent>
      </Card>
    );
  }

  // Group by platform
  const groupedArticles = filteredArticles.reduce((acc, item) => {
    const platform = item.content.platform;
    if (!acc[platform]) {
      acc[platform] = [];
    }
    acc[platform].push(item);
    return acc;
  }, {} as Record<string, SavedContentItem[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedArticles).map(([platformKey, items]) => {
        const platform = PLATFORM_CONFIG[platformKey as keyof typeof PLATFORM_CONFIG];
        if (!platform) return null;

        return (
          <div key={platformKey} className="space-y-4">
            <div className="flex items-center gap-3">
              <div 
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${platform.color}`}
              >
                {PLATFORM_ICONS[platformKey as keyof typeof PLATFORM_ICONS] && 
                  (() => {
                    const IconComponent = PLATFORM_ICONS[platformKey as keyof typeof PLATFORM_ICONS];
                    return <IconComponent className="w-5 h-5" />;
                  })()
                }
              </div>
              <h3 className="text-lg font-semibold text-foreground">{platform.name}</h3>
              <Badge variant="secondary" className="ml-auto">
                {items.length} saved
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((savedItem) => (
                <Card 
                  key={savedItem.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border hover:border-primary/20"
                >
                  <CardContent className="p-4">
                    <div className="relative w-full h-32 bg-muted rounded mb-3 overflow-hidden">
                      <img 
                        src={getImageUrl(savedItem.content.imageUrl || '', savedItem.content.title, savedItem.content.platform)} 
                        alt={savedItem.content.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1495020689067-958852a7765e?ixlib=rb-4.0.3&w=600&h=400&fit=crop';
                        }}
                      />
                    </div>

                    <h4 className="font-semibold text-sm mb-2 line-clamp-2">
                      {savedItem.content.title}
                    </h4>
                    
                    {savedItem.content.description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {savedItem.content.description}
                      </p>
                    )}

                    {savedItem.notes && (
                      <div className="mb-3 p-2 bg-muted/50 rounded text-xs">
                        <strong>Notes:</strong> {savedItem.notes}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      {savedItem.content.engagement && (
                        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                          {Object.entries(savedItem.content.engagement).slice(0, 2).map(([key, value]) => {
                            const IconComponent = platform.engagementIcons[key as keyof typeof platform.engagementIcons];
                            if (!IconComponent || !value) return null;
                            
                            return (
                              <span key={key} className="flex items-center space-x-1">
                                <IconComponent className="w-3 h-3" />
                                <span>{formatEngagement(value)}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        {savedItem.content.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(savedItem.content.url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                      Saved {new Date(savedItem.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}