import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { App } from "@shared/schema";
import AnimatedHeader from "./animated-header";

export default function PremiumStore() {
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
              text="ZIGZAG STORE" 
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
      <div className="absolute inset-0 gradient-parallax-2 opacity-20"></div>
      {/* Coding overlay */}
      <div className="absolute inset-0 coding-overlay"></div>
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <AnimatedHeader 
            text="ZIGZAG STORE" 
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
                <p className="text-muted-foreground mb-4" data-testid={`premium-app-description-${app.id}`}>
                  {app.longDescription || app.description}
                </p>
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
                <Link href={`/checkout/${app.id}`}>
                  <button 
                    className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors"
                    data-testid={`premium-app-buy-${app.id}`}
                  >
                    <i className="fas fa-shopping-cart mr-2"></i>BUY NOW
                  </button>
                </Link>
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
