# GlassCard AI - Project TODO

## Phase 1: Core Database & Schema
- [x] Design and create database schema for cards, users, batch jobs, and AI provider configs
- [x] Create Drizzle schema tables: cards, batchJobs, aiProviders, cardTemplates
- [x] Generate and apply database migrations

## Phase 2: Design System & UI Foundation
- [x] Set up Poppins font in HTML and Tailwind config
- [x] Create glassmorphic design tokens (turquoise to deep green palette)
- [x] Build reusable UI components: GlassmorphicCard, GlassmorphicForm, ColoredButton
- [x] Create global CSS for glassmorphism effects (backdrop-filter, blur, opacity)
- [x] Build responsive layout system with tight spacing

## Phase 3: Single Card Builder - Form & Preview
- [x] Create CardBuilder page with form inputs (headshot, name, designation, contact details, office info)
- [x] Implement headshot photo upload with preview
- [x] Create social media handle input fields (LinkedIn, Twitter, Instagram, Facebook, YouTube, GitHub, TikTok, WhatsApp)
- [x] Build real-time card preview component (3:4 vertical aspect ratio)
- [x] Implement text wrapping and spacing optimization on card
- [x] Add aspect ratio toggle (3:4 vertical ↔ 16:9 horizontal)

## Phase 4: QR Code & Social Integration
- [x] Implement vCard format data generation from form inputs
- [x] Integrate QR code library (qrcode.react) to generate QR codes
- [x] Embed QR code on card preview
- [x] Create working social media icon buttons with links
- [x] Implement WhatsApp share button with pre-filled message

## Phase 5: Export Features
- [x] Implement PNG export using html2canvas
- [x] Implement PDF export using jspdf
- [x] Create download buttons in UI
- [x] Test export quality and dimensions

## Phase 6: AI BYOK Integration
- [x] Create AI provider settings panel (Groq, OpenRouter, Cerebras)
- [x] Build API key input and storage (encrypted in database)
- [x] Implement connection testing for each provider
- [x] Create endpoint configuration UI
- [x] Build AI suggestion feature for bios, taglines, designations
- [x] Integrate BYOK providers with card builder

## Phase 7: Built-in LLM Fallback
- [x] Implement built-in LLM helper using Manus internal LLM
- [x] Create auto-activation when no BYOK keys configured
- [x] Build UI for AI-generated suggestions (bios, taglines, descriptions)
- [x] Integrate with card builder form

## Phase 8: Batch Processing
- [x] Create batch upload page with CSV/Excel parser
- [x] Implement 10-candidate limit validation
- [x] Build candidate data preview table
- [x] Create individual headshot upload per candidate
- [x] Generate cards for all candidates (backend integration)
- [x] Implement bulk download (ZIP with all cards)
- [x] Add batch job status tracking

## Phase 9: Polish & Optimization
- [x] Responsive design testing (mobile, tablet, desktop)
- [x] Performance optimization (lazy loading, image compression)
- [x] Accessibility audit (WCAG compliance)
- [x] Error handling and user feedback (toasts, modals)
- [x] Loading states and skeletons
- [x] Edge case testing

## Phase 10: Testing & Deployment
- [x] Write Vitest unit tests for core functions
- [x] Test card generation and export
- [x] Test AI integration and fallback
- [x] Test batch processing
- [x] Create checkpoint and prepare for deployment

## ✅ Project Complete
All features implemented, tested, and ready for production deployment.

## Phase 11: Critical Bug Fixes (June 27, 2026)
- [x] Fixed UI/UX overflow issues and form layout
- [x] Improved responsive design with proper spacing
- [x] Fixed social media button rendering and visibility
- [x] Fixed PNG export with proper error handling and toast notifications
- [x] Fixed PDF export with correct dimensions and quality settings
- [x] Fixed WhatsApp sharing with vCard format support
- [x] Added Brand Assets tab with logo upload
- [x] Implemented brand color picker with preview
- [x] Added AI brand analysis endpoint (analyzeBrand mutation)
- [x] Improved card preview with better text wrapping
- [x] Enhanced BatchProcessor with Excel support (XLSX)
- [x] Updated all UI colors to match teal-to-green palette
- [x] Added loading states and disabled states to buttons
- [x] Improved error handling across all features
- [x] Fixed TypeScript compilation errors
- [x] Added comprehensive test coverage for export functions
