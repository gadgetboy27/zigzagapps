import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { App } from "@shared/schema";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

interface CheckoutFormProps {
  app: App;
  customerInfo: {
    name: string;
    email: string;
  };
}

const CheckoutForm = ({ app, customerInfo }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (!stripe || !elements) {
      setIsProcessing(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/?payment=success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: `Thank you for purchasing ${app.name}!`,
      });
      setLocation("/");
    }
    
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="checkout-form">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Payment Details</h3>
        <PaymentElement />
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold text-lg hover:bg-primary/90 transition-colors"
        data-testid="button-complete-payment"
      >
        {isProcessing ? (
          <>
            <i className="fas fa-spinner fa-spin mr-2"></i>
            Processing Payment...
          </>
        ) : (
          <>
            <i className="fas fa-credit-card mr-2"></i>
            Complete Payment - ${app.price}
          </>
        )}
      </Button>
      
      <div className="text-center text-sm text-muted-foreground">
        <p>Secure payment powered by Stripe</p>
        <p className="mt-1">30-day money-back guarantee</p>
      </div>
    </form>
  );
};

export default function Checkout() {
  const params = useParams();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
  });

  const appId = params.appId;

  const { data: app, isLoading: appLoading, error: appError } = useQuery<App>({
    queryKey: ["/api/apps", appId],
    enabled: !!appId,
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: { appId: string; customerEmail: string; customerName: string }) => {
      const response = await apiRequest("POST", "/api/create-payment-intent", data);
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error) => {
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // SEO setup for checkout page
    document.title = app ? `Checkout - ${app.name} | Henry Peti` : "Checkout | Henry Peti";
  }, [app]);

  const handleCustomerInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!app || !customerInfo.name || !customerInfo.email) return;

    createPaymentMutation.mutate({
      appId: app.id,
      customerEmail: customerInfo.email,
      customerName: customerInfo.name,
    });
  };

  if (appLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading app details...</p>
        </div>
      </div>
    );
  }

  if (appError || !app) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <i className="fas fa-exclamation-triangle text-4xl text-destructive mb-4"></i>
              <h1 className="text-2xl font-bold text-foreground mb-2">App Not Found</h1>
              <p className="text-muted-foreground mb-6">
                The app you're trying to purchase could not be found.
              </p>
              <Button onClick={() => setLocation("/")} className="bg-primary text-primary-foreground">
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!app.isPremium || !app.price) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <i className="fas fa-info-circle text-4xl text-accent mb-4"></i>
              <h1 className="text-2xl font-bold text-foreground mb-2">App Not For Sale</h1>
              <p className="text-muted-foreground mb-6">
                This app is not available for purchase.
              </p>
              <Button onClick={() => setLocation("/")} className="bg-primary text-primary-foreground">
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black mb-4 text-primary" data-testid="checkout-title">
              SECURE CHECKOUT
            </h1>
            <p className="text-muted-foreground">
              Complete your purchase safely and securely
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* App Details */}
            <div>
              <Card className="brutalist-shadow-secondary">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground">Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* App Image */}
                    <img 
                      src={app.imageUrl || "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=400&h=200"} 
                      alt={`${app.name} preview`}
                      className="w-full h-48 object-cover rounded-lg"
                      data-testid="checkout-app-image"
                    />
                    
                    {/* App Info */}
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2" data-testid="checkout-app-name">
                        {app.name}
                      </h3>
                      <p className="text-muted-foreground mb-4" data-testid="checkout-app-description">
                        {app.longDescription || app.description}
                      </p>
                      
                      {/* Features */}
                      {app.features && app.features.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-foreground mb-2">What's Included:</h4>
                          <ul className="space-y-1">
                            {app.features.map((feature, index) => (
                              <li key={index} className="flex items-center text-sm text-muted-foreground">
                                <i className="fas fa-check text-accent mr-2"></i>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Technologies */}
                      {app.technologies && app.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {app.technologies.map((tech, index) => (
                            <span 
                              key={index}
                              className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    {/* Pricing */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-lg">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="text-foreground">${app.price}</span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="text-muted-foreground">Tax:</span>
                        <span className="text-foreground">$0.00</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-xl font-bold">
                        <span className="text-foreground">Total:</span>
                        <span className="text-primary" data-testid="checkout-total-price">${app.price}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Form */}
            <div>
              <Card className="brutalist-shadow">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground">Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {!clientSecret ? (
                    // Customer Information Form
                    <form onSubmit={handleCustomerInfoSubmit} className="space-y-6" data-testid="customer-info-form">
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-2">Full Name *</label>
                        <Input
                          type="text"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                          required
                          placeholder="Enter your full name"
                          className="bg-input border-border"
                          data-testid="input-customer-name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-2">Email Address *</label>
                        <Input
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                          required
                          placeholder="Enter your email address"
                          className="bg-input border-border"
                          data-testid="input-customer-email"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          You'll receive purchase confirmation and app access details at this email.
                        </p>
                      </div>
                      
                      <Button 
                        type="submit" 
                        disabled={createPaymentMutation.isPending || !customerInfo.name || !customerInfo.email}
                        className="w-full bg-secondary text-secondary-foreground py-3 rounded-lg font-bold text-lg hover:bg-secondary/90 transition-colors"
                        data-testid="button-continue-payment"
                      >
                        {createPaymentMutation.isPending ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Setting up payment...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-arrow-right mr-2"></i>
                            Continue to Payment
                          </>
                        )}
                      </Button>
                    </form>
                  ) : stripePromise ? (
                    // Stripe Payment Form
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <CheckoutForm app={app} customerInfo={customerInfo} />
                    </Elements>
                  ) : (
                    // Payment system not configured
                    <div className="text-center py-12">
                      <i className="fas fa-credit-card text-4xl text-muted-foreground mb-4"></i>
                      <h3 className="text-xl font-bold text-foreground mb-4">Payment System Setup Required</h3>
                      <p className="text-muted-foreground mb-6">
                        Payment processing is currently being configured. Please check back soon or contact support.
                      </p>
                      <Button onClick={() => setLocation("/")} className="bg-primary text-primary-foreground">
                        Return Home
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Security Badges */}
              <div className="mt-6 text-center">
                <div className="flex justify-center items-center space-x-4 mb-4">
                  <i className="fas fa-shield-alt text-accent text-2xl"></i>
                  <span className="text-sm text-muted-foreground">256-bit SSL Encryption</span>
                </div>
                <div className="flex justify-center space-x-6 text-2xl text-muted-foreground">
                  <i className="fab fa-cc-visa" title="Visa"></i>
                  <i className="fab fa-cc-mastercard" title="Mastercard"></i>
                  <i className="fab fa-cc-amex" title="American Express"></i>
                  <i className="fab fa-paypal" title="PayPal"></i>
                  <i className="fab fa-apple-pay" title="Apple Pay"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Store */}
          <div className="text-center mt-12">
            <Button 
              onClick={() => setLocation("/#store")}
              variant="outline"
              className="border-border text-muted-foreground hover:text-foreground"
              data-testid="button-back-to-store"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Store
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
