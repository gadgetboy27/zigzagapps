import React from "react";
import { useScrollSpy } from "@/hooks/use-scroll-spy";

const sections = [
  { id: "hero", label: "Hero" },
  { id: "about", label: "About" },
  { id: "apps", label: "Apps" },
  { id: "store", label: "Store" },
  { id: "testimonials", label: "Testimonials" },
  { id: "contact", label: "Contact" },
];

export default function NavigationDots() {
  const activeSection = useScrollSpy(sections.map(s => s.id));

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="nav-indicator hidden lg:block">
      {sections.map((section) => (
        <div
          key={section.id}
          className={`nav-dot ${activeSection === section.id ? "active" : ""}`}
          onClick={() => scrollToSection(section.id)}
          title={section.label}
          data-testid={`nav-dot-${section.id}`}
        />
      ))}
    </div>
  );
}
