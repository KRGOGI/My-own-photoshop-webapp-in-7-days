# Photoshop Clone Web Application

## Overview

This is a comprehensive web-based photo editing application built to replicate core Photoshop functionality in a browser environment. The application provides professional-grade image editing tools including brightness/contrast adjustments, filters, cropping, rotation, and zoom controls. It features a desktop-style interface with a toolbar, canvas workspace, and properties panel, designed with a dark theme that mirrors professional design software aesthetics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a **React-based single-page architecture** with TypeScript for type safety. The component structure follows a modular design pattern:

- **Main Canvas Component**: `ImageCanvas` handles image rendering, transformations, and user interactions using HTML5 Canvas API
- **Toolbar System**: `EditingToolbar` provides tool selection and action controls with a professional interface
- **Adjustment Panel**: `AdjustmentPanel` contains all image modification controls with real-time preview
- **Upload Interface**: `ImageUploader` supports drag-and-drop and file selection for image input

**State Management**: Uses React hooks for local state management with a centralized history system for undo/redo functionality. Image processing is handled through Canvas API with CSS filters for real-time adjustments.

**Routing**: Implements `wouter` for lightweight client-side routing, though the application is primarily single-page focused on the editing interface.

### UI Framework and Styling
Built on **shadcn/ui component library** with Radix UI primitives for accessibility. Uses **Tailwind CSS** for styling with a custom design system that emphasizes:

- Dark-first color scheme inspired by Adobe Photoshop
- Professional spacing and typography using Inter font
- Consistent component styling through CSS custom properties
- Responsive design principles with mobile considerations

### Backend Architecture
Follows an **Express.js REST API pattern** with TypeScript. The server structure includes:

- **Route Registration**: Centralized route management in `server/routes.ts`
- **Storage Interface**: Abstract storage layer supporting both in-memory and database implementations
- **Development Setup**: Vite integration for hot module replacement in development

**Database Design**: Uses Drizzle ORM with PostgreSQL dialect. Current schema supports user management with plans for image metadata storage and user sessions.

### Image Processing Strategy
**Client-Side Processing**: All image manipulations happen in the browser using:
- HTML5 Canvas API for pixel-level operations
- CSS filters for real-time preview of adjustments
- File API for image upload and export functionality
- History tracking for undo/redo operations

This approach ensures responsive performance and reduces server load while maintaining full editing capabilities.

### Development and Build System
**Vite-based build system** with:
- TypeScript compilation for both client and server
- Hot module replacement for development
- Production builds with optimization for both frontend and backend
- ESBuild for server-side bundling

## External Dependencies

### UI and Component Libraries
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Lucide React**: Icon library for consistent iconography
- **TailwindCSS**: Utility-first CSS framework with custom design tokens

### State Management and Data Fetching
- **TanStack Query**: Server state management and caching (though primarily client-side app)
- **React Hook Form**: Form handling with validation support
- **Wouter**: Lightweight routing solution

### Database and Backend
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL support
- **Neon Database**: Serverless PostgreSQL database provider
- **Express.js**: Web application framework for Node.js

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds

### Additional Utilities
- **date-fns**: Date manipulation library
- **clsx & class-variance-authority**: Conditional CSS class management
- **nanoid**: Unique ID generation for components and data