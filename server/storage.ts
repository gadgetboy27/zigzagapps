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

export const storage = new DatabaseStorage();
