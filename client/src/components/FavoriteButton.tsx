import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Heart, HeartOff } from 'lucide-react';

interface FavoriteButtonProps {
  contentItem: {
    id: number;
    platform: string;
    title: string;
    url?: string;
    authorName?: string;
  };
  resourceId: number;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'default';
  className?: string;
}

export default function FavoriteButton({ 
  contentItem, 
  resourceId, 
  variant = 'icon', 
  size = 'default',
  className = ''
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const queryClient = useQueryClient();

  // Check if article is already favorited
  const { data: favoriteStatus } = useQuery({
    queryKey: [`/api/favorites/${contentItem.id}/status`],
    enabled: !!contentItem.id,
  });

  // Update local state when favorite status is loaded
  useEffect(() => {
    if ((favoriteStatus as any)?.isFavorited !== undefined) {
      setIsFavorited((favoriteStatus as any).isFavorited);
    }
  }, [favoriteStatus]);

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorited) {
        // Remove from favorites
        return await apiRequest('DELETE', `/api/favorites/${contentItem.id}`);
      } else {
        // Add to favorites and create analytics dashboard
        return await apiRequest('POST', '/api/favorites', {
          contentId: contentItem.id,
          resourceId: resourceId,
          dashboardName: `${contentItem.platform} Analytics - ${contentItem.title}`,
          platform: contentItem.platform,
          sourceTitle: contentItem.title,
          sourceUrl: contentItem.url,
          authorName: contentItem.authorName,
        });
      }
    },
    onSuccess: (data) => {
      setIsFavorited(!isFavorited);
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
      

    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    favoriteMutation.mutate();
  };

  return (
    <Button
      variant={variant === 'icon' ? 'ghost' : 'outline'}
      size={size}
      onClick={handleClick}
      disabled={favoriteMutation.isPending}
      className={`transition-colors duration-200 ${
        isFavorited 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-gray-400 hover:text-red-500'
      }`}
    >
      {isFavorited ? (
        <Heart className="w-4 h-4 fill-current" />
      ) : (
        <Heart className="w-4 h-4" />
      )}
      {variant === 'button' && (
        <span className="ml-2">
          {isFavorited ? 'Favorited' : 'Add to Favorites'}
        </span>
      )}
    </Button>
  );
}