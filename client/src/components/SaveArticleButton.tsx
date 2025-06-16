import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { UserPlus, UserCheck, Folder, Plus, X } from 'lucide-react';

interface FollowButtonProps {
  contentItem: {
    id: number;
    platform: string;
    title: string;
    url?: string;
    authorName?: string;
  };
  variant?: 'icon' | 'button';
  size?: 'sm' | 'default';
}

interface FolderType {
  id: number;
  name: string;
  description?: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function FollowButton({ contentItem, variant = 'icon', size = 'default' }: FollowButtonProps) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: folders = [] } = useQuery<FolderType[]>({
    queryKey: ['/api/folders'],
  });

  const { data: savedStatus = { isSaved: false, savedIn: [] } } = useQuery<{ isSaved: boolean; savedIn: any[] }>({
    queryKey: [`/api/favorites/${contentItem.id}/status`],
    enabled: !!contentItem.id,
  });

  const saveArticleMutation = useMutation({
    mutationFn: async (folderId: number) => {
      return await apiRequest('POST', `/api/favorites`, {
        folderId: folderId,
        contentId: contentItem.id,
        resourceId: 26, // Default resource ID for now
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${contentItem.id}/status`] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      setIsDropdownOpen(false);
    },
  });

  const removeSavedArticleMutation = useMutation({
    mutationFn: async (folderId: number) => {
      return await apiRequest('DELETE', `/api/favorites/${contentItem.id}`, { folderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${contentItem.id}/status`] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest('POST', '/api/folders', { 
        name: name, 
        color: '#22c55e',
        description: null
      });
    },
    onSuccess: async (newFolder: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      setNewFolderName('');
      setIsCreatingFolder(false);
      // Keep dropdown open after creating folder
      // Auto-save to the newly created folder
      saveArticleMutation.mutate(newFolder.id);
    },
  });

  const handleFolderSelect = (folderId: number) => {
    saveArticleMutation.mutate(folderId);
  };

  const handleRemoveFromFolder = (folderId: number) => {
    removeSavedArticleMutation.mutate(folderId);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolderMutation.mutate(newFolderName.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateFolder();
    } else if (e.key === 'Escape') {
      setIsCreatingFolder(false);
      setNewFolderName('');
    }
  };

  const isSaved = savedStatus?.isSaved || false;
  const savedInFolders = savedStatus?.savedIn || [];

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={(open) => {
      // Prevent closing when creating folder
      if (!open && isCreatingFolder) return;
      setIsDropdownOpen(open);
    }}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className={`${isSaved ? 'bg-green-600 border-green-600 text-white hover:bg-green-700' : 'bg-green-500 border-green-500 text-white hover:bg-green-600'} transition-colors duration-200`}
        >
          {isSaved ? 'Saved' : 'Save'}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end">
        {isSaved && savedInFolders.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
              Saved in:
            </div>
            {savedInFolders.map((saved: any) => (
              <DropdownMenuItem key={saved.folderId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: saved.folder?.color || '#22c55e' }}
                  />
                  <span>{saved.folder?.name || 'Unknown Folder'}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFromFolder(saved.folderId);
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
          {isSaved ? 'Add to another folder:' : 'Follow in folder:'}
        </div>

        {folders.map((folder: FolderType) => {
          const isAlreadySaved = savedInFolders.some((saved: any) => saved.folderId === folder.id);
          if (isAlreadySaved) return null;
          
          return (
            <DropdownMenuItem
              key={folder.id}
              onClick={() => handleFolderSelect(folder.id)}
              className="flex items-center gap-2"
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: folder.color }}
              />
              <Folder className="w-4 h-4" />
              <span>{folder.name}</span>
            </DropdownMenuItem>
          );
        })}


      </DropdownMenuContent>
    </DropdownMenu>
  );
}