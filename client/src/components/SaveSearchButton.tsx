import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { BookmarkPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SaveSearchButtonProps {
  resourceId: number;
  url?: string;
  keywords?: string;
  title?: string;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'default';
}

interface FolderType {
  id: number;
  name: string;
  description?: string;
  color: string;
  isDefault: boolean;
}

const saveSchema = z.object({
  folderId: z.number().min(1, "Please select a folder"),
  searchName: z.string().min(1, "Please enter a search name"),
});

type SaveForm = z.infer<typeof saveSchema>;

export default function SaveSearchButton({ 
  resourceId, 
  url, 
  keywords, 
  title, 
  variant = 'icon', 
  size = 'default' 
}: SaveSearchButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<SaveForm>({
    resolver: zodResolver(saveSchema),
    defaultValues: {
      folderId: 0,
      searchName: title || keywords || url?.split('/').pop() || "Search",
    },
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['/api/folders'],
  });

  const saveSearchMutation = useMutation({
    mutationFn: async (data: SaveForm) => {
      return await apiRequest('POST', `/api/folders/${data.folderId}/save-search`, {
        resourceId,
        searchName: data.searchName,
        url,
        keywords,
        title,
      });
    },
    onSuccess: () => {
      toast({
        title: "Search saved",
        description: "Your search has been saved to the folder.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      setIsOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Error saving search:", error);
      toast({
        title: "Error",
        description: "Failed to save search. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SaveForm) => {
    saveSearchMutation.mutate(data);
  };

  if (variant === 'icon') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size={size === 'sm' ? 'sm' : 'icon'}
            className="h-8 w-8 hover:bg-green-50 dark:hover:bg-green-950"
          >
            <BookmarkPlus className="h-4 w-4 text-green-600 dark:text-green-400" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit(onSubmit)(e);
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="searchName">Search Name</Label>
              <Input
                id="searchName"
                {...form.register("searchName")}
                placeholder="Enter a name for this search"
                onChange={(e) => {
                  e.stopPropagation();
                  form.setValue("searchName", e.target.value, { shouldValidate: true });
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    form.handleSubmit(onSubmit)();
                  }
                }}
                onInput={(e) => {
                  e.stopPropagation();
                }}
              />
              {form.formState.errors.searchName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.searchName.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="folder">Folder</Label>
              <Select
                value={form.watch("folderId")?.toString() || ""}
                onValueChange={(value) => form.setValue("folderId", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  {(folders as FolderType[]).map((folder: FolderType) => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${folder.color}`}
                        />
                        {folder.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.folderId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.folderId.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveSearchMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {saveSearchMutation.isPending ? "Saving..." : "Save Search"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size={size}
          className="border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950"
        >
          <BookmarkPlus className="h-4 w-4 mr-2" />
          Save Search
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Search</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="searchName">Search Name</Label>
            <Input
              id="searchName"
              {...form.register("searchName")}
              placeholder="Enter a name for this search"
            />
            {form.formState.errors.searchName && (
              <p className="text-sm text-destructive">
                {form.formState.errors.searchName.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="folder">Folder</Label>
            <Select
              value={form.watch("folderId")?.toString() || ""}
              onValueChange={(value) => form.setValue("folderId", parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                {(folders as FolderType[]).map((folder: FolderType) => (
                  <SelectItem key={folder.id} value={folder.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${folder.color}`}
                      />
                      {folder.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.folderId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.folderId.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveSearchMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saveSearchMutation.isPending ? "Saving..." : "Save Search"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}