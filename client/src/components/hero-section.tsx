export default function HeroSection() {
  return (
    <section id="hero" className="min-h-screen flex items-center justify-center snap-section relative overflow-hidden">
      {/* Floating geometric shapes */}
      <div className="absolute top-20 left-20 w-16 h-16 bg-primary/20 rotate-45 animate-float"></div>
      <div className="absolute top-40 right-32 w-24 h-24 bg-secondary/20 rounded-full animate-bounce-slow"></div>
      <div className="absolute bottom-32 left-1/4 w-12 h-12 bg-accent/20 animate-pulse-slow"></div>
      
      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-black mb-6 text-gradient leading-tight" data-testid="hero-title">
            HENRY PETI
          </h1>
          <div className="text-2xl md:text-4xl font-bold mb-8 text-foreground">
            <span className="block">SOFTWARE ENGINEER</span>
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
