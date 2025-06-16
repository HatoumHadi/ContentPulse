import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { isUnauthorizedError } from "@/lib/authUtils";
import ResourceInput from "@/components/ResourceInput";
import PlatformCategoryToggle from "@/components/PlatformCategoryToggle";

import ContentSections from "@/components/ContentSections";
import FolderSidebar from "@/components/FolderSidebar";
import FavoriteArticlesView from "@/components/FavoriteArticlesView";
import SavedSearchesView from "@/components/SavedSearchesView";
import SocialMediaAnalytics from "@/components/SocialMediaAnalytics";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Plus, MoreVertical, Moon, Sun, LogOut, Bug } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import RSSDebugger from "@/components/RSSDebugger";

interface Resource {
  id: number;
  url: string;
  keywords?: string;
  title?: string;
  isActive: boolean;
  createdAt: string;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | undefined>(undefined);
  const [selectedSearch, setSelectedSearch] = useState<any>(null);
  const [isMonitoringActive, setIsMonitoringActive] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'articles' | 'favorites' | 'folder' | 'analytics'>('articles');
  const [activePlatforms, setActivePlatforms] = useState({
    website: true,
    reddit: true,
    social: true, // Covers Facebook, Instagram, Twitter/X
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: resources, refetch: refetchResources } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
    enabled: isAuthenticated,
  });

  // Auto-select most recent resource if available
  useEffect(() => {
    const resourceArray = resources as Resource[] | undefined;
    if (resourceArray && resourceArray.length > 0 && !selectedResource) {
      // Sort by creation date descending and select the newest resource
      const sortedResources = [...resourceArray].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setSelectedResource(sortedResources[0]);
    }
  }, [resources, selectedResource]);

  const handleResourceCreated = (resource: Resource) => {
    setSelectedResource(resource);
    setIsMonitoringActive(true); // Activate monitoring when resource is created
    refetchResources();
  };

  const togglePlatform = (platform: 'website' | 'reddit' | 'social') => {
    setActivePlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary dark:bg-gradient-to-r dark:from-primary/90 dark:to-primary border-b border-border px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white dark:text-white">ArticleRadar</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-white/80 dark:text-white/80 text-sm">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Live Analytics</span>
            </div>
            


            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="text-white hover:bg-white/10 dark:text-white dark:hover:bg-white/10"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 dark:text-white dark:hover:bg-white/10"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content with Folder Sidebar */}
        <div className="flex h-[calc(100vh-80px)]">
          {/* Folder Sidebar */}
          <FolderSidebar 
            selectedFolderId={selectedFolderId}
            onFolderSelect={setSelectedFolderId}
            onShowFavorites={() => setCurrentView('favorites')}
          />

          {/* Main Content Area */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto px-6 py-8">
            
            {/* Navigation Tabs */}
            {!selectedFolderId && (
              <div className="mb-6">
                <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
                  <Button
                    variant={currentView === 'articles' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentView('articles')}
                    className={currentView === 'articles' ? 'bg-background shadow-sm text-foreground dark:text-foreground' : 'text-muted-foreground hover:text-foreground'}
                  >
                    Articles
                  </Button>
                  <Button
                    variant={currentView === 'analytics' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentView('analytics')}
                    className={currentView === 'analytics' ? 'bg-background shadow-sm text-foreground dark:text-foreground' : 'text-muted-foreground hover:text-foreground'}
                    disabled={!selectedResource}
                  >
                    Analytics
                  </Button>
                  <Button
                    variant={currentView === 'favorites' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentView('favorites')}
                    className={currentView === 'favorites' ? 'bg-background shadow-sm text-foreground dark:text-foreground' : 'text-muted-foreground hover:text-foreground'}
                  >
                    Favorites
                  </Button>
                </div>
              </div>
            )}
            
            {selectedFolderId ? (
              /* Folder View */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Folder Content</h2>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFolderId(undefined);
                      setCurrentView('articles');
                    }}
                  >
                    ← Back
                  </Button>
                </div>
                <SavedSearchesView 
                  folderId={selectedFolderId}
                  onSearchSelect={(search) => {
                    // Navigate to the search results
                    const resource = resources?.find((r: Resource) => r.id === search.resourceId);
                    if (resource) {
                      setSelectedResource(resource);
                      setSelectedFolderId(undefined);
                      setCurrentView('articles');
                    }
                  }}
                />
              </div>
            ) : currentView === 'favorites' ? (
              <FavoriteArticlesView onShowDashboard={() => setCurrentView('articles')} />
            ) : currentView === 'analytics' && selectedResource ? (
              /* Analytics View */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Social Media Analytics</h2>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentView('articles')}
                  >
                    ← Back to Articles
                  </Button>
                </div>
                <SocialMediaAnalytics 
                  resourceId={selectedResource.id}
                  activePlatforms={activePlatforms}
                />
              </div>
            ) : (
              /* Original Dashboard View */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Resource Input & Analytics */}
                <div className="lg:col-span-1 space-y-6">
                  <ResourceInput 
                    onResourceCreated={handleResourceCreated} 
                    existingResourceId={selectedResource?.id}
                    selectedResource={selectedResource}
                  />
                  
                  {selectedResource && (
                    <PlatformCategoryToggle 
                      activePlatforms={activePlatforms}
                      onToggle={togglePlatform}
                    />
                  )}
                </div>

                {/* Right Column: Content Sections */}
                <div className="lg:col-span-2 space-y-6">
                  {selectedResource ? (
                    <>
                      <ContentSections 
                        resourceId={selectedResource.id} 
                        activePlatforms={activePlatforms}
                        isMonitoringActive={isMonitoringActive}
                      />
                    </>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>No Resource Selected</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          Create a resource to start analyzing content from different platforms.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
