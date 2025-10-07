import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AnimatedHeader from "./animated-header";
import ContactModal from "./contact-modal";

export default function ContactSection() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    projectType: "",
    budget: "",
    message: "",
    // Honeypot field (hidden from users, catches bots)
    website: "",
  });

  const contactMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      setIsModalOpen(true);
      setFormData({
        name: "",
        email: "",
        projectType: "",
        budget: "",
        message: "",
        website: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <section id="contact" className="min-h-screen py-20 snap-section apple-scroll-section relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 gradient-parallax-3 opacity-20 z-0"></div>
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <AnimatedHeader 
            text="GET IN TOUCH" 
            className="text-5xl md:text-6xl font-black mb-16 text-center text-primary"
            data-testid="contact-title"
          />
          
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div>
              <h3 className="text-2xl font-bold mb-8 text-secondary">Let's Build Something Amazing</h3>
              <p className="text-muted-foreground mb-8 text-lg" data-testid="contact-description">
                Ready to turn your ideas into reality? Whether you need a custom app, web platform, or digital solution, I'm here to help bring your vision to life.
              </p>
              
              <div className="space-y-6">
                <a 
                  href="mailto:henrypeti.dev@gmail.com"
                  className="flex items-center hover:bg-muted/50 p-2 rounded-lg transition-colors group"
                  data-testid="contact-email"
                >
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mr-4 group-hover:bg-primary/80 transition-colors">
                    <i className="fas fa-envelope text-primary-foreground"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">Email</h4>
                    <p className="text-muted-foreground group-hover:text-foreground transition-colors">henrypeti.dev@gmail.com</p>
                  </div>
                </a>
                
              </div>
              
              {/* Social Links */}
              <div className="mt-8">
                <h4 className="font-bold text-foreground mb-4">Follow Me</h4>
                <div className="flex space-x-4">
                  <a 
                    href="https://github.com/gadgetboy27" 
                    className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                    data-testid="social-github"
                  >
                    <i className="fab fa-github"></i>
                  </a>
                  <a 
                    href="https://linkedin.com/in/henrypeti" 
                    className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                    data-testid="social-linkedin"
                  >
                    <i className="fab fa-linkedin"></i>
                  </a>
                  <a 
                    href="https://instagram.com/henrypeti.dev" 
                    className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                    data-testid="social-instagram"
                  >
                    <i className="fab fa-instagram"></i>
                  </a>
                  <a 
                    href="https://facebook.com/SwipeRightNZ" 
                    className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                    data-testid="social-facebook"
                  >
                    <i className="fab fa-facebook"></i>
                  </a>
                </div>
              </div>
            </div>
            
            {/* Contact Form */}
            <div className="bg-card p-8 rounded-2xl brutalist-shadow-secondary">
              <form onSubmit={handleSubmit} className="space-y-6" data-testid="contact-form">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Name *</label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                      className="bg-input border-border"
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Email *</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                      className="bg-input border-border"
                      data-testid="input-email"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Project Type</label>
                  <Select value={formData.projectType} onValueChange={(value) => handleInputChange("projectType", value)}>
                    <SelectTrigger className="bg-input border-border" data-testid="select-project-type">
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile">Mobile App Development</SelectItem>
                      <SelectItem value="web">Web Application</SelectItem>
                      <SelectItem value="desktop">Desktop Software</SelectItem>
                      <SelectItem value="ecommerce">E-commerce Platform</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Budget Range</label>
                  <Select value={formData.budget} onValueChange={(value) => handleInputChange("budget", value)}>
                    <SelectTrigger className="bg-input border-border" data-testid="select-budget">
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                      <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                      <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                      <SelectItem value="50k+">$50,000+</SelectItem>
                      <SelectItem value="discuss">Let's discuss</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Message *</label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    rows={5}
                    required
                    placeholder="Tell me about your project..."
                    className="bg-input border-border resize-none"
                    data-testid="textarea-message"
                    maxLength={2000}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {formData.message.length}/2000 characters
                  </div>
                </div>

                {/* Honeypot field - hidden from users */}
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />
                
                <Button 
                  type="submit" 
                  disabled={contactMutation.isPending}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-bold text-lg brutalist-shadow hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all"
                  data-testid="button-submit"
                >
                  {contactMutation.isPending ? (
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                  ) : (
                    <i className="fas fa-paper-plane mr-2"></i>
                  )}
                  {contactMutation.isPending ? "SENDING..." : "SEND MESSAGE"}
                </Button>
              </form>
            </div>
          </div>
        </div>
        
        <ContactModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </div>
    </section>
  );
}
