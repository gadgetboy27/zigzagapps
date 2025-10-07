import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { App } from "@shared/schema";
import AnimatedHeader from "./animated-header";

export default function PremiumStore() {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Constants for read more functionality
  const WORD_LIMIT = 20;

  // Helper function to truncate text and show read more
  const truncateText = (text: string, wordLimit: number = WORD_LIMIT) => {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  const shouldShowReadMore = (text: string) => {
    if (!text) return false;
    return text.trim().split(/\s+/).length > WORD_LIMIT;
  };

  const toggleCardExpansion = (appId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appId)) {
        newSet.delete(appId);
      } else {
        newSet.add(appId);
      }
      return newSet;
    });
  };

  const { data: premiumApps = [], isLoading } = useQuery<App[]>({
    queryKey: ["/api/apps"],
    select: (apps) => apps.filter(app => app.isPremium && app.price),
  });

  if (isLoading) {
    return (
      <section id="store" className="min-h-screen py-20 snap-section bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <AnimatedHeader 
              text="PREMIUM STORE" 
              className="text-5xl md:text-6xl font-black mb-6 text-secondary"
            />
            <div className="h-4 bg-muted rounded max-w-2xl mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden brutalist-shadow-secondary animate-pulse">
                <div className="w-full h-40 bg-muted"></div>
                <div className="p-6">
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded mb-4"></div>
                  <div className="h-8 bg-muted rounded mb-4"></div>
                  <div className="space-y-2 mb-6">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                  </div>
                  <div className="h-12 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="store" className="min-h-screen py-20 snap-section apple-scroll-section relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 gradient-parallax-2 opacity-20 z-0"></div>
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <AnimatedHeader 
            text="PREMIUM STORE" 
            className="text-5xl md:text-6xl font-black mb-6 text-secondary"
            data-testid="store-title"
          />
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="store-description">
            Get exclusive access to premium applications with advanced features, priority support, and lifetime updates.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {premiumApps.map((app, index) => (
            <div 
              key={app.id} 
              className="bg-card rounded-2xl overflow-hidden brutalist-shadow-secondary relative"
              data-testid={`premium-app-${app.id}`}
            >
              {index === 0 && (
                <div className="absolute top-4 right-4 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-bold">
                  BESTSELLER
                </div>
              )}
              <img 
                src={app.imageUrl || "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&h=300"} 
                alt={`${app.name} interface`}
                className="w-full h-40 object-cover" 
              />
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2 text-foreground" data-testid={`premium-app-name-${app.id}`}>
                  {app.name}
                </h3>
                <div className="mb-4" data-testid={`premium-app-description-${app.id}`}>
                  <p className="text-muted-foreground min-h-[3rem]">
                    {expandedCards.has(app.id) ? (app.longDescription || app.description) : truncateText(app.longDescription || app.description)}
                  </p>
                  {shouldShowReadMore(app.longDescription || app.description) && (
                    <button
                      onClick={() => toggleCardExpansion(app.id)}
                      className="text-primary hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-sm font-medium mt-1 transition-colors"
                      data-testid={`premium-app-read-more-${app.id}`}
                      aria-expanded={expandedCards.has(app.id)}
                      aria-controls={`description-${app.id}`}
                    >
                      {expandedCards.has(app.id) ? 'Read less' : 'Read more'}
                    </button>
                  )}
                </div>
                <div className="flex items-center mb-4">
                  <span className="text-3xl font-bold text-primary" data-testid={`premium-app-price-${app.id}`}>
                    ${app.price}
                  </span>
                  <span className="text-muted-foreground ml-2">one-time</span>
                </div>
                <ul className="text-sm text-muted-foreground mb-6 space-y-2">
                  {app.features?.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center" data-testid={`premium-app-feature-${app.id}-${featureIndex}`}>
                      <i className="fas fa-check text-accent mr-2"></i> {feature}
                    </li>
                  )) || [
                    <li key="default-1" className="flex items-center"><i className="fas fa-check text-accent mr-2"></i> Premium features</li>,
                    <li key="default-2" className="flex items-center"><i className="fas fa-check text-accent mr-2"></i> Priority support</li>,
                    <li key="default-3" className="flex items-center"><i className="fas fa-check text-accent mr-2"></i> Lifetime updates</li>,
                  ]}
                </ul>
{/* High-value premium app - Instant Connect */}
                {app.price && parseFloat(app.price) >= 100000 ? (
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black p-3 rounded-lg text-center font-bold">
                      <i className="fas fa-crown mr-2"></i>ENTERPRISE SOLUTION
                    </div>
                    <a 
                      href="#contact"
                      className="w-full bg-gradient-to-r from-primary to-secondary text-white py-4 rounded-lg font-bold hover:from-primary/90 hover:to-secondary/90 transition-all transform hover:scale-105 flex items-center justify-center"
                      data-testid={`premium-app-contact-${app.id}`}
                    >
                      <i className="fas fa-phone mr-2"></i>INSTANT CONNECT
                    </a>
                    <p className="text-xs text-muted-foreground text-center">
                      Custom pricing • Enterprise licensing • Direct consultation
                    </p>
                  </div>
                ) : (
                  <Link href={`/checkout/${app.id}`}>
                    <button 
                      className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors"
                      data-testid={`premium-app-buy-${app.id}`}
                    >
                      <i className="fas fa-shopping-cart mr-2"></i>BUY NOW
                    </button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {premiumApps.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-xl" data-testid="store-empty-state">
              No premium apps available at the moment.
            </p>
          </div>
        )}
        
        {/* Payment Security */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">Secure payments powered by Stripe • 30-day money-back guarantee</p>
          <div className="flex justify-center space-x-6 text-2xl text-muted-foreground">
            <i className="fab fa-cc-visa"></i>
            <i className="fab fa-cc-mastercard"></i>
            <i className="fab fa-cc-amex"></i>
            <i className="fab fa-paypal"></i>
            <i className="fab fa-apple-pay"></i>
          </div>
        </div>
      </div>
    </section>
  );
}
