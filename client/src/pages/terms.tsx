import { useEffect } from "react";

export default function TermsOfService() {
  useEffect(() => {
    // SEO setup
    document.title = "Terms of Service - ZIGZAG APPS | Henry Peti";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Terms of Service for ZIGZAG APPS by Henry Peti. Read our terms and conditions for using our applications and services.');
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
          <h1 className="text-4xl md:text-5xl font-black mb-8 text-center text-primary" data-testid="terms-title">
            Terms of Service
          </h1>
          
          <div className="bg-card p-8 rounded-2xl brutalist-shadow prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-4">
                By accessing or using ZIGZAG APPS services, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Services Description</h2>
              <p className="text-muted-foreground mb-4">
                ZIGZAG APPS provides:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Custom software development services</li>
                <li>Mobile and web application development</li>
                <li>Premium applications for purchase</li>
                <li>Technical consulting and support</li>
                <li>Digital solutions and platforms</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">User Responsibilities</h2>
              <p className="text-muted-foreground mb-4">
                As a user of our services, you agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Use our services for lawful purposes only</li>
                <li>Respect intellectual property rights</li>
                <li>Not attempt to circumvent security measures</li>
                <li>Report any bugs or security issues responsibly</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Payment and Refunds</h2>
              <p className="text-muted-foreground mb-4">
                For premium applications and services:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>All payments are processed securely through Stripe</li>
                <li>Prices are subject to change with notice</li>
                <li>Refunds are handled on a case-by-case basis</li>
                <li>Digital products are delivered immediately upon payment</li>
                <li>Subscription services can be cancelled at any time</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Intellectual Property</h2>
              <p className="text-muted-foreground mb-4">
                All content, code, and materials provided by ZIGZAG APPS are protected by intellectual property rights:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Source code and applications remain the property of Henry Peti</li>
                <li>Users receive licenses to use purchased applications</li>
                <li>Reverse engineering or redistribution is prohibited</li>
                <li>Custom work ownership terms are specified in individual contracts</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Service Availability</h2>
              <p className="text-muted-foreground mb-4">
                We strive to maintain high service availability but:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Services may be temporarily unavailable for maintenance</li>
                <li>We do not guarantee 100% uptime</li>
                <li>Critical updates may require service interruptions</li>
                <li>Users will be notified of planned maintenance when possible</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Limitation of Liability</h2>
              <p className="text-muted-foreground mb-4">
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>ZIGZAG APPS is not liable for indirect or consequential damages</li>
                <li>Our liability is limited to the amount paid for services</li>
                <li>Users assume responsibility for their use of our applications</li>
                <li>We provide services "as is" without warranties</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Termination</h2>
              <p className="text-muted-foreground mb-4">
                These terms remain in effect until terminated:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Users may discontinue use of services at any time</li>
                <li>We may suspend or terminate access for violations</li>
                <li>Data retention policies apply after termination</li>
                <li>Some provisions survive termination</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Changes to Terms</h2>
              <p className="text-muted-foreground mb-4">
                We may update these terms periodically. Continued use of our services after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Contact Information</h2>
              <p className="text-muted-foreground">
                For questions about these Terms of Service, please contact us:
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