import { useState, KeyboardEvent, useEffect, useRef, useCallback, memo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Bookmark, Folder, FolderPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FollowButtonProps {
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

interface Folder {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}

const FolderDialogContent = memo(({
  folders = [],
  isCreatingFolder,
  newFolderName,
  setNewFolderName,
  handleFolderSelect,
  handleCreateFolder,
  handleKeyDown,
  setIsCreatingFolder,
  addToFolderMutation,
  createFolderMutation
}: {
  folders: Folder[];
  isCreatingFolder: boolean;
  newFolderName: string;
  setNewFolderName: (value: string) => void;
  handleFolderSelect: (folderId: number) => void;
  handleCreateFolder: () => void;
  handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  setIsCreatingFolder: (value: boolean) => void;
  addToFolderMutation: any;
  createFolderMutation: any;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreatingFolder && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreatingFolder]);

  return (
    <DialogContent 
      className="max-w-md"
      onInteractOutside={(e) => {
        if (isCreatingFolder) {
          e.preventDefault();
        }
      }}
    >
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-primary" />
          <span>Add to Collection</span>
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">
            Select a folder for this article
          </Label>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {folders.map((folder) => (
            <Button
              key={folder.id}
              variant="outline"
              className="w-full justify-start h-auto p-3 text-left"
              onClick={() => handleFolderSelect(folder.id)}
              disabled={addToFolderMutation.isPending}
            >
              <Folder className="w-4 h-4 mr-3 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{folder.name}</div>
                {folder.description && (
                  <div className="text-xs text-muted-foreground truncate">
                    {folder.description}
                  </div>
                )}
              </div>
            </Button>
          ))}
        </div>

        <div className="border-t pt-4">
          {!isCreatingFolder ? (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setIsCreatingFolder(true)}
            >
              <FolderPlus className="w-4 h-4 mr-3" />
              <span>Create New Folder</span>
            </Button>
          ) : (
            <div className="space-y-3">
              <Label htmlFor="folderName" className="text-sm font-medium">
                Folder Name
              </Label>
              <Input
                id="folderName"
                ref={inputRef}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter folder name"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim() || createFolderMutation.isPending}
                  className="flex-1"
                >
                  <span>Create</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                  }}
                  className="flex-1"
                >
                  <span>Cancel</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {folders.length === 0 && !isCreatingFolder && (
          <div className="text-center py-6 text-muted-foreground">
            <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No folders yet. Create your first folder to organize articles.</p>
          </div>
        )}
      </div>
    </DialogContent>
  );
});

FolderDialogContent.displayName = 'FolderDialogContent';

export default function FollowButton({
  contentItem,
  resourceId,
  variant = 'icon',
  size = 'default',
  className = ''
}: FollowButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: folders } = useQuery<Folder[]>({
    queryKey: ['/api/folders'],
  });

  const createFolderMutation = useMutation({
    mutationFn: async (folderName: string) => {
      const response = await apiRequest('/api/folders', 'POST', {
        name: folderName,
        description: `Collection for ${folderName} articles`
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      setNewFolderName('');
      setIsCreatingFolder(false);
      toast({
        title: "Folder Created",
        description: "New folder created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create folder. Please try again.",
        variant: "destructive",
      });
    }
  });

  const addToFolderMutation = useMutation({
    mutationFn: async (folderId: number) => {
      const response = await apiRequest(`/api/folders/${folderId}/save-search`, 'POST', {
        resourceId: resourceId,
        searchName: contentItem.title,
        url: contentItem.url || '',
        keywords: contentItem.title,
        title: `${contentItem.platform} - ${contentItem.title}`
      });
      return response.json();
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/saved-searches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      toast({
        title: "Added to Folder",
        description: "Article has been saved to your folder",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add article to folder. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAddToCollection = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDialogOpen(true);
  }, []);

  const handleFolderSelect = useCallback((folderId: number) => {
    setSelectedFolderId(folderId);
    addToFolderMutation.mutate(folderId);
  }, [addToFolderMutation]);

  const handleCreateFolder = useCallback(() => {
    if (newFolderName.trim()) {
      createFolderMutation.mutate(newFolderName.trim());
    }
  }, [newFolderName, createFolderMutation]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleCreateFolder();
    }
  }, [handleCreateFolder]);

  if (variant === 'button') {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size={size}
            onClick={handleAddToCollection}
            className={`${className} border-primary text-primary hover:bg-primary hover:text-primary-foreground`}
            disabled={addToFolderMutation.isPending}
          >
            <Bookmark className="w-4 h-4 mr-2" />
            <span>Follow</span>
          </Button>
        </DialogTrigger>
        <FolderDialogContent
          folders={folders || []}
          isCreatingFolder={isCreatingFolder}
          newFolderName={newFolderName}
          setNewFolderName={setNewFolderName}
          handleFolderSelect={handleFolderSelect}
          handleCreateFolder={handleCreateFolder}
          handleKeyDown={handleKeyDown}
          setIsCreatingFolder={setIsCreatingFolder}
          addToFolderMutation={addToFolderMutation}
          createFolderMutation={createFolderMutation}
        />
      </Dialog>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size={size === 'sm' ? 'sm' : 'default'}
          onClick={handleAddToCollection}
          className={`${className} text-muted-foreground hover:text-primary transition-colors`}
          disabled={addToFolderMutation.isPending}
        >
          <Bookmark className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
          <span className="sr-only">Save to collection</span>
        </Button>
      </DialogTrigger>
      <FolderDialogContent
        folders={folders || []}
        isCreatingFolder={isCreatingFolder}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        handleFolderSelect={handleFolderSelect}
        handleCreateFolder={handleCreateFolder}
        handleKeyDown={handleKeyDown}
        setIsCreatingFolder={setIsCreatingFolder}
        addToFolderMutation={addToFolderMutation}
        createFolderMutation={createFolderMutation}
      />
    </Dialog>
  );
}