import { useEffect } from "react";
import CustomCursor from "@/components/custom-cursor";
import NavigationDots from "@/components/navigation-dots";
import HeroSection from "@/components/hero-section";
import AboutSection from "@/components/about-section";
import AppsShowcase from "@/components/apps-showcase";
import PremiumStore from "@/components/premium-store";
import Testimonials from "@/components/testimonials";
import ContactSection from "@/components/contact-section";

export default function Home() {
  useEffect(() => {
    // SEO and document setup
    document.title = "ZIGZAG APPS - Henry Peti | Modern App Developer & Entrepreneur | Portfolio & App Store";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'ZIGZAG APPS by Henry Peti - Software Engineer, App Developer & Entrepreneur. Discover cutting-edge mobile apps, web applications, and digital solutions. Buy premium apps and explore innovative development projects.');
    }
  }, []);

  return (
    <div className="scroll-snap">
      <CustomCursor />
      <NavigationDots />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-xl font-bold text-primary font-mono" data-testid="logo">
              <span className="text-gradient">ZZ</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#about" className="hover:text-primary transition-colors" data-testid="nav-about">About</a>
              <a href="#apps" className="hover:text-primary transition-colors" data-testid="nav-apps">Apps</a>
              <a href="#store" className="hover:text-primary transition-colors" data-testid="nav-store">Store</a>
              <a href="#contact" className="hover:text-primary transition-colors" data-testid="nav-contact">Contact</a>
            </div>
            <div className="flex space-x-4">
              <a href="https://github.com/gadgetboy27" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-github">
                <i className="fab fa-github text-xl"></i>
              </a>
              <a href="https://linkedin.com/in/henrypeti" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-linkedin">
                <i className="fab fa-linkedin text-xl"></i>
              </a>
            </div>
          </div>
        </nav>
      </header>

      <HeroSection />
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
            <p className="text-muted-foreground text-sm">© 2025 Henry Peti. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
