# SOTC (State of the Collection) - Watch Collection Management App

## Overview

SOTC is a full-stack web application for managing watch collections. It allows users to create multiple collections, add watches with detailed information, manage images, and visualize their collections in customizable grids. The application provides comprehensive watch tracking including purchase dates, service schedules, valuations, and detailed specifications.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Build Tool**: Vite for development and production builds
- **UI Components**: Comprehensive shadcn/ui component system with Radix UI primitives

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API design
- **Development**: Hot reloading with Vite middleware integration
- **File Handling**: Multer for image upload processing

### Database & ORM
- **Database**: SQLite (local database file)
- **ORM**: Drizzle ORM with Zod schema validation
- **Migrations**: Manual table creation with SQL
- **Connection**: Better-sqlite3 for local SQLite database

## Key Components

### Data Models
1. **Collections**: User-created groups of watches with customizable grid layouts
2. **Brands**: Watch manufacturers (both predefined and custom)
3. **Watches**: Individual timepieces with comprehensive metadata

### Core Features
- **Collection Management**: Create, update, and configure multiple watch collections
- **Watch Tracking**: Detailed watch information including purchase dates, service history, and valuations
- **Image Management**: Multiple image support with primary image selection
- **Grid Customization**: Configurable grid layouts (columns/rows) per collection
- **Service Monitoring**: Track service schedules and maintenance requirements
- **Financial Tracking**: Watch valuations and collection value calculations
- **Wear Tracking System**: Comprehensive daily wear logging with the following features:
  - **WIT Button**: One-click "Wearing It Today" functionality for instant daily logging
  - **Retrospective Logging**: Calendar picker for adding historical wear dates
  - **Visual Indicators**: Watch cards change background color when worn today
  - **Analytics Dashboard**: Bar charts showing total wear days and longest streaks
  - **Streak Tracking**: Automatic calculation of consecutive wear day streaks
  - **Collection Statistics**: Collapsible stats showing most worn watches and streak leaders
  - **Wear History**: View and manage individual wear dates with removal capability

### Storage Strategy
- **Development**: SQLite database for persistent local storage
- **Production**: SQLite database with automatic table creation
- **File Storage**: Local filesystem for uploaded images with organized directory structure

## Data Flow

1. **Client Requests**: React components make API calls via TanStack Query
2. **API Processing**: Express server handles requests and validates data using Zod schemas
3. **Data Persistence**: Drizzle ORM manages database operations
4. **Response Handling**: JSON responses with proper error handling and logging
5. **State Updates**: TanStack Query manages client-side cache invalidation and updates

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm & drizzle-zod**: Database ORM and schema validation
- **@tanstack/react-query**: Server state management
- **multer**: File upload handling
- **express**: Web server framework

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **date-fns**: Date manipulation utilities

### Development Tools
- **vite**: Build tool and development server
- **tsx**: TypeScript execution
- **esbuild**: Production bundling

## Deployment Strategy

### Development
- **Server**: TSX with hot reloading
- **Client**: Vite dev server with HMR
- **Database**: Drizzle push for schema updates
- **Assets**: Served from local filesystem

### Production
- **Build Process**: 
  - Vite builds client assets to `dist/public`
  - ESBuild bundles server code to `dist/index.js`
- **Server**: Node.js serves both API and static assets
- **Database**: Drizzle migrations for schema management
- **Environment**: Production-ready with proper error handling

### Configuration
- Environment variables for database connectivity
- Separate development and production configurations
- TypeScript compilation with strict mode enabled

## Changelog
- July 01, 2025. Initial setup
- July 01, 2025. Added comprehensive wear tracking system with daily logging, analytics, and visual reporting
- July 02, 2025. Converted from PostgreSQL to SQLite database for local storage
- July 02, 2025. Fixed valuation field currency conversion (pounds to pence)
- July 02, 2025. Fixed image upload real-time display - images now appear immediately without refresh
- July 02, 2025. Fixed brand name display on watch cards - now shows actual brand instead of "Brand Name"
- July 02, 2025. Added watch-themed favicon matching the WIT button icon

## User Preferences

Preferred communication style: Simple, everyday language.