import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Folder, 
  FolderPlus, 
  Archive, 
  Star, 
  Eye,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreVertical,
  Edit3,
  Trash2
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Folder {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}

interface FolderSidebarProps {
  selectedFolderId?: number;
  onFolderSelect: (folderId: number | undefined) => void;
  onShowFavorites: () => void;
}

export default function FolderSidebar({ 
  selectedFolderId, 
  onFolderSelect, 
  onShowFavorites 
}: FolderSidebarProps) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    collections: true,
    folders: true
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: folders = [] } = useQuery({
    queryKey: ['/api/folders']
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest('/api/folders', 'POST', { name });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      setIsCreatingFolder(false);
      setNewFolderName('');
      toast({
        title: "Folder created",
        description: "Your new folder has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create folder. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const response = await apiRequest(`/api/folders/${id}`, 'PATCH', { name });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      setEditingFolderId(null);
      setEditingName('');
      toast({
        title: "Folder updated",
        description: "Folder name has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update folder. Please try again.",
        variant: "destructive",
      });
    }
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/folders/${id}`, 'DELETE');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      if (selectedFolderId === deleteFolderMutation.variables) {
        onFolderSelect(undefined);
      }
      toast({
        title: "Folder deleted",
        description: "Folder has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete folder. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolderMutation.mutate(newFolderName.trim());
    }
  };

  const handleUpdateFolder = () => {
    if (editingFolderId && editingName.trim()) {
      updateFolderMutation.mutate({ id: editingFolderId, name: editingName.trim() });
    }
  };

  const toggleSection = (section: 'collections' | 'folders') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="w-72 h-full bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Archive className="w-5 h-5 text-primary" />
          Article Monitoring
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Content aggregation and curation
        </p>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {/* All Articles */}
          <Button
            variant={!selectedFolderId ? "secondary" : "ghost"}
            className="w-full justify-start h-10 px-3"
            onClick={() => onFolderSelect(undefined)}
          >
            <Eye className="w-4 h-4 mr-3" />
            All Articles
          </Button>

          {/* Favorites */}
          {/* <Button
            variant="ghost"
            className="w-full justify-start h-10 px-3"
            onClick={onShowFavorites}
          >
            <Star className="w-4 h-4 mr-3" />
            Favorites
          </Button> */}

          {/* Folders Section */}
          <div className="pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between h-8 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => toggleSection('folders')}
            >
              <span className="text-xs font-medium uppercase tracking-wider">Folders</span>
              {expandedSections.folders ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </Button>

            {expandedSections.folders && (
              <div className="mt-2 space-y-1">
                {(folders as Folder[]).map((folder) => (
                  <div key={folder.id} className="group relative">
                    {editingFolderId === folder.id ? (
                      <div className="flex items-center gap-1 px-3 py-2">
                        <Folder className="w-4 h-4 text-primary flex-shrink-0" />
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-6 text-sm border-0 bg-transparent p-0 focus-visible:ring-0"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateFolder();
                            } else if (e.key === 'Escape') {
                              setEditingFolderId(null);
                              setEditingName('');
                            }
                          }}
                          onBlur={handleUpdateFolder}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="flex items-center w-full">
                        <Button
                          variant={selectedFolderId === folder.id ? "secondary" : "ghost"}
                          className="flex-1 justify-start h-9 px-3 text-sm"
                          onClick={() => onFolderSelect(folder.id)}
                        >
                          <Folder className="w-4 h-4 mr-3 text-primary" />
                          <span className="flex-1 text-left truncate">{folder.name}</span>
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 ml-1 flex-shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingFolderId(folder.id);
                                setEditingName(folder.name);
                              }}
                            >
                              <Edit3 className="w-3 h-3 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFolderMutation.mutate(folder.id);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="w-3 h-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                ))}

                {/* Create New Folder */}
                {!isCreatingFolder ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-9 px-3 text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setIsCreatingFolder(true)}
                  >
                    <FolderPlus className="w-4 h-4 mr-3" />
                    Create Folder
                  </Button>
                ) : (
                  
                  <form 
  onSubmit={(e) => {
    e.preventDefault();
    e.stopPropagation();
    handleCreateFolder();
  }}
  className="flex items-center gap-1 px-4 py-2"
>
  <Folder className="w-4 h-4 text-primary flex-shrink-0" />
  <Input
    value={newFolderName}
    onChange={(e) => setNewFolderName(e.target.value)}
    placeholder="Folder named"
    className="h-6 text-sm border-0 bg-transparent px-2 focus-visible:ring-0" // Changed p-0 to px-2
    onKeyDown={(e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCreateFolder();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsCreatingFolder(false);
        setNewFolderName('');
      }
    }}
    onBlur={() => {
      if (newFolderName.trim()) {
        handleCreateFolder();
      } else {
        setIsCreatingFolder(false);
      }
    }}
    autoFocus
  />
</form>
                )}

                {(folders as Folder[]).length === 0 && !isCreatingFolder && (
                  <div className="px-3 py-4 text-center">
                    <Folder className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">
                      No folders yet
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}