export default function AboutSection() {
  return (
    <section id="about" className="min-h-screen py-20 snap-section">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <h2 className="text-5xl md:text-6xl font-black mb-8 text-primary" data-testid="about-title">ABOUT</h2>
            <div className="space-y-6 text-lg">
              <p className="text-muted-foreground" data-testid="about-description-1">
                I'm Henry Peti, a passionate software engineer and entrepreneur with over 5 years of experience building innovative digital solutions. My journey started in pre-COVID times, and I've evolved with the rapidly changing tech landscape.
              </p>
              <p className="text-muted-foreground" data-testid="about-description-2">
                I specialize in creating mobile applications, web platforms, and digital experiences that solve real-world problems. From concept to deployment, I handle the entire development lifecycle.
              </p>
              <div className="grid grid-cols-2 gap-6 mt-8">
                <div className="bg-card p-6 rounded-lg brutalist-shadow-secondary" data-testid="stat-projects">
                  <h3 className="text-secondary font-bold text-xl mb-2">50+</h3>
                  <p className="text-muted-foreground">Projects Completed</p>
                </div>
                <div className="bg-card p-6 rounded-lg brutalist-shadow-secondary" data-testid="stat-apps">
                  <h3 className="text-accent font-bold text-xl mb-2">15+</h3>
                  <p className="text-muted-foreground">Apps Published</p>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <img 
              src="https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Modern developer workspace with multiple monitors showing code" 
              className="rounded-2xl brutalist-shadow w-full h-auto"
              data-testid="about-image"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
