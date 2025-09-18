import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import type { IncomingMessage, ServerResponse } from "http";
import Stripe from "stripe";
import express from "express";
import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import validator from "validator";
import crypto from "crypto";
import { createProxyMiddleware, type Options } from "http-proxy-middleware";
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
      'https://zigzagapps.net', // Production domain
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
  
  // Security middleware with CSP bypass for demo proxy routes
  app.use('/api/demo-proxy', (req, res, next) => {
    // Disable CSP for proxy routes to allow proxied content to load
    res.setHeader('Content-Security-Policy', '');
    res.setHeader('X-Content-Security-Policy', '');
    res.setHeader('X-WebKit-CSP', '');
    next();
  });

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        scriptSrc: ["'self'", "https://js.stripe.com", "https://replit.com"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:", "https://images.unsplash.com", "https://cdn.pixabay.com"],
        mediaSrc: ["'self'", "https:", "https://player.vimeo.com", "https://cdn.pixabay.com"],
        connectSrc: ["'self'", "ws:", "wss:", "https:", "https://api.stripe.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
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

  // Rate limiting for demo access
  const demoAccessLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 10, // Limit each IP to 10 demo access requests per day
    message: {
      error: "Too many demo requests today, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Health check endpoint (no rate limiting) - Handle BEFORE rate limiter
  app.head('/api', (req, res) => {
    res.status(200).end();
  });

  // General API rate limiter 
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased limit for general API calls
    message: {
      error: "Too many requests, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiting to all API routes EXCEPT health check
  app.use('/api/', (req, res, next) => {
    // Skip rate limiting for HEAD requests to /api
    if (req.method === 'HEAD' && req.path === '/api') {
      return next();
    }
    // Apply rate limiting to all other API routes
    apiLimiter(req, res, next);
  });
  
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

  // Generate demo access token
  app.post("/api/demo-access/:appId", demoAccessLimiter, async (req, res) => {
    try {
      const { appId } = req.params;
      const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
      const userAgent = req.get("User-Agent") || "";

      // Check if app exists and has demo URL
      const app = await storage.getApp(appId);
      if (!app) {
        return res.status(404).json({ message: "App not found" });
      }

      if (!app.demoUrl) {
        return res.status(400).json({ message: "Demo not available for this app" });
      }

      // Check daily session limit (max 2 per IP per app per day)
      const dailySessionCount = await storage.getDemoSessionsCountByIpAndAppToday(ipAddress, appId);
      if (dailySessionCount >= 2) {
        return res.status(429).json({ 
          message: "Daily demo limit reached. Purchase the app for unlimited access.",
          requiresPurchase: true,
          app: {
            id: app.id,
            name: app.name,
            price: app.price
          }
        });
      }

      // Check active session limit (max 2 active sessions per IP per app)
      const activeSessionCount = await storage.getActiveDemoSessionsCountByIpAndApp(ipAddress, appId);
      if (activeSessionCount >= 2) {
        return res.status(429).json({ 
          message: "Too many active demo sessions. Wait for existing sessions to expire or purchase the app.",
          requiresPurchase: true,
          app: {
            id: app.id,
            name: app.name,
            price: app.price
          }
        });
      }

      // Generate secure session token
      const sessionToken = crypto.randomBytes(32).toString("hex");

      // Create demo session (10 minutes duration)
      const startTime = new Date();
      const endTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const demoSession = await storage.createDemoSession({
        appId,
        sessionToken,
        ipAddress,
        userAgent,
        startTime,
        endTime,
        isActive: true
      });

      // Cleanup expired sessions
      await storage.cleanupExpiredDemoSessions();

      res.json({ 
        success: true,
        sessionToken,
        expiresAt: endTime.toISOString(),
        durationMinutes: 10,
        message: "Demo access granted. Session expires in 10 minutes."
      });
    } catch (error) {
      console.error("Error creating demo session:", error);
      res.status(500).json({ message: "Failed to create demo session" });
    }
  });

  // Secure demo proxy with token validation on every request
  app.use("/api/demo-proxy/:token/*?", async (req, res, next) => {
    try {
      const { token } = req.params;
      const targetPath = (req.params as any)['0'] || '';

      // Validate demo session with IP/UA binding on every request
      const clientIP = req.ip || req.connection.remoteAddress || "unknown";
      const userAgent = req.get("User-Agent") || "";
      const validation = await storage.validateDemoSession(token, clientIP, userAgent);
      
      if (!validation.valid || !validation.session || !validation.app) {
        // Handle different validation failure scenarios
        if (validation.error === 'IP address mismatch - session cannot be shared') {
          return res.status(403).json({ 
            message: validation.error,
            securityViolation: true,
            requiresPurchase: true,
            app: validation.app ? {
              id: validation.app.id,
              name: validation.app.name,
              price: validation.app.price
            } : undefined
          });
        }
        
        if (validation.error === 'Session security violation - please request a new demo') {
          return res.status(403).json({ 
            message: validation.error,
            securityViolation: true
          });
        }
        
        // Session expired or invalid
        if (validation.session && validation.app) {
          return res.status(410).json({ 
            message: "Demo session has expired. Purchase the app for unlimited access.",
            expired: true,
            requiresPurchase: true,
            app: {
              id: validation.app.id,
              name: validation.app.name,
              price: validation.app.price
            }
          });
        }
        
        return res.status(404).json({ message: "Invalid demo session" });
      }

      // Get the target demo URL
      const demoUrl = validation.app.demoUrl!;
      const targetUrl = new URL(demoUrl);
      
      // Create secure reverse proxy with comprehensive security and HTML rewriting
      const proxyOptions: Options = {
        target: targetUrl.origin,
        changeOrigin: true,
        secure: true,
        followRedirects: true,
        selfHandleResponse: true, // Critical: Handle response manually for proper URL rewriting
        pathRewrite: (path: string) => {
          // Extract the path after the token
          const tokenPath = `/api/demo-proxy/${token}`;
          const relativePath = path.replace(tokenPath, '') || '/';
          return targetUrl.pathname + (relativePath === '/' ? '' : relativePath);
        },
        on: {
          proxyReq: (proxyReq: any, req: IncomingMessage) => {
            // Remove token from headers to prevent exposure
            proxyReq.removeHeader('authorization');
            proxyReq.removeHeader('x-demo-session');
            
            // Add security headers
            proxyReq.setHeader('X-Forwarded-Proto', 'https');
            proxyReq.setHeader('User-Agent', 'ZIGZAG-DEMO-PROXY/1.0');
          },
          proxyRes: (proxyRes: any, req: IncomingMessage, res: ServerResponse) => {
            // Security: Remove/sanitize dangerous headers
            delete proxyRes.headers['x-original-url'];
            delete proxyRes.headers['x-forwarded-host'];
            delete proxyRes.headers['x-forwarded-for'];
            delete proxyRes.headers['set-cookie']; // Strip cookies to prevent security issues
            
            // Sanitize Location header to prevent URL leakage
            if (proxyRes.headers.location) {
              const location = proxyRes.headers.location;
              if (location.startsWith(targetUrl.origin)) {
                proxyRes.headers.location = location.replace(targetUrl.origin, `/api/demo-proxy/${token}`);
              }
            }
            
            // Disable caching on proxy responses
            proxyRes.headers['cache-control'] = 'no-cache, no-store, must-revalidate';
            proxyRes.headers['pragma'] = 'no-cache';
            proxyRes.headers['expires'] = '0';
            
            // Add security headers
            proxyRes.headers['X-Content-Type-Options'] = 'nosniff';
            proxyRes.headers['X-Frame-Options'] = 'SAMEORIGIN';
            proxyRes.headers['X-Robots-Tag'] = 'noindex, nofollow';
            
            // Set response status and headers explicitly
            res.statusCode = proxyRes.statusCode || 200;
            Object.keys(proxyRes.headers).forEach(key => {
              res.setHeader(key, proxyRes.headers[key]!);
            });
            
            // Buffer and process response content
            let body = Buffer.alloc(0);
            
            proxyRes.on('data', (chunk: Buffer) => {
              body = Buffer.concat([body, chunk]);
            });
            
            proxyRes.on('end', () => {
              let content = body;
              const contentType = proxyRes.headers['content-type'] || '';
              
              // Comprehensive URL rewriting for HTML content
              if (contentType.includes('text/html') || contentType.includes('application/javascript') || contentType.includes('text/css')) {
                let bodyStr = content.toString('utf8');
                
                // Rewrite absolute URLs to use our proxy
                const originRegex = new RegExp(targetUrl.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                bodyStr = bodyStr.replace(originRegex, `/api/demo-proxy/${token}`);
                
                // Rewrite protocol-relative URLs
                const protocolRelativeRegex = new RegExp(`//${targetUrl.hostname}`, 'g');
                bodyStr = bodyStr.replace(protocolRelativeRegex, `/api/demo-proxy/${token}`);
                
                // Rewrite root-relative URLs for same domain assets
                if (contentType.includes('text/html')) {
                  bodyStr = bodyStr.replace(/(?:src|href|action)="\//g, `$&api/demo-proxy/${token}/`);
                  bodyStr = bodyStr.replace(/(?:src|href|action)='\//g, `$&api/demo-proxy/${token}/`);
                }
                
                content = Buffer.from(bodyStr, 'utf8');
              }
              
              // Set proper content length
              res.setHeader('Content-Length', content.length);
              res.end(content);
            });
          },
          error: (err: any, req: IncomingMessage, res: any) => {
            console.error('Proxy error:', err);
            if (res && !res.headersSent && typeof res.status === 'function') {
              res.status(502).json({ 
                message: 'Demo content temporarily unavailable',
                error: 'proxy_error'
              });
            }
          }
        }
      };
      
      const proxy = createProxyMiddleware(proxyOptions);

      // Use the proxy
      proxy(req, res, next);
    } catch (error) {
      console.error("Error in demo proxy:", error);
      res.status(500).json({ message: "Failed to access demo content" });
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
        payment_method_types: ['card'],
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
          
          // Get purchase with app details for confirmation email
          const purchaseWithApp = await storage.getPurchaseWithApp(purchase.id);
          if (purchaseWithApp && transporter) {
            // Send purchase confirmation email
            try {
              const downloadUrl = `${process.env.PUBLIC_URL || 'https://your-domain.com'}/api/download/${purchase.id}`;
              
              await transporter.sendMail({
                from: process.env.GMAIL_USER,
                to: purchase.customerEmail,
                subject: `Your ${purchaseWithApp.app.name} Purchase is Complete!`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #007acc; text-align: center;">Thank You for Your Purchase!</h1>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h2 style="color: #333; margin-top: 0;">Purchase Details</h2>
                      <p><strong>App:</strong> ${purchaseWithApp.app.name}</p>
                      <p><strong>Amount:</strong> $${purchaseWithApp.amount}</p>
                      <p><strong>Purchase Date:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                      <h3 style="color: #155724; margin-top: 0;">Access Your App</h3>
                      <p style="color: #155724;">Your app is ready for download! Click the secure link below:</p>
                      <div style="text-align: center; margin: 20px 0;">
                        <a href="${downloadUrl}" style="background: #007acc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Download ${purchaseWithApp.app.name}</a>
                      </div>
                      <p style="color: #6c757d; font-size: 14px;">This download link is secure and will remain valid for 30 days.</p>
                    </div>
                    
                    ${purchaseWithApp.app.githubUrl ? `
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="color: #333; margin-top: 0;">Source Code Access</h3>
                      <p>You also have access to the source code repository:</p>
                      <p><a href="${purchaseWithApp.app.githubUrl}" style="color: #007acc;">${purchaseWithApp.app.githubUrl}</a></p>
                    </div>
                    ` : ''}
                    
                    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                      <h3 style="color: #856404; margin-top: 0;">Need Help?</h3>
                      <p style="color: #856404;">If you have any questions or need assistance with your purchase, please don't hesitate to reach out to us.</p>
                    </div>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
                    <p style="color: #6c757d; font-size: 12px; text-align: center;">
                      This email was sent from ZIGZAG APPS. You received this because you purchased ${purchaseWithApp.app.name}.
                    </p>
                  </div>
                `,
              });
              
              console.log(`Purchase confirmation email sent to ${purchase.customerEmail}`);
            } catch (emailError) {
              console.error("Failed to send purchase confirmation email:", emailError);
            }
          }
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

  // Create secure download endpoint for purchased apps
  app.get("/api/download/:purchaseId", async (req, res) => {
    try {
      const { purchaseId } = req.params;
      
      const purchaseWithApp = await storage.getPurchaseWithApp(purchaseId);
      if (!purchaseWithApp) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      
      if (purchaseWithApp.status !== "completed") {
        return res.status(403).json({ message: "Purchase not completed" });
      }
      
      // Check if download link is still valid (30 days)
      const purchaseDate = new Date(purchaseWithApp.createdAt || '');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      if (purchaseDate < thirtyDaysAgo) {
        return res.status(410).json({ message: "Download link has expired. Please contact support." });
      }
      
      // For demo purposes, redirect to GitHub or demo URL
      // In a real app, you'd serve the actual downloadable file
      const downloadUrl = purchaseWithApp.app.githubUrl || purchaseWithApp.app.demoUrl;
      if (downloadUrl) {
        res.redirect(downloadUrl);
      } else {
        res.json({
          message: "Download ready",
          app: {
            name: purchaseWithApp.app.name,
            description: purchaseWithApp.app.description,
            githubUrl: purchaseWithApp.app.githubUrl,
            demoUrl: purchaseWithApp.app.demoUrl
          },
          instructions: "Please contact support for download instructions."
        });
      }
    } catch (error) {
      console.error("Error processing download request:", error);
      res.status(500).json({ message: "Failed to process download request" });
    }
  });

  // TEMPORARY: Export data as JSON (use in development)
  app.get("/api/export", async (req, res) => {
    try {
      const apps = await storage.getApps();
      const testimonials = await storage.getTestimonials();
      
      res.json({
        apps: apps,
        testimonials: testimonials,
        exportedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error exporting data:", error);
      res.status(500).json({ error: "Failed to export data: " + error.message });
    }
  });

  // TEMPORARY: Import JSON data (use in production)  
  app.post("/api/import", async (req, res) => {
    try {
      const { apps, testimonials = [] } = req.body;
      
      if (!apps || !Array.isArray(apps)) {
        return res.status(400).json({ error: "Missing or invalid apps data" });
      }

      console.log(`Importing ${apps.length} apps and ${testimonials.length} testimonials...`);
      
      let importedApps = 0;
      let importedTestimonials = 0;
      
      // Import apps
      for (const app of apps) {
        try {
          // Remove database-specific fields
          const { id, createdAt, updatedAt, created_at, updated_at, ...appData } = app;
          
          // Convert snake_case to camelCase for the schema
          const cleanAppData = {
            name: appData.name,
            description: appData.description,
            longDescription: appData.long_description || appData.longDescription,
            price: appData.price,
            category: appData.category,
            imageUrl: appData.image_url || appData.imageUrl,
            demoUrl: appData.demo_url || appData.demoUrl,
            githubUrl: appData.github_url || appData.githubUrl,
            technologies: appData.technologies || [],
            features: appData.features || [],
            isPremium: appData.is_premium ?? appData.isPremium ?? false,
            isActive: appData.is_active ?? appData.isActive ?? true
          };
          
          await storage.createApp(cleanAppData);
          importedApps++;
        } catch (appError) {
          console.error(`Error importing app ${app.name}:`, appError);
        }
      }
      
      // Import testimonials
      for (const testimonial of testimonials) {
        try {
          const { id, createdAt, created_at, ...testimonialData } = testimonial;
          await storage.createTestimonial(testimonialData);
          importedTestimonials++;
        } catch (testimonialError) {
          console.error(`Error importing testimonial:`, testimonialError);
        }
      }
      
      res.json({ 
        success: true, 
        message: `Successfully imported ${importedApps} apps and ${importedTestimonials} testimonials`,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error importing data:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to import data: " + error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
