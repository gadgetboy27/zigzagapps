import { useState, useEffect } from "react";

export default function HeroSection() {
  const [displayedText, setDisplayedText] = useState("");
  const fullText = "ZIGZAG APPS";
  
  useEffect(() => {
    let currentIndex = 0;
    const timer = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(timer);
      }
    }, 150); // Adjust speed here

    return () => clearInterval(timer);
  }, []);

  return (
    <section id="hero" className="min-h-screen flex items-center justify-center snap-section relative overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="w-full h-full object-cover opacity-20"
          style={{ filter: 'grayscale(100%) contrast(1.2)' }}
        >
          <source src="https://player.vimeo.com/external/373718227.hd.mp4?s=8bb5b8e8cbeb9e07b8e6d2b51f9f7cb3b8c4e5e8&profile_id=175" type="video/mp4" />
          <source src="https://cdn.pixabay.com/vimeo/371175973/coding-37117.mp4?width=1280&hash=ffe4e8d7fd6ff66804f2c1a0ec0b2d99ceb78fe4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80"></div>
      </div>

      {/* Floating geometric shapes */}
      <div className="absolute top-20 left-20 w-16 h-16 bg-primary/30 rotate-45 animate-float"></div>
      <div className="absolute top-40 right-32 w-24 h-24 bg-secondary/30 rounded-full animate-bounce-slow"></div>
      <div className="absolute bottom-32 left-1/4 w-12 h-12 bg-accent/30 animate-pulse-slow"></div>
      
      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Main animated title */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-4 leading-tight" data-testid="hero-title">
            <span className="text-gradient bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {displayedText}
            </span>
            <span className="animate-pulse text-primary">|</span>
          </h1>
          
          {/* Subtitle with name */}
          <div className="text-lg md:text-xl text-muted-foreground mb-8 font-mono">
            by <span className="text-primary font-bold">Henry Peti</span>
          </div>
          
          <div className="text-2xl md:text-4xl font-bold mb-8 text-foreground">
            <span className="block text-primary">SOFTWARE ENGINEER</span>
            <span className="block text-secondary">APP DEVELOPER</span>
            <span className="block text-accent">ENTREPRENEUR</span>
          </div>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto" data-testid="hero-description">
            Crafting cutting-edge mobile apps and web solutions that push the boundaries of what's possible
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a 
              href="#apps" 
              className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-bold text-lg brutalist-shadow hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all"
              data-testid="button-explore-apps"
            >
              EXPLORE APPS
            </a>
            <a 
              href="#store" 
              className="bg-transparent border-2 border-secondary text-secondary px-8 py-4 rounded-lg font-bold text-lg hover:bg-secondary hover:text-secondary-foreground transition-all"
              data-testid="button-buy-apps"
            >
              BUY PREMIUM APPS
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
