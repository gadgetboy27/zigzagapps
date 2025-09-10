# Overview

This is a full-stack portfolio and app marketplace application for Henry Peti, a software engineer and entrepreneur. The application serves as both a personal portfolio website and a premium app store where users can browse, purchase, and access Henry's software applications. Built with modern web technologies, it features a React frontend with a brutalist design aesthetic, an Express.js backend API, and PostgreSQL database integration.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent, accessible design
- **Styling**: Tailwind CSS with custom CSS variables for theming and brutalist design elements
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod for validation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety across the stack
- **API Design**: RESTful API with organized route handlers
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with Neon serverless hosting
- **Development**: Hot reload with tsx for TypeScript execution

## Data Storage Solutions
- **Primary Database**: PostgreSQL hosted on Neon with connection pooling
- **Schema Management**: Drizzle migrations for version-controlled database changes
- **Data Models**: Apps, testimonials, contact submissions, and purchases with proper relationships
- **File Storage**: External image hosting (Unsplash URLs for demo content)

## Payment Processing
- **Payment Gateway**: Stripe integration for secure payment processing
- **Implementation**: Stripe Elements for frontend payment forms with server-side confirmation
- **Purchase Flow**: Payment intent creation, customer information collection, and purchase record storage

## Authentication and Authorization
- **Current State**: No authentication system implemented
- **Session Management**: Express sessions configured but not actively used
- **Security**: Basic CORS and request validation

## External Dependencies

### Third-Party Services
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support
- **Stripe**: Payment processing with React Stripe.js integration
- **Font Services**: Google Fonts for typography (Inter, JetBrains Mono)
- **Icon Library**: Font Awesome for iconography

### Development Tools
- **Replit Integration**: Custom Vite plugins for Replit development environment
- **Error Handling**: Runtime error overlay for development
- **Code Quality**: TypeScript strict mode with comprehensive type checking

### UI and Styling
- **Component System**: Extensive Radix UI component library for accessibility
- **Design System**: shadcn/ui components with customizable variants
- **Animation**: CSS transitions and custom animations for brutalist design effects
- **Responsive Design**: Mobile-first approach with Tailwind responsive utilities

### Build and Deployment
- **Bundle Optimization**: ESBuild for server-side bundling
- **Asset Management**: Vite asset handling with path resolution
- **Environment Configuration**: Environment variables for database and API keys
- **Production Build**: Optimized client and server builds for deployment