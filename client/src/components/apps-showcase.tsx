import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { App } from "@shared/schema";
import AnimatedHeader from "./animated-header";

export default function AppsShowcase() {
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: apps = [], isLoading } = useQuery<App[]>({
    queryKey: ["/api/apps"],
  });

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
    <section id="apps" className="min-h-screen py-20 snap-section">
      <div className="container mx-auto px-6">
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
                    <a 
                      href={app.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg text-center font-bold hover:bg-primary/90 transition-colors"
                      data-testid={`app-demo-${app.id}`}
                    >
                      Demo
                    </a>
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
    </section>
  );
}
