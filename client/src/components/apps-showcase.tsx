import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { App } from "@shared/schema";
import AnimatedHeader from "./animated-header";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, ShoppingBag } from "lucide-react";

// Helper function to get the demo proxy base URL (same logic as API calls)
const getDemoProxyBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || '';
};

export default function AppsShowcase() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [currentDemoApp, setCurrentDemoApp] = useState<App | null>(null);
  const [demoExpiredApp, setDemoExpiredApp] = useState<App | null>(null);
  const [loadingAppId, setLoadingAppId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: apps = [], isLoading } = useQuery<App[]>({
    queryKey: ["/api/apps"],
  });

  // Demo access mutation
  const demoAccessMutation = useMutation({
    mutationFn: async (appId: string) => {
      setLoadingAppId(appId); // Set loading state for specific app
      const response = await apiRequest("POST", `/api/demo-access/${appId}`);
      return await response.json();
    },
    onSuccess: (data, appId) => {
      setLoadingAppId(null); // Clear loading state
      const app = apps.find(a => a.id === appId);
      if (app && data.sessionToken) {
        setCurrentDemoApp(app);
        setDemoModalOpen(true);
        // Open demo in new window with protected URL - use full URL for cross-platform compatibility
        const baseUrl = getDemoProxyBaseUrl();
        const demoProxyUrl = baseUrl 
          ? `${baseUrl.replace(/\/$/, '')}/api/demo-proxy/${data.sessionToken}`
          : `/api/demo-proxy/${data.sessionToken}`;
        const demoWindow = window.open(demoProxyUrl, '_blank');
        
        // Start countdown timer
        const expiresAt = new Date(data.expiresAt);
        const checkExpiry = () => {
          if (new Date() >= expiresAt) {
            setDemoExpiredApp(app);
            setCurrentDemoApp(null);
            setDemoModalOpen(false);
            toast({
              title: "Demo Expired",
              description: "Your demo session has expired. Purchase the app for unlimited access.",
              variant: "destructive",
            });
            if (demoWindow && !demoWindow.closed) {
              demoWindow.close();
            }
          }
        };
        
        // Check every 5 seconds
        const interval = setInterval(checkExpiry, 5000);
        setTimeout(() => clearInterval(interval), 10 * 60 * 1000);
      }
    },
    onError: (error: any, appId) => {
      setLoadingAppId(null); // Clear loading state on error
      console.error("Demo access error:", error);
      
      if (error.requiresPurchase) {
        setDemoExpiredApp(error.app);
        toast({
          title: "Demo Limit Reached",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Demo Access Failed",
          description: error.message || "Failed to access demo. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleDemoAccess = (app: App) => {
    if (!app.demoUrl) {
      toast({
        title: "Demo Not Available",
        description: "This app doesn't have a demo available.",
        variant: "destructive",
      });
      return;
    }
    
    demoAccessMutation.mutate(app.id);
  };

  const filteredApps = activeFilter === "all" 
    ? apps 
    : apps.filter(app => app.category === activeFilter);

  const filterButtons = [
    { key: "all", label: "ALL" },
    { key: "mobile", label: "MOBILE" },
    { key: "web", label: "WEB" },
    { key: "desktop", label: "DESKTOP" },
  ];

  if (isLoading) {
    return (
      <section id="apps" className="min-h-screen py-20 snap-section">
        <div className="container mx-auto px-6">
          <AnimatedHeader 
            text="MY APPS" 
            className="text-5xl md:text-6xl font-black mb-16 text-center text-primary"
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden brutalist-shadow animate-pulse">
                <div className="w-full h-48 bg-muted"></div>
                <div className="p-6">
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded mb-4"></div>
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 w-16 bg-muted rounded-full"></div>
                    <div className="h-6 w-16 bg-muted rounded-full"></div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 h-10 bg-muted rounded"></div>
                    <div className="flex-1 h-10 bg-muted rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="apps" className="min-h-screen py-20 snap-section apple-scroll-section relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 gradient-parallax-1 opacity-20 z-0"></div>
      <div className="container mx-auto px-6 relative z-10">
        <AnimatedHeader 
          text="MY APPS" 
          className="text-5xl md:text-6xl font-black mb-16 text-center text-primary"
          data-testid="apps-title"
        />
        
        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {filterButtons.map((button) => (
            <button
              key={button.key}
              onClick={() => setActiveFilter(button.key)}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                activeFilter === button.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
              }`}
              data-testid={`filter-${button.key}`}
            >
              {button.label}
            </button>
          ))}
        </div>
        
        {/* Apps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredApps.map((app) => (
            <div 
              key={app.id} 
              className="app-card bg-card rounded-2xl overflow-hidden brutalist-shadow"
              data-testid={`app-card-${app.id}`}
            >
              <img 
                src={app.imageUrl || "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&h=400"} 
                alt={`${app.name} interface`}
                className="w-full h-48 object-cover" 
              />
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 text-foreground" data-testid={`app-name-${app.id}`}>{app.name}</h3>
                <p className="text-muted-foreground mb-4" data-testid={`app-description-${app.id}`}>{app.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {app.technologies?.map((tech, index) => (
                    <span 
                      key={index}
                      className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm"
                      data-testid={`app-tech-${app.id}-${index}`}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex gap-3">
                  {app.demoUrl && (
                    <Button
                      onClick={() => handleDemoAccess(app)}
                      disabled={loadingAppId === app.id}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      data-testid={`app-demo-${app.id}`}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      {loadingAppId === app.id ? "Loading..." : "Demo (10 min)"}
                    </Button>
                  )}
                  {app.githubUrl && (
                    <a 
                      href={app.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-secondary text-secondary-foreground py-2 px-4 rounded-lg text-center font-bold hover:bg-secondary/90 transition-colors"
                      data-testid={`app-github-${app.id}`}
                    >
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredApps.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-xl" data-testid="apps-empty-state">
              No apps found in this category.
            </p>
          </div>
        )}
      </div>

      {/* Demo Session Timer Modal */}
      <Dialog open={demoModalOpen} onOpenChange={setDemoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Demo Active: {currentDemoApp?.name}
            </DialogTitle>
            <DialogDescription>
              Your demo session is active for 10 minutes. The demo will automatically close when the session expires.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Session Status</span>
                <span className="text-sm text-primary">Active</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Demo will expire in approximately 10 minutes
              </div>
            </div>
            
            {currentDemoApp?.isPremium && currentDemoApp.price && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  <span className="font-medium text-primary">Like what you see?</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Purchase {currentDemoApp.name} for unlimited access and all premium features.
                </p>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    // Navigate to checkout - you can implement this based on your routing
                    window.location.href = `/checkout?app=${currentDemoApp.id}`;
                  }}
                  data-testid="demo-purchase-button"
                >
                  Purchase for ${currentDemoApp.price}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Demo Expired / Purchase Conversion Modal */}
      <Dialog open={!!demoExpiredApp} onOpenChange={() => setDemoExpiredApp(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Clock className="w-5 h-5" />
              Demo Session Expired
            </DialogTitle>
            <DialogDescription>
              Your demo session for {demoExpiredApp?.name} has expired or you've reached the daily limit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <h4 className="font-medium text-destructive mb-2">Want to continue?</h4>
              <p className="text-sm text-muted-foreground">
                Purchase {demoExpiredApp?.name} for unlimited access with no time restrictions.
              </p>
            </div>
            
            {demoExpiredApp?.isPremium && demoExpiredApp.price && (
              <div className="space-y-3">
                <Button 
                  className="w-full"
                  onClick={() => {
                    // Navigate to checkout - you can implement this based on your routing
                    window.location.href = `/checkout?app=${demoExpiredApp.id}`;
                  }}
                  data-testid="expired-demo-purchase-button"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Purchase for ${demoExpiredApp.price}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setDemoExpiredApp(null)}
                  data-testid="expired-demo-close-button"
                >
                  Maybe Later
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
