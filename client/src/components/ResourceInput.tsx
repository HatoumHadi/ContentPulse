import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertResourceSchema, type InsertResource } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';
import FavoriteButton from './FavoriteButton';

type ResourceForm = InsertResource;

interface ResourceInputProps {
  onResourceCreated: (resource: any) => void;
  existingResourceId?: number;
  selectedResource?: any;
}

export default function ResourceInput({ onResourceCreated, existingResourceId, selectedResource }: ResourceInputProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetchingArticles, setIsFetchingArticles] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'analyzing' | 'fetching' | 'complete'>('analyzing');
  const [lastCreatedResource, setLastCreatedResource] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ResourceForm>({
    resolver: zodResolver(insertResourceSchema),
    defaultValues: {
      url: "",
      keywords: "",
      title: "",
    },
  });

  // Keep form fields empty by default

  const createResourceMutation = useMutation({
    mutationFn: async (data: ResourceForm) => {
      setIsAnalyzing(true);
      const response = await apiRequest("POST", "/api/resources", data);
      return response.json();
    },
    onSuccess: async (resource) => {
      setLastCreatedResource(resource);
      onResourceCreated(resource);
      form.reset();
      setIsAnalyzing(false);
    },
    onError: (error) => {
      console.error("Error creating resource:", error);
      toast({
        title: "Error",
        description: "Failed to create resource. Please try again.",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    },
  });

  const updateAndFetchMutation = useMutation({
    mutationFn: async (data: ResourceForm) => {
      console.log("Starting mutation with data:", data);
      setIsAnalyzing(true);
      setLoadingStage('analyzing');
      
      // Validate URL format before processing
      if (data.url) {
        try {
          const url = new URL(data.url);
          if (!url.protocol.startsWith('http')) {
            throw new Error("URL must use HTTP or HTTPS protocol");
          }
        } catch (error) {
          throw new Error("Please enter a valid URL (e.g., https://example.com)");
        }
      }
      
      if (existingResourceId) {
        console.log("Updating existing resource:", existingResourceId);
        // Update existing resource
        const updateResponse = await apiRequest(`/api/resources/${existingResourceId}`, "PATCH", data);
        console.log("Update response:", updateResponse.status);
        
        // Start fetching articles
        console.log("Starting article fetch for resource:", existingResourceId);
        setLoadingStage('fetching');
        setIsFetchingArticles(true);
        const refreshResponse = await apiRequest(`/api/resources/${existingResourceId}/refresh`, "POST");
        const refreshData = await refreshResponse.json();
        console.log("Refresh completed:", refreshData);
        return { resourceId: existingResourceId, refreshData };
      } else {
        console.log("Creating new resource");
        // Create new resource
        const createResponse = await apiRequest("/api/resources", "POST", data);
        const resource = await createResponse.json();
        console.log("Created resource:", resource);
        
        // Start fetching articles
        console.log("Starting article fetch for new resource:", resource.id);
        setLoadingStage('fetching');
        setIsFetchingArticles(true);
        const refreshResponse = await apiRequest(`/api/resources/${resource.id}/refresh`, "POST");
        const refreshData = await refreshResponse.json();
        console.log("Refresh completed:", refreshData);
        return { resource, refreshData };
      }
    },
    onSuccess: async (result) => {
      console.log("Fetch result:", result);
      
      const resourceId = result.resourceId || result.resource?.id;
      
      // Set completion stage
      setLoadingStage('complete');
      
      // Invalidate all resource-related queries
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
      queryClient.invalidateQueries({ 
        queryKey: ["/api/resources"] 
      });
      
      // Force immediate refetch of content
      queryClient.refetchQueries({ 
        queryKey: [`/api/resources/${resourceId}/recent-content`] 
      });
      
      // Show success message
      toast({
        title: "Monitoring Started",
        description: "Articles are now being tracked and displayed in your dashboard.",
      });
      
      if (result.resource) {
        setLastCreatedResource(result.resource);
        onResourceCreated(result.resource);
      }
      
      // Reset loading states with a slight delay for smooth transition
      setTimeout(() => {
        setIsAnalyzing(false);
        setIsFetchingArticles(false);
        setLoadingStage('analyzing');
      }, 500);
    },
    onError: (error) => {
      console.error("Error updating and fetching:", error);
      toast({
        title: "Monitoring Failed",
        description: "Unable to start monitoring. Please check your connection and try again.",
        variant: "destructive",
      });
      
      // Reset all loading states
      setIsAnalyzing(false);
      setIsFetchingArticles(false);
      setLoadingStage('analyzing');
    },
  });

  const onSubmit = (data: ResourceForm) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    console.log("Form is valid:", form.formState.isValid);
    console.log("Existing resource ID:", existingResourceId);
    
    // Check if form is valid before proceeding
    if (!form.formState.isValid) {
      console.error("Form validation failed:", form.formState.errors);
      toast({
        title: "Validation Error",
        description: "Please fill in required fields correctly.",
        variant: "destructive",
      });
      return;
    }
    
    updateAndFetchMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Content Source Management</h2>
        <p className="text-muted-foreground font-medium">
          Start fetching all articles and social media content related to the current URL or relevant keywords
        </p>
      </div>
      
      <Card className="glass-card professional-shadow border-0">
        <CardContent className="p-8">
          <form onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit(onSubmit)(e);
          }} className="space-y-6">
            <div>
              <Label htmlFor="url" className="text-base font-semibold">
                Website URL
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://almayadeen.net"
                className="mt-2 h-12 text-base border-2 focus:border-green-500 transition-colors"
                {...form.register("url")}
                onChange={(e) => {
                  e.stopPropagation();
                  form.setValue("url", e.target.value, { shouldValidate: true });
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
              {form.formState.errors.url && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.url.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="keywords" className="text-base font-semibold">
                Keywords (Optional)
              </Label>
              <Input
                id="keywords"
                placeholder="politics, news, analysis"
                className="mt-2 h-12 text-base border-2 focus:border-green-500 transition-colors"
                {...form.register("keywords")}
                onChange={(e) => {
                  e.stopPropagation();
                  form.setValue("keywords", e.target.value, { shouldValidate: true });
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
            </div>

            <div>
              <Label htmlFor="title" className="text-base font-semibold">
                Dashboard Name (Optional)
              </Label>
              <Input
                id="title"
                placeholder="My News Dashboard"
                className="mt-2 h-12 text-base border-2 focus:border-green-500 transition-colors"
                {...form.register("title")}
                onChange={(e) => {
                  e.stopPropagation();
                  form.setValue("title", e.target.value, { shouldValidate: true });
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
            </div>

            <Button
              type="submit"
              onClick={(e) => {
                console.log("Start Monitoring button clicked");
                console.log("Form values:", form.getValues());
                console.log("Form state valid:", form.formState.isValid);
                console.log("Form errors:", form.formState.errors);
                
                // Trigger validation manually
                form.trigger();
              }}
              className={`w-full h-12 text-base font-semibold transition-all duration-300 transform ${
                updateAndFetchMutation.isPending || isAnalyzing || isFetchingArticles
                  ? 'bg-gradient-to-r from-green-500 to-green-600 cursor-not-allowed scale-[0.98] shadow-lg'
                  : loadingStage === 'complete'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-lg scale-[1.02]'
                  : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:scale-[1.02] hover:shadow-lg'
              }`}
              disabled={updateAndFetchMutation.isPending || isAnalyzing || isFetchingArticles}
              size="lg"
            >
              {loadingStage === 'analyzing' && (updateAndFetchMutation.isPending || isAnalyzing) ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Analyzing URL...
                </>
              ) : loadingStage === 'fetching' && isFetchingArticles ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Fetching Articles...
                </>
              ) : loadingStage === 'complete' ? (
                <>
                  <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Monitoring Active
                </>
              ) : (
                <>
                  <Plus className="mr-3 h-5 w-5" />
                  Start Monitoring
                </>
              )}
            </Button>
            
            {/* Enhanced Progress indicator */}
            {(updateAndFetchMutation.isPending || isAnalyzing || isFetchingArticles) && (
              <div className="mt-4 space-y-3 animate-fadeIn">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      loadingStage === 'analyzing' 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 w-1/3 animate-pulse' 
                        : loadingStage === 'fetching'
                        ? 'bg-gradient-to-r from-green-500 to-green-600 w-2/3 animate-pulse'
                        : 'bg-gradient-to-r from-green-500 to-green-600 w-full'
                    }`}
                  />
                </div>
                
                {/* Step indicators */}
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className={`flex items-center space-x-1 ${
                    loadingStage === 'analyzing' ? 'text-blue-600 font-medium' : 'text-gray-400'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      loadingStage === 'analyzing' ? 'bg-blue-600 animate-pulse' : 'bg-gray-300'
                    }`} />
                    <span>Analyzing</span>
                  </div>
                  
                  <div className={`flex items-center space-x-1 ${
                    loadingStage === 'fetching' ? 'text-green-600 font-medium' : 'text-gray-400'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      loadingStage === 'fetching' ? 'bg-green-600 animate-pulse' : 'bg-gray-300'
                    }`} />
                    <span>Fetching</span>
                  </div>
                  
                  <div className={`flex items-center space-x-1 ${
                    loadingStage === 'complete' ? 'text-green-600 font-medium' : 'text-gray-400'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      loadingStage === 'complete' ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                    <span>Complete</span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center font-medium">
                  {loadingStage === 'analyzing' 
                    ? "Analyzing website content and extracting keywords..." 
                    : loadingStage === 'fetching'
                    ? "Fetching articles from multiple sources..."
                    : "Articles successfully retrieved and displayed"
                  }
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}