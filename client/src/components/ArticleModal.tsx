import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Heart, MessageCircle, Share, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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

interface ArticleModalProps {
  article: ContentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onArticleClick?: (article: ContentItem) => void;
}

export default function ArticleModal({ article, isOpen, onClose, onArticleClick }: ArticleModalProps) {
  const { data: allContent } = useQuery({
    queryKey: [`/api/resources/${article?.id || 'default'}/recent-content`],
    enabled: isOpen && !!article,
    retry: false
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getImageUrl = (originalUrl: string, title: string, platform: string): string => {
    if (originalUrl && (originalUrl.startsWith('https://') || originalUrl.startsWith('http://'))) {
      return originalUrl;
    }
    
    const searchQuery = encodeURIComponent(title.split(' ').slice(0, 3).join(' '));
    const platformKeywords: Record<string, string> = {
      'website': 'news article',
      'instagram': 'social media',
      'facebook': 'social content',
      'twitter': 'news update',
      'reddit': 'discussion forum'
    };
    
    const keyword = platformKeywords[platform.toLowerCase()] || 'news';
    return `https://images.unsplash.com/photo-1504711434969-e33886168f5c?ixlib=rb-4.0.3&w=600&h=400&fit=crop&q=${searchQuery}&category=${keyword}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400';
      case 'facebook': return 'bg-blue-600';
      case 'x': return 'bg-black dark:bg-white dark:text-black';
      case 'website': return 'bg-green-600';
      case 'reddit': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  if (!article) return null;

  const relatedArticles = (allContent as any[] || [])
    .filter((item: any) => item.id !== article.id)
    .slice(0, 3);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-border" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Badge className={`${getPlatformColor(article.platform)} text-white border-0`}>
              {article.platform}
            </Badge>
            <span className="text-foreground">{article.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {article.authorName && (
            <div className="flex items-center gap-3">
              {article.authorImage && (
                <img src={article.authorImage} alt={article.authorName} className="w-10 h-10 rounded-full" />
              )}
              <div>
                <p className="font-medium text-foreground">{article.authorName}</p>
                <p className="text-sm text-muted-foreground">{formatDate(article.publishedAt)}</p>
              </div>
            </div>
          )}

          {article.imageUrl && (
            <div className="w-full">
              <img 
                src={getImageUrl(article.imageUrl, article.title, article.platform)}
                alt={article.title}
                className="w-full h-64 object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="space-y-4">
            <p className="text-foreground leading-relaxed">{article.description}</p>
            
            {article.engagement && (
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                {article.engagement.likes && (
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{formatNumber(article.engagement.likes)}</span>
                  </div>
                )}
                {article.engagement.comments && (
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{formatNumber(article.engagement.comments)}</span>
                  </div>
                )}
                {article.engagement.shares && (
                  <div className="flex items-center gap-1">
                    <Share className="w-4 h-4" />
                    <span>{formatNumber(article.engagement.shares)}</span>
                  </div>
                )}
                {article.engagement.views && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{formatNumber(article.engagement.views)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => {
                if (article.url) {
                  window.open(article.url, '_blank', 'noopener,noreferrer');
                } else {
                  const event = new CustomEvent('toast', {
                    detail: {
                      title: 'No URL',
                      description: 'This article does not have a valid link',
                      variant: 'destructive'
                    }
                  });
                  window.dispatchEvent(event);
                }
              }}
              disabled={!article.url}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Original
            </Button>
            <Button 
              variant="outline" 
              className="border-border hover:bg-muted text-foreground"
              onClick={onClose}
            >
              Close
            </Button>
          </div>

          {relatedArticles.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Related Articles</h3>
              <div className="space-y-3">
                {relatedArticles.map((relatedItem: any) => (
                  <Card 
                    key={relatedItem.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      if (onArticleClick) {
                        onArticleClick(relatedItem);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {relatedItem.imageUrl && (
                          <img 
                            src={relatedItem.imageUrl}
                            alt={relatedItem.title}
                            className="w-16 h-16 object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground text-sm line-clamp-2 mb-1">
                            {relatedItem.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {relatedItem.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs capitalize">
                              {relatedItem.platform}
                            </Badge>
                            {relatedItem.authorName && (
                              <span className="text-xs text-muted-foreground">
                                by {relatedItem.authorName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}