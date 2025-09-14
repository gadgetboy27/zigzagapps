import { 
  apps, 
  testimonials, 
  contactSubmissions, 
  purchases,
  type App, 
  type InsertApp,
  type Testimonial,
  type InsertTestimonial,
  type ContactSubmission,
  type InsertContact,
  type Purchase,
  type InsertPurchase 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
