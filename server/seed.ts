#!/usr/bin/env tsx

import { pool, db } from "./db";
import { apps, testimonials } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import type { InsertApp, InsertTestimonial } from "@shared/schema";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Sample apps data - 6 apps across different categories
const sampleApps: InsertApp[] = [
  {
    name: "TaskMaster Pro",
    description: "Advanced project management and task tracking application with team collaboration features",
    longDescription: "TaskMaster Pro is a comprehensive project management solution designed for modern teams. Features include real-time collaboration, advanced reporting, custom workflows, time tracking, and integration with popular development tools. Perfect for agile teams and project managers who need powerful organization capabilities.",
    price: "49.99",
    category: "web",
    imageUrl: "/assets/taskmaster-pro.jpg",
    demoUrl: "https://taskmaster-demo.netlify.app",
    githubUrl: "https://github.com/zigzagapps/taskmaster-pro",
    technologies: ["React", "Node.js", "PostgreSQL", "WebSocket", "TypeScript", "Tailwind CSS"],
    features: [
      "Real-time collaboration",
      "Custom workflows",
      "Time tracking",
      "Advanced reporting",
      "Team management",
      "Integration APIs",
      "Mobile responsive",
      "Dark mode support"
    ],
    isPremium: true,
    isActive: true
  },
  {
    name: "Budget Tracker Mobile",
    description: "Personal finance management app with expense tracking and budget planning",
    longDescription: "Take control of your finances with Budget Tracker Mobile. This intuitive app helps you track expenses, set budgets, and achieve your financial goals. Features include category-based tracking, visual reports, bill reminders, and secure bank account integration.",
    price: "9.99",
    category: "mobile",
    imageUrl: "/assets/budget-tracker.jpg",
    demoUrl: "https://budget-tracker-demo.netlify.app",
    githubUrl: "https://github.com/zigzagapps/budget-tracker-mobile",
    technologies: ["React Native", "SQLite", "Expo", "Chart.js", "Redux"],
    features: [
      "Expense tracking",
      "Budget planning",
      "Visual reports",
      "Bill reminders",
      "Category management",
      "Export data",
      "Offline support",
      "Secure encryption"
    ],
    isPremium: true,
    isActive: true
  },
  {
    name: "CodeSnippet Manager",
    description: "Desktop application for organizing and managing code snippets with syntax highlighting",
    longDescription: "CodeSnippet Manager is a powerful desktop application designed for developers who want to organize their code snippets efficiently. Features include syntax highlighting for 50+ languages, tagging system, search functionality, and cloud synchronization.",
    price: "19.99",
    category: "desktop",
    imageUrl: "/assets/codesnippet-manager.jpg",
    demoUrl: "https://codesnippet-demo.netlify.app",
    githubUrl: "https://github.com/zigzagapps/codesnippet-manager",
    technologies: ["Electron", "React", "Monaco Editor", "SQLite", "TypeScript"],
    features: [
      "Syntax highlighting",
      "Smart search",
      "Tag management",
      "Cloud sync",
      "Import/Export",
      "Snippet sharing",
      "Custom themes",
      "Keyboard shortcuts"
    ],
    isPremium: true,
    isActive: true
  },
  {
    name: "Recipe Finder",
    description: "Discover and save your favorite recipes with ingredient-based search",
    longDescription: "Recipe Finder helps you discover new recipes based on ingredients you have at home. Browse thousands of recipes, save favorites, create shopping lists, and plan your meals for the week. Perfect for home cooks looking to expand their culinary horizons.",
    price: null,
    category: "web",
    imageUrl: "/assets/recipe-finder.jpg",
    demoUrl: "https://recipe-finder-demo.netlify.app",
    githubUrl: "https://github.com/zigzagapps/recipe-finder",
    technologies: ["Vue.js", "Firebase", "Tailwind CSS", "PWA"],
    features: [
      "Ingredient-based search",
      "Recipe bookmarks",
      "Shopping lists",
      "Meal planning",
      "Nutritional info",
      "Recipe ratings",
      "Offline access",
      "Recipe sharing"
    ],
    isPremium: false,
    isActive: true
  },
  {
    name: "Fitness Tracker",
    description: "Mobile fitness and workout tracking app with progress analytics",
    longDescription: "Stay motivated and track your fitness journey with Fitness Tracker. Log workouts, monitor progress, set goals, and get personalized workout recommendations. Includes integration with popular fitness devices and comprehensive analytics.",
    price: null,
    category: "mobile",
    imageUrl: "/assets/fitness-tracker.jpg",
    demoUrl: "https://fitness-tracker-demo.netlify.app",
    githubUrl: "https://github.com/zigzagapps/fitness-tracker",
    technologies: ["Flutter", "Firebase", "SQLite", "Charts"],
    features: [
      "Workout logging",
      "Progress tracking",
      "Goal setting",
      "Exercise library",
      "Progress photos",
      "Workout plans",
      "Social sharing",
      "Device integration"
    ],
    isPremium: false,
    isActive: true
  },
  {
    name: "Data Visualizer Pro",
    description: "Advanced desktop application for creating interactive data visualizations and dashboards",
    longDescription: "Data Visualizer Pro is a powerful desktop application for data analysts and business professionals. Create stunning interactive charts, dashboards, and reports from various data sources. Support for CSV, JSON, databases, and real-time data streams.",
    price: "79.99",
    category: "desktop",
    imageUrl: "/assets/data-visualizer.jpg",
    demoUrl: "https://data-visualizer-demo.netlify.app",
    githubUrl: "https://github.com/zigzagapps/data-visualizer-pro",
    technologies: ["Electron", "D3.js", "React", "Node.js", "Chart.js", "TypeScript"],
    features: [
      "Interactive charts",
      "Dashboard builder",
      "Multiple data sources",
      "Real-time updates",
      "Custom themes",
      "Export options",
      "Collaboration tools",
      "Advanced analytics"
    ],
    isPremium: true,
    isActive: true
  }
];

// Sample testimonials data
const sampleTestimonials: InsertTestimonial[] = [
  {
    name: "Sarah Johnson",
    company: "TechStart Inc.",
    position: "Project Manager",
    content: "The TaskMaster Pro app has revolutionized how our team manages projects. The real-time collaboration features are outstanding, and the custom workflows have increased our productivity by 40%.",
    rating: "5.0",
    avatarUrl: "/assets/testimonial-sarah.jpg",
    isActive: true
  },
  {
    name: "Mike Rodriguez",
    company: "Freelancer",
    position: "Full Stack Developer",
    content: "As a freelancer, I needed something to keep track of my finances. Budget Tracker Mobile is incredibly intuitive and has helped me save over $3000 this year. Highly recommended!",
    rating: "5.0",
    avatarUrl: "/assets/testimonial-mike.jpg",
    isActive: true
  },
  {
    name: "Emily Chen",
    company: "DataCorp Solutions",
    position: "Senior Developer",
    content: "CodeSnippet Manager has become an essential tool in my development workflow. The syntax highlighting and search functionality are top-notch. It's saved me countless hours organizing my code.",
    rating: "5.0",
    avatarUrl: "/assets/testimonial-emily.jpg",
    isActive: true
  },
  {
    name: "David Thompson",
    company: "FoodiePress",
    position: "Content Creator",
    content: "Recipe Finder helped me discover amazing recipes I never would have found otherwise. The ingredient-based search is brilliant, and I love how I can save my favorites for later.",
    rating: "4.8",
    avatarUrl: "/assets/testimonial-david.jpg",
    isActive: true
  },
  {
    name: "Lisa Martinez",
    company: "FitLife Gym",
    position: "Personal Trainer",
    content: "I recommend the Fitness Tracker app to all my clients. The progress tracking and workout logging features help them stay motivated and see real results. Great user experience!",
    rating: "4.9",
    avatarUrl: "/assets/testimonial-lisa.jpg",
    isActive: true
  },
  {
    name: "Robert Kim",
    company: "Analytics Plus",
    position: "Data Analyst",
    content: "Data Visualizer Pro is hands-down the best tool I've used for creating interactive dashboards. The ability to connect multiple data sources and create real-time visualizations is incredible.",
    rating: "5.0",
    avatarUrl: "/assets/testimonial-robert.jpg",
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