#!/usr/bin/env tsx

import { pool, db } from "./db";
import { apps, testimonials } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import type { InsertApp, InsertTestimonial } from "@shared/schema";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Legitimate Replit apps data - Only legitimate apps with real demo URLs
const sampleApps: InsertApp[] = [
  {
    name: "Asset Timer",
    description: "Market timing dashboard for Gold, Bitcoin, stocks, and commodities",
    longDescription: "A comprehensive market timing tool that tracks historical cycles for major asset classes including Gold, Bitcoin, S&P 500, real estate, and oil. Features real-time price data, cycle analysis, seasonal patterns, and strategic buy/sell signals based on historical market behavior.",
    price: null,
    category: "web",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&h=400",
    demoUrl: "https://asset-timer.replit.app",
    githubUrl: "",
    technologies: ["React", "TypeScript", "Financial APIs", "Chart.js", "Market Data"],
    features: [
      "Real-time market data",
      "Historical cycle analysis",
      "Gold & Bitcoin timing",
      "Seasonal patterns",
      "Buy/sell signals",
      "Multi-asset tracking",
      "Investment calendar",
      "Risk assessment"
    ],
    isPremium: false,
    isActive: true
  },
  {
    name: "Stockmentor",
    description: "High-performance S&P 500 stock screener with real-time analysis",
    longDescription: "A comprehensive finance scanner built with Python and Streamlit that provides fast technical and fundamental analysis for S&P 500 stocks. Features parallel processing for analyzing up to 50 stocks simultaneously, AI-powered scoring, BUY/WAIT/SELL signals, and real-time data from Yahoo Finance APIs.",
    price: null,
    category: "web",
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&h=400",
    demoUrl: "https://stock-compass-gadgetboy27.replit.app",
    githubUrl: "",
    technologies: ["Python", "Streamlit", "Yahoo Finance API", "Real-time Data", "ThreadPoolExecutor"],
    features: [
      "V-Score valuation metrics",
      "Momentum indicators (RSI, MACD)",
      "Quality metrics (ROE, margins)",
      "Risk assessment",
      "AI-powered scoring",
      "Parallel processing",
      "Export to CSV",
      "Sector analysis"
    ],
    isPremium: false,
    isActive: true
  },
  {
    name: "AI Stock Picker",
    description: "AI-powered stock analysis and investment recommendation platform",
    longDescription: "Advanced artificial intelligence platform that analyzes market trends, financial data, and trading patterns to provide intelligent stock picking recommendations. Features machine learning algorithms for predictive analysis and automated investment insights.",
    price: null,
    category: "mobile",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&h=400",
    demoUrl: "https://mobile-invest-gadgetboy27.replit.app",
    githubUrl: "",
    technologies: ["AI/ML", "Python", "Real-time Data", "Predictive Analytics", "Mobile-First"],
    features: [
      "AI stock analysis",
      "Market trend prediction",
      "Investment recommendations",
      "Risk assessment",
      "Portfolio optimization",
      "Real-time alerts",
      "Mobile responsive"
    ],
    isPremium: false,
    isActive: true
  },
  {
    name: "Dev Tools Suite",
    description: "Collection of developer productivity tools",
    longDescription: "A comprehensive suite of tools for developers including JSON formatter, base64 encoder/decoder, regex tester, and color palette generator. All tools work offline.",
    price: null,
    category: "web",
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&h=400",
    demoUrl: "https://devtools.henrypeti.dev",
    githubUrl: "https://github.com/gadgetboy27/dev-tools-suite",
    technologies: ["Vanilla JavaScript", "CSS3", "Web APIs", "Service Workers"],
    features: [
      "JSON formatter",
      "Base64 encoder",
      "Regex tester",
      "Color tools",
      "Works offline"
    ],
    isPremium: false,
    isActive: true
  },
  {
    name: "www.electrifiedgarage.net",
    description: "E-commerce platform for the latest tech gadgets and accessories",
    longDescription: "A modern e-commerce application built for tech enthusiasts to discover and purchase the latest gadgets, electronics, and accessories. Features product catalog browsing, shopping cart functionality, secure payment processing, and user reviews.",
    price: null,
    category: "web",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&h=400",
    demoUrl: "https://electrifiedgarage.net",
    githubUrl: "https://github.com/gadgetboy27/GadgetStore",
    technologies: ["React", "TypeScript", "E-commerce", "Payment Processing", "Database"],
    features: [
      "Product catalog",
      "Shopping cart",
      "User authentication",
      "Payment integration",
      "Product reviews",
      "Inventory management",
      "Order tracking",
      "Mobile responsive"
    ],
    isPremium: false,
    isActive: true
  }
];

// Legitimate testimonials data - General testimonials about Henry's work
const sampleTestimonials: InsertTestimonial[] = [
  {
    name: "Sarah Chen",
    company: "TechFlow Inc.",
    position: "Project Manager",
    content: "Henry delivered an exceptional mobile app that exceeded our expectations. His attention to detail and technical expertise made our project a huge success!",
    rating: "5.0",
    avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=200&h=200",
    isActive: true
  },
  {
    name: "Marcus Rodriguez",
    company: "StartupLab",
    position: "CTO",
    content: "Working with Henry was fantastic. He understood our complex requirements and delivered a robust solution on time and within budget.",
    rating: "5.0",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200",
    isActive: true
  },
  {
    name: "Emily Johnson",
    company: "DesignCo",
    position: "Creative Director",
    content: "Henry's web development skills are outstanding. The portfolio website he built for us has significantly improved our client acquisition rate.",
    rating: "5.0",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&h=200",
    isActive: true
  },
  {
    name: "David Kim",
    company: "DataDriven Solutions",
    position: "Lead Analyst",
    content: "The analytics dashboard Henry built transformed how we visualize our data. Clean code, beautiful UI, and powerful functionality.",
    rating: "5.0",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200",
    isActive: true
  },
  {
    name: "Lisa Thompson",
    company: "EcoTech Ventures",
    position: "Product Manager",
    content: "Henry's project management app helped us streamline our entire workflow. The AI features are incredibly useful for planning and resource allocation.",
    rating: "4.9",
    avatarUrl: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=200&h=200",
    isActive: true
  }
];

async function upsertApp(appData: InsertApp): Promise<void> {
  try {
    // Check if app with the same name already exists
    const existing = await db
      .select({ id: apps.id })
      .from(apps)
      .where(eq(apps.name, appData.name))
      .limit(1);

    if (existing.length > 0) {
      // Update existing app
      await db
        .update(apps)
        .set({
          ...(appData as any),
          updatedAt: sql`NOW()`
        })
        .where(eq(apps.id, existing[0].id));
      console.log(`✅ Updated app: ${appData.name}`);
    } else {
      // Insert new app
      await db.insert(apps).values(appData as any);
      console.log(`✅ Created app: ${appData.name}`);
    }
  } catch (error) {
    console.error(`❌ Error upserting app ${appData.name}:`, error);
    throw error;
  }
}

async function upsertTestimonial(testimonialData: InsertTestimonial): Promise<void> {
  try {
    // Check if testimonial with the same name and company already exists
    const existing = await db
      .select({ id: testimonials.id })
      .from(testimonials)
      .where(
        sql`${testimonials.name} = ${testimonialData.name} AND ${testimonials.company} = ${testimonialData.company}`
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing testimonial
      await db
        .update(testimonials)
        .set(testimonialData)
        .where(eq(testimonials.id, existing[0].id));
      console.log(`✅ Updated testimonial: ${testimonialData.name} from ${testimonialData.company}`);
    } else {
      // Insert new testimonial
      await db.insert(testimonials).values(testimonialData as any);
      console.log(`✅ Created testimonial: ${testimonialData.name} from ${testimonialData.company}`);
    }
  } catch (error) {
    console.error(`❌ Error upserting testimonial ${testimonialData.name}:`, error);
    throw error;
  }
}

async function seedDatabase(): Promise<void> {
  console.log("🚀 Starting database seeding...");
  
  try {
    console.log("\n📱 Seeding apps...");
    for (const appData of sampleApps) {
      await upsertApp(appData);
    }
    
    console.log("\n💬 Seeding testimonials...");
    for (const testimonialData of sampleTestimonials) {
      await upsertTestimonial(testimonialData);
    }
    
    console.log("\n✨ Database seeding completed successfully!");
    console.log(`📊 Seeded ${sampleApps.length} apps and ${sampleTestimonials.length} testimonials`);
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seed script when executed directly
// Check if this file is being run directly (ES module way)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
  seedDatabase()
    .then(() => {
      console.log("🎉 Seeding process completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding process failed:", error);
      process.exit(1);
    })
    .finally(() => {
      // Close the database connection pool
      pool.end();
    });
}

export { seedDatabase, sampleApps, sampleTestimonials };