import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, BarChart3, ExternalLink, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface FavoriteArticle {
  id: number;
  userId: string;
  folderId: number;
  contentId: number;
  resourceId: number;
  dashboardName: string;
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
  resource: {
    id: number;
    userId: string;
    url: string;
    keywords?: string;
    title?: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface FavoriteArticlesViewProps {
  onShowDashboard: (favoriteData: FavoriteArticle) => void;
}

export default function FavoriteArticlesView({ onShowDashboard }: FavoriteArticlesViewProps) {
  const queryClient = useQueryClient();

  const { data: favoriteArticles = [], isLoading } = useQuery({
    queryKey: ['/api/favorites'],
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (contentId: number) => {
      return await apiRequest('DELETE', `/api/favorites/${contentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    },
  });

  const handleShowDashboard = (favorite: FavoriteArticle) => {
    onShowDashboard(favorite);
  };

  const handleRemoveFavorite = (e: React.MouseEvent, contentId: number) => {
    e.stopPropagation();
    removeFavoriteMutation.mutate(contentId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!(favoriteArticles as any)?.length) {
    return (
      <div className="text-center py-12">
        <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No Favorite Articles
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Click the heart button on articles to add them to your favorites and view their analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Favorite Articles & Analytics
        </h2>
        <Badge variant="secondary" className="text-sm">
          {(favoriteArticles as FavoriteArticle[])?.length || 0} favorites
        </Badge>
      </div>

      <div className="grid gap-4">
        {(favoriteArticles as FavoriteArticle[]).map((favorite) => (
          <Card 
            key={favorite.id} 
            className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500"
            onClick={() => handleShowDashboard(favorite)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2 text-gray-900 dark:text-gray-100">
                    {favorite.content.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {favorite.content.platform}
                    </Badge>
                    {favorite.content.authorName && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        by {favorite.content.authorName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (favorite.content.url) {
                        let targetUrl = favorite.content.url.trim();
                        
                        // Ensure the URL has a protocol
                        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
                          targetUrl = 'https://' + targetUrl;
                        }
                        
                        // Validate URL format and open
                        try {
                          const url = new URL(targetUrl);
                          const newWindow = window.open(url.href, '_blank', 'noopener,noreferrer');
                          if (!newWindow) {
                            console.warn('Popup blocked - article URL:', url.href);
                          }
                        } catch (error) {
                          console.error('Invalid URL:', targetUrl);
                        }
                      }
                    }}
                    className="text-gray-500 hover:text-blue-600"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleRemoveFavorite(e, favorite.contentId)}
                    disabled={removeFavoriteMutation.isPending}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                {favorite.content.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  {favorite.content.engagement && (
                    <>
                      {favorite.content.engagement.likes && (
                        <span>❤️ {favorite.content.engagement.likes}</span>
                      )}
                      {favorite.content.engagement.comments && (
                        <span>💬 {favorite.content.engagement.comments}</span>
                      )}
                      {favorite.content.engagement.shares && (
                        <span>🔄 {favorite.content.engagement.shares}</span>
                      )}
                    </>
                  )}
                </div>
                
                <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </div>
              
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Dashboard: {favorite.dashboardName}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}