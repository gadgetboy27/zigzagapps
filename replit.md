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

## Database Synchronization System

### Overview
Automated database synchronization system for safely syncing development database content to production. The system includes backup and sync scripts with safety features to prevent data loss.

### Scripts Location
- `scripts/backup-db.ts` - Creates JSON backups of production database tables
- `scripts/sync-db.ts` - Syncs development database content to production with safety features

### Environment Variables Required
- `DATABASE_URL` - Current development database connection (already configured)
- `DEV_DATABASE_URL` - Development database URL (optional, defaults to DATABASE_URL)  
- `PROD_DATABASE_URL` - Production database URL (required for sync operations)

### NPM Scripts to Add
Add these scripts to package.json (manual addition required due to configuration protection):
```json
{
  "scripts": {
    "backup-db": "tsx scripts/backup-db.ts",
    "sync-db": "tsx scripts/sync-db.ts --replace",
    "sync-db:dry": "tsx scripts/sync-db.ts --dry-run --replace --verbose"
  }
}
```

### Key Features
- **Safe Upsert Strategy**: Uses business keys (apps.name, testimonials.name+content hash)
- **Transaction Safety**: All operations wrapped in database transactions
- **Automatic Backups**: Creates JSON backups before sync operations
- **Dry-Run Mode**: Preview changes without executing them
- **Replace Mode**: Handles deleted records with soft delete (isActive=false)
- **Content-Only**: Never touches transactional data (purchases table)
- **Clear Logging**: Comprehensive logging of all changes made

### Usage Examples
```bash
# Backup production database
npm run backup-db

# Dry run sync (show planned changes)
npm run sync-db:dry

# Execute sync with replace mode
npm run sync-db

# Custom backup options
tsx scripts/backup-db.ts --tables apps --output ./my-backups

# Custom sync options  
tsx scripts/sync-db.ts --dry-run --verbose
```

### Business Keys
- **Apps**: Uses `name` field as unique business identifier
- **Testimonials**: Uses combination of `name` + content hash for uniqueness
- **Purchases**: Never modified by sync system (transactional integrity)