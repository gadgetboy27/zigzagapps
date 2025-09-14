import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { Testimonial } from "@shared/schema";
import AnimatedHeader from "@/components/animated-header";

export default function Testimonials() {
  const { data: testimonials = [], isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
  });

  if (isLoading) {
    return (
      <section id="testimonials" className="min-h-screen py-20 snap-section">
        <div className="container mx-auto px-6">
          <AnimatedHeader 
            text="TESTIMONIALS" 
            className="text-4xl md:text-5xl lg:text-6xl font-black mb-16 text-center text-primary w-full"
            data-testid="testimonials-title"
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card p-8 rounded-2xl brutalist-shadow animate-pulse">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="w-5 h-5 bg-muted rounded"></div>
                  ))}
                </div>
                <div className="space-y-2 mb-6">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-muted rounded-full mr-4"></div>
                  <div>
                    <div className="h-4 bg-muted rounded mb-1 w-24"></div>
                    <div className="h-3 bg-muted rounded w-32"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Default testimonials if none in database
  const defaultTestimonials = [
    {
      id: "1",
      name: "John Smith",
      company: "TechStart Inc.",
      position: "CEO",
      content: "Henry's apps transformed our business operations. The quality and innovation in his work is outstanding!",
      rating: "5.0",
      avatarUrl: null,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: "2",
      name: "Maria Johnson",
      company: "PixelPro",
      position: "Creative Director",
      content: "Working with Henry was a fantastic experience. His attention to detail and technical expertise is unmatched.",
      rating: "5.0",
      avatarUrl: null,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: "3",
      name: "David Lee",
      company: "AppVenture",
      position: "Founder",
      content: "Henry delivered exactly what we needed. Professional, fast, and innovative. Highly recommended!",
      rating: "5.0",
      avatarUrl: null,
      isActive: true,
      createdAt: new Date(),
    },
  ];

  const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;

  return (
    <section id="testimonials" className="min-h-screen py-20 snap-section">
      <div className="container mx-auto px-6">
        <AnimatedHeader 
          text="TESTIMONIALS" 
          className="text-4xl md:text-5xl lg:text-6xl font-black mb-16 text-center text-primary w-full"
          data-testid="testimonials-title"
        />
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayTestimonials.map((testimonial) => (
            <div 
              key={testimonial.id} 
              className="bg-card p-8 rounded-2xl brutalist-shadow"
              data-testid={`testimonial-${testimonial.id}`}
            >
              <div className="flex items-center mb-4">
                <div className="flex text-accent text-xl">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i 
                      key={star} 
                      className={`fas fa-star ${star <= parseFloat(testimonial.rating || "5") ? "" : "opacity-30"}`}
                    ></i>
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground mb-6 italic" data-testid={`testimonial-content-${testimonial.id}`}>
                "{testimonial.content}"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold mr-4">
                  {testimonial.avatarUrl ? (
                    <img src={testimonial.avatarUrl} alt={testimonial.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    testimonial.name.split(' ').map(n => n[0]).join('').toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-foreground" data-testid={`testimonial-name-${testimonial.id}`}>
                    {testimonial.name}
                  </h4>
                  <p className="text-muted-foreground text-sm" data-testid={`testimonial-position-${testimonial.id}`}>
                    {testimonial.position}{testimonial.company && `, ${testimonial.company}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
