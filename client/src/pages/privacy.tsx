import { useEffect } from "react";

export default function PrivacyPolicy() {
  useEffect(() => {
    // SEO setup
    document.title = "Privacy Policy - ZIGZAG APPS | Henry Peti";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Privacy Policy for ZIGZAG APPS by Henry Peti. Learn how we collect, use, and protect your personal information when using our services.');
    }
  }, []);

  return (
    <div className="min-h-screen pt-20 pb-12">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <a href="/" className="text-xl font-bold text-primary font-mono" data-testid="logo">
              <span className="text-gradient">ZIGZAG APPS</span>
            </a>
            <a href="/" className="text-muted-foreground hover:text-primary transition-colors" data-testid="back-home">
              ← Back to Home
            </a>
          </div>
        </nav>
      </header>

      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black mb-8 text-center text-primary" data-testid="privacy-title">
            Privacy Policy
          </h1>
          
          <div className="bg-card p-8 rounded-2xl brutalist-shadow prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Information We Collect</h2>
              <p className="text-muted-foreground mb-4">
                When you use ZIGZAG APPS services, we may collect the following types of information:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Personal information you provide (name, email, phone number)</li>
                <li>Technical information about your device and browser</li>
                <li>Usage data and analytics about how you interact with our apps</li>
                <li>Payment information when purchasing premium apps</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">
                We use the collected information to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide and improve our services</li>
                <li>Process payments and fulfill orders</li>
                <li>Send important updates and notifications</li>
                <li>Analyze usage patterns to enhance user experience</li>
                <li>Respond to customer support inquiries</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Data Protection</h2>
              <p className="text-muted-foreground mb-4">
                We implement appropriate security measures to protect your personal information:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Encrypted data transmission and storage</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal information</li>
                <li>Secure payment processing through trusted providers</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Third-Party Services</h2>
              <p className="text-muted-foreground mb-4">
                We may use third-party services including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Payment processors (Stripe) for secure transactions</li>
                <li>Analytics services to understand user behavior</li>
                <li>Email services for communications</li>
                <li>Cloud hosting providers for reliable service delivery</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Your Rights</h2>
              <p className="text-muted-foreground mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Access and review your personal information</li>
                <li>Request corrections to inaccurate data</li>
                <li>Request deletion of your personal information</li>
                <li>Opt-out of marketing communications</li>
                <li>Data portability where technically feasible</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy or your personal information, please contact us:
              </p>
              <div className="mt-4 text-muted-foreground">
                <p><strong>Email:</strong> henrypeti.dev@gmail.com</p>
                <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                <p><strong>Address:</strong> San Francisco, CA</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}