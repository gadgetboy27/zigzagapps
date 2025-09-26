import { 
  apps, 
  testimonials, 
  contactSubmissions, 
  purchases,
  demoSessions,
  type App, 
  type InsertApp,
  type Testimonial,
  type InsertTestimonial,
  type ContactSubmission,
  type InsertContact,
  type Purchase,
  type InsertPurchase,
  type DemoSession,
  type InsertDemoSession
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lt, count } from "drizzle-orm";

export interface IStorage {
  // Apps
  getApps(): Promise<App[]>;
  getAppsByCategory(category: string): Promise<App[]>;
  getApp(id: string): Promise<App | undefined>;
  createApp(app: InsertApp): Promise<App>;
  
  // Testimonials
  getTestimonials(): Promise<Testimonial[]>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  
  // Contact
  createContactSubmission(contact: InsertContact): Promise<ContactSubmission>;
  
  // Purchases
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  getPurchaseByPaymentIntent(paymentIntentId: string): Promise<Purchase | undefined>;
  updatePurchaseStatus(id: string, status: string): Promise<Purchase>;
  getPurchaseWithApp(id: string): Promise<(Purchase & { app: App }) | undefined>;
  
  // Demo Sessions
  createDemoSession(session: InsertDemoSession): Promise<DemoSession>;
  getDemoSessionByToken(token: string): Promise<DemoSession | undefined>;
  validateDemoSession(token: string, requestIp?: string, requestUserAgent?: string): Promise<{ valid: boolean; session?: DemoSession; app?: App; error?: string }>;
  getActiveDemoSessionsCountByIpAndApp(ipAddress: string, appId: string): Promise<number>;
  getDemoSessionsCountByIpAndAppToday(ipAddress: string, appId: string): Promise<number>;
  deactivateDemoSession(id: string): Promise<void>;
  cleanupExpiredDemoSessions(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getApps(): Promise<App[]> {
    return await db.select().from(apps).where(eq(apps.isActive, true)).orderBy(desc(apps.createdAt));
  }

  async getAppsByCategory(category: string): Promise<App[]> {
    return await db.select().from(apps)
      .where(eq(apps.category, category))
      .orderBy(desc(apps.createdAt));
  }

  async getApp(id: string): Promise<App | undefined> {
    const [app] = await db.select().from(apps).where(eq(apps.id, id));
    return app;
  }

  async createApp(appData: InsertApp): Promise<App> {
    const [app] = await db.insert(apps).values(appData as any).returning();
    return app;
  }

  async getTestimonials(): Promise<Testimonial[]> {
    return await db.select().from(testimonials)
      .where(eq(testimonials.isActive, true))
      .orderBy(desc(testimonials.createdAt));
  }

  async createTestimonial(testimonialData: InsertTestimonial): Promise<Testimonial> {
    const [testimonial] = await db.insert(testimonials).values(testimonialData as any).returning();
    return testimonial;
  }

  async createContactSubmission(contactData: InsertContact): Promise<ContactSubmission> {
    const [contact] = await db.insert(contactSubmissions).values(contactData as any).returning();
    return contact;
  }

  async createPurchase(purchaseData: InsertPurchase): Promise<Purchase> {
    const [purchase] = await db.insert(purchases).values(purchaseData as any).returning();
    return purchase;
  }

  async getPurchaseByPaymentIntent(paymentIntentId: string): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases)
      .where(eq(purchases.stripePaymentIntentId, paymentIntentId));
    return purchase;
  }

  async updatePurchaseStatus(id: string, status: string): Promise<Purchase> {
    const [purchase] = await db.update(purchases)
      .set({ status })
      .where(eq(purchases.id, id))
      .returning();
    return purchase;
  }

  async getPurchaseWithApp(id: string): Promise<(Purchase & { app: App }) | undefined> {
    const result = await db.select({
      purchase: purchases,
      app: apps
    })
    .from(purchases)
    .innerJoin(apps, eq(purchases.appId, apps.id))
    .where(eq(purchases.id, id));
    
    if (result.length === 0) return undefined;
    
    return {
      ...result[0].purchase,
      app: result[0].app
    };
  }

  // Demo Sessions
  async createDemoSession(sessionData: InsertDemoSession): Promise<DemoSession> {
    const [session] = await db.insert(demoSessions).values(sessionData as any).returning();
    return session;
  }

  async getDemoSessionByToken(token: string): Promise<DemoSession | undefined> {
    const [session] = await db.select().from(demoSessions)
      .where(eq(demoSessions.sessionToken, token));
    return session;
  }

  async validateDemoSession(token: string, requestIp?: string, requestUserAgent?: string): Promise<{ valid: boolean; session?: DemoSession; app?: App; error?: string }> {
    const result = await db.select({
      session: demoSessions,
      app: apps
    })
    .from(demoSessions)
    .innerJoin(apps, eq(demoSessions.appId, apps.id))
    .where(eq(demoSessions.sessionToken, token));

    if (result.length === 0) {
      return { valid: false, error: 'Session not found' };
    }

    const { session, app } = result[0];
    const now = new Date();
    const endTime = new Date(session.endTime);

    // Check if session is active and not expired
    if (!session.isActive || now > endTime) {
      return { valid: false, session, app, error: 'Session expired' };
    }

    // Enhanced security: Check IP binding
    if (requestIp && session.ipAddress !== requestIp) {
      return { valid: false, session, app, error: 'IP address mismatch - session cannot be shared' };
    }

    // Optional: Check User-Agent binding for additional security
    if (requestUserAgent && session.userAgent && session.userAgent !== requestUserAgent) {
      return { valid: false, session, app, error: 'Session security violation - please request a new demo' };
    }

    return { valid: true, session, app };
  }

  async getActiveDemoSessionsCountByIpAndApp(ipAddress: string, appId: string): Promise<number> {
    const now = new Date();
    const [result] = await db.select({ count: count() })
      .from(demoSessions)
      .where(
        and(
          eq(demoSessions.ipAddress, ipAddress),
          eq(demoSessions.appId, appId),
          eq(demoSessions.isActive, true),
          gte(demoSessions.endTime, now)
        )
      );
    return result?.count || 0;
  }

  async getDemoSessionsCountByIpAndAppToday(ipAddress: string, appId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [result] = await db.select({ count: count() })
      .from(demoSessions)
      .where(
        and(
          eq(demoSessions.ipAddress, ipAddress),
          eq(demoSessions.appId, appId),
          gte(demoSessions.createdAt, startOfDay),
          lt(demoSessions.createdAt, endOfDay)
        )
      );
    return result?.count || 0;
  }

  async deactivateDemoSession(id: string): Promise<void> {
    await db.update(demoSessions)
      .set({ isActive: false })
      .where(eq(demoSessions.id, id));
  }

  async cleanupExpiredDemoSessions(): Promise<number> {
    const now = new Date();
    const result = await db.update(demoSessions)
      .set({ isActive: false })
      .where(
        and(
          eq(demoSessions.isActive, true),
          lt(demoSessions.endTime, now)
        )
      )
      .returning({ id: demoSessions.id });
    
    return result.length;
  }
}

// DatabaseStorage disabled due to persistent Neon endpoint issue
// export const storage = new DatabaseStorage();

// Working MemStorage with proper demo session support
class MemStorage implements IStorage {
  private demoSessions: DemoSession[] = [];
  private apps: App[] = [
    {
      id: "9aa868f3-75eb-4347-8c16-57d2db73a890",
      name: "Harikoa Kainga", 
      description: "Revolutionary real estate platform transforming property discovery and management with cutting-edge technology.",
      longDescription: "Harikoa Kainga represents the pinnacle of real estate technology innovation. This sophisticated platform revolutionizes how users discover, analyze, and manage properties through an intuitive interface powered by modern web technologies. Built with React 18, TypeScript, and Next.js for blazing-fast performance, the application leverages PostgreSQL for robust data management and integrates advanced APIs for real-time property data. The platform features responsive design principles, state-of-the-art UI/UX patterns, and scalable architecture designed for enterprise-level deployment. With comprehensive property analytics, automated workflows, and intelligent search capabilities, this solution delivers unparalleled value for real estate professionals and property investors. The codebase demonstrates expert-level software engineering practices, including type safety, component modularity, and performance optimization. This is not just an application—it's a complete real estate technology solution ready for immediate commercial deployment.",
      price: "150000.00",
      category: "web",
      imageUrl: "https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?auto=format&fit=crop&w=800&h=400",
      demoUrl: null,
      githubUrl: null,
      technologies: ["React 18","TypeScript","Next.js","PostgreSQL","Node.js","Express.js","Tailwind CSS","Drizzle ORM","RESTful APIs","Responsive Design","Modern Web Architecture"],
      features: ["Advanced Property Search","Real-time Data Integration","Interactive Property Analytics","Responsive Mobile Design","Enterprise-Grade Security","Scalable Architecture","Modern UI/UX Design","API Integration Ready","Database Optimization","Professional Codebase","Commercial Deployment Ready","Complete Documentation"],
      isPremium: true,
      isActive: true,
      createdAt: new Date("2025-09-18T13:11:20.717Z"),
      updatedAt: new Date("2025-09-18T13:11:20.717Z")
    },
    {
      id: "58a9d02e-bc18-4350-ae8f-2df3b743f44c",
      name: "Asset Timer",
      description: "Market timing dashboard for Gold, Bitcoin, stocks, and commodities",
      longDescription: "A comprehensive market timing tool that tracks historical cycles for major asset classes including Gold, Bitcoin, S&P 500, real estate, and oil. Features real-time price data, cycle analysis, seasonal patterns, and strategic buy/sell signals based on historical market behavior.",
      price: "49.99",
      category: "web",
      imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&h=400",
      demoUrl: "https://asset-timer.replit.app",
      githubUrl: "",
      technologies: ["React","TypeScript","Financial APIs","Chart.js","Market Data"],
      features: ["Real-time market data","Historical cycle analysis","Gold & Bitcoin timing","Seasonal patterns","Buy/sell signals","Multi-asset tracking","Investment calendar","Risk assessment"],
      isPremium: true,
      isActive: true,
      createdAt: new Date("2025-09-16T04:04:23.083Z"),
      updatedAt: new Date("2025-09-18T18:59:55.286Z")
    },
    {
      id: "0d2456ca-3c8a-43cc-b8e8-587ec0755cb5",
      name: "www.electrifiedgarage.net",
      description: "E-commerce platform for the latest tech gadgets and accessories",
      longDescription: "A modern e-commerce application built for tech enthusiasts to discover and purchase the latest gadgets, electronics, and accessories. Features product catalog browsing, shopping cart functionality, secure payment processing, and user reviews.",
      price: null,
      category: "web",
      imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&h=400",
      demoUrl: "https://electrifiedgarage.net",
      githubUrl: "https://github.com/gadgetboy27/GadgetStore",
      technologies: ["React","TypeScript","E-commerce","Payment Processing","Database"],
      features: ["Product catalog","Shopping cart","User authentication","Payment integration","Product reviews","Inventory management","Order tracking","Mobile responsive"],
      isPremium: false,
      isActive: true,
      createdAt: new Date("2025-09-16T04:00:00.000Z"),
      updatedAt: new Date("2025-09-18T18:59:55.477Z")
    },
    {
      id: "7d7bd30c-97e8-44b3-a7aa-d6c90338b998",
      name: "Stockmentor",
      description: "High-performance S&P 500 stock screener with real-time analysis",
      longDescription: "A comprehensive finance scanner built with Python and Streamlit that provides fast technical and fundamental analysis for S&P 500 stocks. Features parallel processing for analyzing up to 50 stocks simultaneously, AI-powered scoring, BUY/WAIT/SELL signals, and real-time data from Yahoo Finance APIs.",
      price: "79.99",
      category: "web",
      imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&h=400",
      demoUrl: "https://stock-compass-gadgetboy27.replit.app",
      githubUrl: "",
      technologies: ["Python","Streamlit","Yahoo Finance API","Real-time Data","ThreadPoolExecutor"],
      features: ["V-Score valuation metrics","Momentum indicators (RSI, MACD)","Quality metrics (ROE, margins)","Risk assessment","AI-powered scoring","Parallel processing","Export to CSV","Sector analysis"],
      isPremium: true,
      isActive: true,
      createdAt: new Date("2025-09-10T12:58:56.496Z"),
      updatedAt: new Date("2025-09-18T18:59:55.339Z")
    },
    {
      id: "b5b06f6b-21ca-4e4d-a67c-a2923535855d",
      name: "AI Stock Picker",
      description: "AI-powered stock analysis and investment recommendation platform",
      longDescription: "Advanced artificial intelligence platform that analyzes market trends, financial data, and trading patterns to provide intelligent stock picking recommendations. Features machine learning algorithms for predictive analysis and automated investment insights.",
      price: "99.99",
      category: "mobile",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&h=400",
      demoUrl: "https://mobile-invest-gadgetboy27.replit.app",
      githubUrl: "",
      technologies: ["AI/ML","Python","Real-time Data","Predictive Analytics","Mobile-First"],
      features: ["AI stock analysis","Market trend prediction","Investment recommendations","Risk assessment","Portfolio optimization","Real-time alerts","Mobile responsive"],
      isPremium: true,
      isActive: true,
      createdAt: new Date("2025-09-10T12:58:56.496Z"),
      updatedAt: new Date("2025-09-18T18:59:55.385Z")
    },
    {
      id: "5dbb9b07-c8b7-4a8b-b5be-88019be4f77c",
      name: "Dev Tools Suite",
      description: "Collection of developer productivity tools",
      longDescription: "A comprehensive suite of tools for developers including JSON formatter, base64 encoder/decoder, regex tester, and color palette generator. All tools work offline.",
      price: null,
      category: "web",
      imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&h=400",
      demoUrl: "https://devtools.henrypeti.dev",
      githubUrl: "https://github.com/gadgetboy27/dev-tools-suite",
      technologies: ["Vanilla JavaScript","CSS3","Web APIs","Service Workers"],
      features: ["JSON formatter","Base64 encoder","Regex tester","Color tools","Works offline"],
      isPremium: false,
      isActive: true,
      createdAt: new Date("2025-09-10T12:58:56.496Z"),
      updatedAt: new Date("2025-09-18T18:59:55.429Z")
    }
  ];

  private testimonials: Testimonial[] = [
    {
      id: "1102baab-61d1-469a-b1ed-b728287d5556",
      name: "Sarah Chen",
      role: "Project Manager",
      company: "TechFlow Inc.",
      content: "Henry delivered an exceptional mobile app that exceeded our expectations. His attention to detail and technical expertise made our project a huge success!",
      imageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=200&h=200",
      isActive: true,
      createdAt: new Date("2025-09-15T10:30:00.000Z"),
      updatedAt: new Date("2025-09-15T10:30:00.000Z")
    },
    {
      id: "2203baab-71d1-469a-b1ed-b728287d5557",
      name: "Marcus Rodriguez", 
      role: "CTO",
      company: "StartupLab",
      content: "Working with Henry was fantastic. He understood our complex requirements and delivered a robust solution on time and within budget.",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200",
      isActive: true,
      createdAt: "2025-09-14T15:45:00.000Z",
      updatedAt: "2025-09-14T15:45:00.000Z"
    },
    {
      id: "3304baab-81d1-469a-b1ed-b728287d5558",
      name: "Emily Johnson",
      role: "Creative Director",
      company: "DesignCo",
      content: "Henry's web development skills are outstanding. The portfolio website he built for us has significantly improved our client acquisition rate.",
      imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&h=200",
      isActive: true,
      createdAt: "2025-09-13T09:20:00.000Z",
      updatedAt: "2025-09-13T09:20:00.000Z"
    },
    {
      id: "4405baab-91d1-469a-b1ed-b728287d5559",
      name: "David Kim",
      role: "Lead Analyst",
      company: "DataDriven Solutions",
      content: "The analytics dashboard Henry built transformed how we visualize our data. Clean code, beautiful UI, and powerful functionality.",
      imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200",
      isActive: true,
      createdAt: "2025-09-12T14:10:00.000Z",
      updatedAt: "2025-09-12T14:10:00.000Z"
    },
    {
      id: "5506baab-a1d1-469a-b1ed-b728287d5560",
      name: "Lisa Thompson",
      role: "Product Manager",
      company: "EcoTech Ventures",
      content: "Henry's project management app helped us streamline our entire workflow. The AI features are incredibly useful for planning and resource allocation.",
      imageUrl: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=200&h=200",
      isActive: true,
      createdAt: "2025-09-11T11:55:00.000Z",
      updatedAt: "2025-09-11T11:55:00.000Z"
    }
  ];

  // Apps methods
  async getApps(): Promise<App[]> {
    return this.apps.filter(app => app.isActive);
  }

  async getAppsByCategory(category: string): Promise<App[]> {
    return this.apps.filter(app => app.category === category && app.isActive);
  }

  async getApp(id: string): Promise<App | undefined> {
    return this.apps.find(app => app.id === id);
  }

  async createApp(appData: InsertApp): Promise<App> {
    const app: App = {
      id: crypto.randomUUID(),
      ...appData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as App;
    this.apps.push(app);
    return app;
  }

  // Testimonials methods
  async getTestimonials(): Promise<Testimonial[]> {
    return this.testimonials.filter(t => t.isActive);
  }

  async createTestimonial(testimonialData: InsertTestimonial): Promise<Testimonial> {
    const testimonial: Testimonial = {
      id: crypto.randomUUID(),
      ...testimonialData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Testimonial;
    this.testimonials.push(testimonial);
    return testimonial;
  }

  // Minimal implementations for other methods (demo will be limited)
  async createContactSubmission(contactData: InsertContact): Promise<ContactSubmission> {
    return {
      id: crypto.randomUUID(),
      ...contactData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as ContactSubmission;
  }

  async createPurchase(purchaseData: InsertPurchase): Promise<Purchase> {
    return {
      id: crypto.randomUUID(),
      ...purchaseData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Purchase;
  }

  async getPurchaseByPaymentIntent(paymentIntentId: string): Promise<Purchase | undefined> {
    return undefined; // Simplified for demo
  }

  async updatePurchaseStatus(id: string, status: string): Promise<Purchase> {
    throw new Error("Not implemented in MemStorage");
  }

  async getPurchaseWithApp(id: string): Promise<(Purchase & { app: App }) | undefined> {
    return undefined; // Simplified for demo
  }

  // Demo session methods (working implementation)
  async createDemoSession(sessionData: InsertDemoSession): Promise<DemoSession> {
    const session: DemoSession = {
      id: crypto.randomUUID(),
      ...sessionData,
      createdAt: new Date()
    } as DemoSession;
    this.demoSessions.push(session);
    return session;
  }

  async getDemoSessionByToken(token: string): Promise<DemoSession | undefined> {
    return this.demoSessions.find(s => s.sessionToken === token);
  }

  async validateDemoSession(token: string, requestIp?: string, requestUserAgent?: string): Promise<{ valid: boolean; session?: DemoSession; app?: App; error?: string }> {
    const session = this.demoSessions.find(s => s.sessionToken === token);
    
    if (!session) {
      return { valid: false, error: 'Session not found' };
    }

    const app = this.apps.find(a => a.id === session.appId);
    const now = new Date();
    const endTime = new Date(session.endTime);

    // Check if session is active and not expired
    if (!session.isActive || now > endTime) {
      return { valid: false, session, app, error: 'Session expired' };
    }

    // Enhanced security: Check IP binding
    if (requestIp && session.ipAddress !== requestIp) {
      return { valid: false, session, app, error: 'IP address mismatch - session cannot be shared' };
    }

    return { valid: true, session, app };
  }

  async getActiveDemoSessionsCountByIpAndApp(ipAddress: string, appId: string): Promise<number> {
    const now = new Date();
    return this.demoSessions.filter(s => 
      s.ipAddress === ipAddress && 
      s.appId === appId && 
      s.isActive && 
      new Date(s.endTime) >= now
    ).length;
  }

  async getDemoSessionsCountByIpAndAppToday(ipAddress: string, appId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.demoSessions.filter(s => 
      s.ipAddress === ipAddress && 
      s.appId === appId &&
      new Date(s.createdAt) >= startOfDay && 
      new Date(s.createdAt) <= endOfDay
    ).length;
  }

  async deactivateDemoSession(id: string): Promise<void> {
    const session = this.demoSessions.find(s => s.id === id);
    if (session) {
      session.isActive = false;
    }
  }

  async cleanupExpiredDemoSessions(): Promise<number> {
    const now = new Date();
    const expiredCount = this.demoSessions.filter(s => new Date(s.endTime) < now).length;
    this.demoSessions = this.demoSessions.filter(s => new Date(s.endTime) >= now);
    return expiredCount;
  }
}

export const storage = new MemStorage();
