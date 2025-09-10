import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import express from "express";
import { storage } from "./storage";
import { insertContactSchema, insertPurchaseSchema } from "@shared/schema";
import { z } from "zod";

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
    })
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all apps
  app.get("/api/apps", async (req, res) => {
    try {
      const { category } = req.query;
      const apps = category && typeof category === 'string' 
        ? await storage.getAppsByCategory(category)
        : await storage.getApps();
      res.json(apps);
    } catch (error) {
      console.error("Error fetching apps:", error);
      res.status(500).json({ message: "Failed to fetch apps" });
    }
  });

  // Get single app
  app.get("/api/apps/:id", async (req, res) => {
    try {
      const app = await storage.getApp(req.params.id);
      if (!app) {
        return res.status(404).json({ message: "App not found" });
      }
      res.json(app);
    } catch (error) {
      console.error("Error fetching app:", error);
      res.status(500).json({ message: "Failed to fetch app" });
    }
  });

  // Get testimonials
  app.get("/api/testimonials", async (req, res) => {
    try {
      const testimonials = await storage.getTestimonials();
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  // Submit contact form
  app.post("/api/contact", async (req, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContactSubmission(contactData);
      
      // TODO: Send email notification via Gmail API
      console.log("New contact submission:", contact);
      
      res.json({ message: "Contact form submitted successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid form data", errors: error.errors });
      }
      console.error("Error submitting contact form:", error);
      res.status(500).json({ message: "Failed to submit contact form" });
    }
  });

  // Create payment intent for app purchase
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Payment system not configured. Please contact support." });
      }

      const { appId, customerEmail, customerName } = req.body;
      
      if (!appId || !customerEmail) {
        return res.status(400).json({ message: "App ID and customer email are required" });
      }

      const app = await storage.getApp(appId);
      if (!app) {
        return res.status(404).json({ message: "App not found" });
      }

      if (!app.price || !app.isPremium) {
        return res.status(400).json({ message: "App is not available for purchase" });
      }

      const amount = Math.round(parseFloat(app.price) * 100); // Convert to cents

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          appId,
          appName: app.name,
          customerEmail,
          customerName: customerName || '',
        },
      });

      // Create purchase record
      await storage.createPurchase({
        appId,
        customerEmail,
        customerName: customerName || null,
        amount: app.price,
        stripePaymentIntentId: paymentIntent.id,
        status: "pending",
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id 
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Stripe webhook for payment completion
  app.post("/api/webhook/stripe", express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Payment system not configured" });
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
      }
      
      event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle payment completion
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      try {
        const purchase = await storage.getPurchaseByPaymentIntent(paymentIntent.id);
        if (purchase) {
          await storage.updatePurchaseStatus(purchase.id, "completed");
          console.log(`Payment completed for purchase: ${purchase.id}`);
          
          // TODO: Send purchase confirmation email
          // TODO: Provide app download/access instructions
        }
      } catch (error) {
        console.error("Error updating purchase status:", error);
      }
    }

    // Handle payment failures
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      try {
        const purchase = await storage.getPurchaseByPaymentIntent(paymentIntent.id);
        if (purchase) {
          await storage.updatePurchaseStatus(purchase.id, "failed");
          console.log(`Payment failed for purchase: ${purchase.id}`);
        }
      } catch (error) {
        console.error("Error updating failed purchase status:", error);
      }
    }

    res.json({ received: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}
