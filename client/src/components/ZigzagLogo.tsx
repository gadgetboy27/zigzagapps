import React from "react";
import { useTheme } from "@/contexts/theme-context";

interface ZigzagLogoProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

export function ZigzagLogo({ size = "medium", className = "" }: ZigzagLogoProps) {
  const { theme } = useTheme();
  
  // Size configurations
  const sizeConfig = {
    small: { width: 120, height: 32, fontSize: 14, zigzagScale: 0.7 },
    medium: { width: 180, height: 48, fontSize: 18, zigzagScale: 1 },
    large: { width: 240, height: 64, fontSize: 24, zigzagScale: 1.3 }
  };

  const config = sizeConfig[size];

  // Theme-aware colors
  const getColors = () => {
    switch (theme) {
      case "dark":
        return {
          primary: "#ef4444", // red-500
          secondary: "#ffffff", // white
          accent: "#fbbf24", // amber-400
          glow: "#ef444420" // red with opacity
        };
      case "blue": 
        return {
          primary: "#3b82f6", // blue-500
          secondary: "#ffffff", // white  
          accent: "#06b6d4", // cyan-500
          glow: "#3b82f620" // blue with opacity
        };
      default: // light theme
        return {
          primary: "#1f2937", // gray-800
          secondary: "#374151", // gray-700
          accent: "#ef4444", // red-500
          glow: "#1f293720" // gray with opacity
        };
    }
  };

  const colors = getColors();

  return (
    <svg
      width={config.width}
      height={config.height}
      viewBox={`0 0 ${config.width} ${config.height}`}
      className={`zigzag-logo ${className}`}
      style={{ 
        filter: theme === "dark" || theme === "blue" ? `drop-shadow(0 0 8px ${colors.glow})` : "none"
      }}
    >
      <defs>
        <linearGradient id={`zigzag-gradient-${theme}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.primary} />
          <stop offset="50%" stopColor={colors.accent} />
          <stop offset="100%" stopColor={colors.primary} />
        </linearGradient>
        
        <linearGradient id={`apps-gradient-${theme}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.secondary} />
          <stop offset="100%" stopColor={colors.secondary} stopOpacity={0.8} />
        </linearGradient>
      </defs>

      {/* ZIGZAG part with custom zigzag pattern */}
      <g transform={`scale(${config.zigzagScale})`}>
        {/* Z letter with zigzag styling */}
        <path
          d={`
            M10 8
            L35 8
            L15 24
            L35 24
            L35 28
            L10 28
            L30 12
            L10 12
            Z
          `}
          fill={`url(#zigzag-gradient-${theme})`}
          className="transition-all duration-300"
        />
        
        {/* I letter */}
        <rect
          x="42"
          y="8"
          width="4"
          height="20"
          fill={`url(#zigzag-gradient-${theme})`}
          className="transition-all duration-300"
        />
        
        {/* G letter with gap */}
        <path
          d={`
            M50 8
            C50 8 65 8 65 8
            C65 8 65 12 65 12
            C65 12 58 12 58 12
            C58 12 58 16 58 16
            C58 16 63 16 63 16
            C63 16 63 20 63 20
            C63 20 58 20 58 20
            C58 20 58 24 58 24
            C58 24 65 24 65 24
            C65 24 65 28 65 28
            C65 28 50 28 50 28
            C50 28 50 8 50 8
            Z
          `}
          fill={`url(#zigzag-gradient-${theme})`}
          className="transition-all duration-300"
        />
        
        {/* Second Z with different styling */}
        <path
          d={`
            M72 8
            L97 8
            L77 24
            L97 24
            L97 28
            L72 28
            L92 12
            L72 12
            Z
          `}
          fill={`url(#zigzag-gradient-${theme})`}
          className="transition-all duration-300"
        />
        
        {/* A letter */}
        <path
          d={`
            M104 28
            L104 20
            L112 20
            L112 28
            L116 28
            L116 8
            L108 8
            L100 28
            Z
            M106 16
            L110 16
            L110 12
            L106 12
            Z
          `}
          fill={`url(#zigzag-gradient-${theme})`}
          className="transition-all duration-300"
        />
        
        {/* G letter */}
        <path
          d={`
            M120 8
            C120 8 135 8 135 8
            C135 8 135 12 135 12
            C135 12 128 12 128 12
            C128 12 128 16 128 16
            C128 16 133 16 133 16
            C133 16 133 20 133 20
            C133 20 128 20 128 20
            C128 20 128 24 128 24
            C128 24 135 24 135 24
            C135 24 135 28 135 28
            C135 28 120 28 120 28
            C120 28 120 8 120 8
            Z
          `}
          fill={`url(#zigzag-gradient-${theme})`}
          className="transition-all duration-300"
        />
      </g>

      {/* APPS text */}
      <text
        x={config.width * 0.15}
        y={config.height * 0.85}
        fontSize={config.fontSize}
        fontFamily="JetBrains Mono, monospace"
        fontWeight="600"
        fill={`url(#apps-gradient-${theme})`}
        className="transition-all duration-300"
        letterSpacing="0.1em"
      >
        APPS
      </text>

      {/* Decorative zigzag underline */}
      <path
        d={`
          M${config.width * 0.15} ${config.height * 0.9}
          L${config.width * 0.25} ${config.height * 0.95}
          L${config.width * 0.35} ${config.height * 0.9}
          L${config.width * 0.45} ${config.height * 0.95}
          L${config.width * 0.55} ${config.height * 0.9}
        `}
        stroke={colors.accent}
        strokeWidth="2"
        fill="none"
        className="transition-all duration-300"
        opacity="0.7"
      />
    </svg>
  );
}

export default ZigzagLogo;