import { useState, useEffect, useRef } from "react";

interface AnimatedHeaderProps {
  text: string;
  className?: string;
  delay?: number;
  "data-testid"?: string;
}

export default function AnimatedHeader({ 
  text, 
  className = "", 
  delay = 10000,
  "data-testid": dataTestId 
}: AnimatedHeaderProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const headerRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (headerRef.current) {
      observer.observe(headerRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!isVisible || hasAnimated) return;

    const startTyping = () => {
      setDisplayedText("");
      let currentIndex = 0;
      const timer = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(timer);
          setHasAnimated(true);
        }
      }, 100);
      return timer;
    };

    // Start typing after a small delay
    const timeoutId = setTimeout(() => {
      startTyping();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [isVisible, text, hasAnimated]);

  return (
    <h2 
      ref={headerRef} 
      className={className} 
      data-testid={dataTestId}
    >
      {hasAnimated ? text : displayedText}
      {!hasAnimated && isVisible && <span className="animate-pulse text-primary">|</span>}
    </h2>
  );
}