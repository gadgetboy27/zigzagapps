import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import express from "express";
import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import validator from "validator";
import { storage } from "./storage";
import { insertContactSchema, insertPurchaseSchema } from "@shared/schema";
import { z } from "zod";

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
    })
  : null;

// Gmail transporter setup
const transporter = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD 
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Configure trust proxy for rate limiting in production
  app.set('trust proxy', 1);
  
  // CORS configuration for Netlify deployment
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'http://localhost:5173', // Vite dev server
      'http://localhost:4173', // Vite preview
      'http://localhost:5000', // Local production
    ];
    
    // Add Netlify domains from environment variable
    const netlifyDomains = process.env.ALLOWED_NETLIFY_ORIGINS?.split(',') || [];
    allowedOrigins.push(...netlifyDomains);
    
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    next();
  });
  
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "ws:", "wss:", "https://api.stripe.com"],
      },
    },
  }));

  // Rate limiting for contact form
  const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 contact form submissions per windowMs
    message: {
      error: "Too many contact form submissions, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // General API rate limiter
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: "Too many requests, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiting to all API routes
  app.use('/api/', apiLimiter);
  
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

  // Submit contact form with security measures
  app.post("/api/contact", contactLimiter, async (req, res) => {
    try {
      // Check for honeypot field (bot detection)
      if (req.body.website || req.body.url) {
        return res.status(400).json({ message: "Invalid form submission" });
      }

      // Enhanced validation with sanitization
      const contactData = {
        name: validator.escape(req.body.name || '').trim(),
        email: validator.normalizeEmail(req.body.email || '') || '',
        projectType: validator.escape(req.body.projectType || '').trim(),
        budget: validator.escape(req.body.budget || '').trim(),
        message: validator.escape(req.body.message || '').trim(),
      };

      // Additional validation
      if (!contactData.name || contactData.name.length < 2 || contactData.name.length > 100) {
        return res.status(400).json({ message: "Name must be between 2 and 100 characters" });
      }
      
      if (!validator.isEmail(contactData.email)) {
        return res.status(400).json({ message: "Please provide a valid email address" });
      }
      
      if (!contactData.message || contactData.message.length < 10 || contactData.message.length > 2000) {
        return res.status(400).json({ message: "Message must be between 10 and 2000 characters" });
      }

      // Parse with our schema for final validation
      const validatedData = insertContactSchema.parse(contactData);
      const contact = await storage.createContactSubmission(validatedData);
      
      // Send email notification via Gmail
      if (transporter) {
        try {
          await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: process.env.GMAIL_USER, // Send to yourself
            subject: `New Contact Form Submission - ${contact.projectType || 'General Inquiry'}`,
            html: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${contact.name}</p>
              <p><strong>Email:</strong> ${contact.email}</p>
              <p><strong>Project Type:</strong> ${contact.projectType || 'Not specified'}</p>
              <p><strong>Budget:</strong> ${contact.budget || 'Not specified'}</p>
              <p><strong>Message:</strong></p>
              <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #007acc; margin: 15px 0;">
                ${contact.message.replace(/\n/g, '<br>')}
              </div>
              <p><strong>Submitted:</strong> ${new Date(contact.createdAt || new Date()).toLocaleString()}</p>
              <hr>
              <p style="color: #666; font-size: 12px;">
                This email was sent from your ZIGZAG APPS portfolio contact form.
              </p>
            `,
          });
        } catch (emailError) {
          console.error("Failed to send contact notification email:", emailError);
          // Don't fail the request if email fails
        }
      }
      
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
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle payment completion
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      try {
        const purchase = await storage.getPurchaseByPaymentIntent(paymentIntent.id);
        if (purchase) {
          await storage.updatePurchaseStatus(purchase.id, "completed");
          
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
