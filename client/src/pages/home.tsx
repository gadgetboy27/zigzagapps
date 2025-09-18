import React from 'react';
import { useEffect, useState } from "react";
import CustomCursor from "@/components/custom-cursor";
import NavigationDots from "@/components/navigation-dots";
import HeroSection from "@/components/hero-section";
import AboutSection from "@/components/about-section";
import AppsShowcase from "@/components/apps-showcase";
import PremiumStore from "@/components/premium-store";
import Testimonials from "@/components/testimonials";
import ContactSection from "@/components/contact-section";
import ThemeSelector from "@/components/theme-selector";
import zigzagLogoTshirt from "@assets/logo-t-shirt-zig-zag_1758166586152.png";
import zigzagLogoRedBlack from "@assets/zigzag_redBlack_1758166406884.png";
import newDarkLogo from "@assets/zig-zag-man-black-bg_1758180362731.jpg";
import { useTheme } from "@/contexts/theme-context";

export default function Home() {
  const { theme } = useTheme();
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  
  // Select appropriate navbar logo asset based on theme
  const getNavbarLogoAsset = () => {
    if (theme === 'light') {
      return zigzagLogoRedBlack; // Red/black version for light theme
    } else if (theme === 'dark') {
      return newDarkLogo; // New dark mode logo
    } else { // blue theme
      return newDarkLogo; // Same logo as dark mode
    }
  };
  
  useEffect(() => {
    // SEO and document setup
    document.title = "ZIGZAG APPS - Henry Peti | Modern App Developer & Entrepreneur | Portfolio & App Store";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'ZIGZAG APPS by Henry Peti - Software Engineer, App Developer & Entrepreneur. Discover cutting-edge mobile apps, web applications, and digital solutions. Buy premium apps and explore innovative development projects.');
    }
  }, []);
  
  const handleTypingComplete = (isComplete: boolean) => {
    setIsTypingComplete(isComplete);
  };

  return (
    <div className="scroll-snap">
      <CustomCursor />
      <NavigationDots />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center h-12" data-testid="logo">
              <img 
                src={getNavbarLogoAsset()} 
                alt="ZigZag Logo" 
                className="h-full w-auto object-contain"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#about" className="hover:text-primary transition-colors" data-testid="nav-about">About</a>
              <a href="#apps" className="hover:text-primary transition-colors" data-testid="nav-apps">Apps</a>
              <a href="#store" className="hover:text-primary transition-colors" data-testid="nav-store">Store</a>
              <a href="#contact" className="hover:text-primary transition-colors" data-testid="nav-contact">Contact</a>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeSelector />
              <a href="https://github.com/gadgetboy27" className="text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-primary/10 rounded-lg" data-testid="link-github">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://linkedin.com/in/henrypeti" className="text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-primary/10 rounded-lg" data-testid="link-linkedin">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
        </nav>
      </header>

      <HeroSection onTypingComplete={handleTypingComplete} />
      <AboutSection />
      <AppsShowcase />
      <PremiumStore />
      <Testimonials />
      <ContactSection />

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gradient font-mono mb-4">ZIGZAG APPS</div>
            <p className="text-muted-foreground mb-6">Building the future, one app at a time.</p>
            <div className="flex justify-center space-x-6 mb-6">
              <a href="#apps" className="text-muted-foreground hover:text-primary transition-colors">Apps</a>
              <a href="#store" className="text-muted-foreground hover:text-primary transition-colors">Store</a>
              <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
              <a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy</a>
              <a href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms</a>
            </div>
            <p className="text-muted-foreground text-sm">© 2025 zigzagapps. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
