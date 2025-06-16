import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ArticleModal from "./ArticleModal";
import FollowButton from "./FollowButton";
import { ExternalLink, RefreshCw, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ContentSectionsProps {
  resourceId: number;
  activePlatforms: {
    website: boolean;
    reddit: boolean;
    social: boolean;
  };
  isMonitoringActive?: boolean;
}

interface ContentItem {
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
}

export default function ContentSections({ resourceId, activePlatforms, isMonitoringActive = false }: ContentSectionsProps) {
  const queryClient = useQueryClient();
  const [selectedArticle, setSelectedArticle] = useState<ContentItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/resources/${resourceId}/refresh`, "POST");
      return await response.json();
    },
    onSuccess: (data) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ 
        queryKey: [`/api/resources/${resourceId}/recent-content`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/resources/${resourceId}/content`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/resources/${resourceId}/analytics`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/resources/${resourceId}/metrics`] 
      });
      // Force refetch
      queryClient.refetchQueries({ 
        queryKey: [`/api/resources/${resourceId}/recent-content`] 
      });
      toast({
        title: "Content Refreshed",
        description: `Articles updated successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh content. Please try again.",
        variant: "destructive",
      });
    }
  });

  const getImageUrl = (originalUrl: string, articleUrl: string, title: string): string => {
    // First, try to use the original image URL if it's valid and from the same domain
    if (originalUrl && (originalUrl.startsWith('https://') || originalUrl.startsWith('http://'))) {
      try {
        const imageUrlObj = new URL(originalUrl);
        const articleUrlObj = new URL(articleUrl || '');
        
        // If both URLs are from the same domain, use the original image
        if (articleUrl && imageUrlObj.hostname === articleUrlObj.hostname) {
          return originalUrl;
        }
        
        // If no article URL or different domain, still use the original if it seems valid
        if (originalUrl.includes('image') || originalUrl.includes('photo') || 
            originalUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) {
          return originalUrl;
        }
      } catch (error) {
        // If URL parsing fails, fall back to placeholder
      }
    }
    
    // Use a neutral placeholder that matches the content theme
    return `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=80&h=80&fit=crop&q=80`;
  };

  const { data: content, isLoading } = useQuery({
    queryKey: [`/api/resources/${resourceId}/recent-content`],
    enabled: !!resourceId,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });

  const handleArticleClick = (article: ContentItem, event?: React.MouseEvent) => {
    // Prevent modal from opening if clicking on input elements or interactive components
    if (event) {
      const target = event.target as HTMLElement;
      const isInteractiveElement = target.closest('input, button, [role="button"], [tabindex], textarea, select');
      
      if (isInteractiveElement) {
        return;
      }
    }
    
    setSelectedArticle(article);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedArticle(null);
  };

  const contentArray = Array.isArray(content) ? content : [];
  
  // Categorize content by platform type
  const categorizedContent = {
    website: contentArray.filter(item => item.platform === 'website'),
    reddit: contentArray.filter(item => item.platform === 'reddit'),
    instagram: contentArray.filter(item => item.platform === 'instagram'),
    facebook: contentArray.filter(item => item.platform === 'facebook'),
    twitter: contentArray.filter(item => item.platform === 'twitter'),
    social: contentArray.filter(item => 
      ['facebook', 'instagram', 'twitter'].includes(item.platform)
    )
  };

  const formatEngagement = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${Math.floor(diffInHours / 24)}d`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {['Website Articles', 'Reddit Discussions', 'Social Media Posts'].map((section) => (
          <div key={section} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{section}</h3>
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-white dark:bg-gray-800">
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    );
  }

  const totalArticles = categorizedContent.website.length + categorizedContent.reddit.length + categorizedContent.social.length;

  if (!content || totalArticles === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No articles found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No articles were found for the provided URL or keywords. Try different search terms or check if the URL is accessible.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Enter a URL above and click "Start Monitoring" to fetch related articles.
          </p>
        </div>
      </div>
    );
  }

  const getPlatformInfo = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'website': 
        return { color: 'bg-green-100 text-green-800 border-green-200', icon: '🌐', name: 'Website' };
      case 'reddit': 
        return { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '📱', name: 'Reddit' };
      case 'instagram': 
        return { color: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200', icon: '📸', name: 'Instagram' };
      case 'facebook': 
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '👥', name: 'Facebook' };
      case 'twitter': 
        return { color: 'bg-sky-100 text-sky-800 border-sky-200', icon: '🐦', name: 'X (Twitter)' };
      default: 
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '📄', name: 'Content' };
    }
  };

  const renderArticleCard = (item: ContentItem, platformColor: string) => {
    const platformInfo = getPlatformInfo(item.platform);
    
    return (
      <Card 
        key={item.id} 
        className="group hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700"
        onClick={(e) => handleArticleClick(item, e)}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <img
              src={getImageUrl(item.imageUrl || '', item.url || '', item.title)}
              alt={item.title}
              className="w-20 h-20 object-cover rounded-md"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=80&h=80&fit=crop&q=80';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-semibold text-sm line-clamp-2 text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {formatEngagement(item.engagement?.views)}
                  </span>
                  {(item.platform === 'reddit' || item.platform === 'facebook' || item.platform === 'twitter') && (
                    <span>💬 {formatEngagement(item.engagement?.comments)}</span>
                  )}
                  {item.platform === 'instagram' && (
                    <span>❤️ {formatEngagement(item.engagement?.likes)}</span>
                  )}
                  {item.platform === 'twitter' && (
                    <span>🔄 {formatEngagement(item.engagement?.shares)}</span>
                  )}
                  {item.authorName && <span>{item.authorName}</span>}
                  <span>{getTimeAgo(item.publishedAt)}</span>
                  <Badge variant="secondary" className={`text-xs ${platformInfo.color}`}>
                    {platformInfo.icon} {platformInfo.name}
                  </Badge>
                </div>
              </div>
              <div className="flex-shrink-0 flex gap-2">
                <FollowButton 
                  contentItem={item}
                  resourceId={resourceId}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
                {item.url && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(item.url, '_blank');
                    }}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            {totalArticles} articles
          </Badge>
          Latest Articles by Category
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          {refreshMutation.isPending ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Website Articles Section - Prioritized for authentic content */}
      {activePlatforms.website && categorizedContent.website.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Badge variant="default" className="bg-green-600 text-white">
              {categorizedContent.website.length}
            </Badge>
            Latest News Articles
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
              Live Feed
            </Badge>
          </h4>
          <div className="grid gap-3">
            {categorizedContent.website.map((item) => 
              renderArticleCard(item, "bg-green-50 text-green-700")
            )}
          </div>
        </div>
      )}

      {/* Reddit Discussions Section - Secondary content */}
      {activePlatforms.reddit && categorizedContent.reddit.length > 0 && categorizedContent.website.length === 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              {categorizedContent.reddit.length}
            </Badge>
            Reddit Discussions
          </h4>
          {categorizedContent.reddit.map((item) => 
            renderArticleCard(item, "bg-orange-50 text-orange-700")
          )}
        </div>
      )}

      {/* Social Media Posts Section */}
      {activePlatforms.social && categorizedContent.social.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              {categorizedContent.social.length}
            </Badge>
            Social Media Posts
          </h4>
          {categorizedContent.social.map((item) => 
            renderArticleCard(item, "bg-purple-50 text-purple-700")
          )}
        </div>
      )}

      {/* Article Modal */}
      <ArticleModal
        article={selectedArticle}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onArticleClick={handleArticleClick}
      />
    </div>
  );
}

