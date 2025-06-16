import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Search, Globe, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SavedSearchesViewProps {
  folderId: number;
  onSearchSelect: (search: SavedSearchItem) => void;
}

interface SavedSearchItem {
  id: number;
  userId: string;
  folderId: number;
  resourceId: number;
  searchName: string;
  url?: string;
  keywords?: string;
  title?: string;
  createdAt: string;
  resource: {
    id: number;
    userId: string;
    url?: string;
    keywords?: string;
    title?: string;
    isActive: boolean;
    createdAt: string;
  };
}

export default function SavedSearchesView({ folderId, onSearchSelect }: SavedSearchesViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedSearches = [], isLoading } = useQuery<SavedSearchItem[]>({
    queryKey: [`/api/folders/${folderId}/saved-searches`],
  });

  const removeSearchMutation = useMutation({
    mutationFn: async (searchId: number) => {
      await apiRequest(`/api/saved-searches/${searchId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Search removed",
        description: "The saved search has been removed from this folder.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/folders/${folderId}/saved-searches`] });
    },
    onError: (error) => {
      console.error("Error removing saved search:", error);
      toast({
        title: "Error",
        description: "Failed to remove saved search. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRemoveSearch = (searchId: number) => {
    removeSearchMutation.mutate(searchId);
  };

  const handleSearchClick = (search: SavedSearchItem) => {
    onSearchSelect(search);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!savedSearches.length) {
    return (
      <div className="text-center py-8">
        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No saved searches</h3>
        <p className="text-muted-foreground">
          Save search criteria to this folder for quick access to specific content filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Saved Searches</h3>
        <Badge variant="secondary">{savedSearches.length} saved</Badge>
      </div>

      <div className="space-y-3">
        {savedSearches.map((search) => (
          <Card 
            key={search.id} 
            className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-green-500"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div 
                  className="flex-1 space-y-2"
                  onClick={() => handleSearchClick(search)}
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium text-foreground">{search.searchName}</h4>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {search.url && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        <span className="truncate">{search.url}</span>
                      </div>
                    )}
                    {search.keywords && (
                      <div className="flex items-center gap-2">
                        <Hash className="h-3 w-3" />
                        <span>{search.keywords}</span>
                      </div>
                    )}
                    {search.title && (
                      <div className="text-xs font-medium text-muted-foreground">
                        Title: {search.title}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Saved {new Date(search.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSearch(search.id);
                  }}
                  disabled={removeSearchMutation.isPending}
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}