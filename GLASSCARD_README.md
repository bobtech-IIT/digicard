# GlassCard AI - Digital Visiting Card Generator

A stunning, AI-powered web application for creating beautiful glassmorphic digital visiting cards with batch processing capabilities and BYOK (Bring Your Own Key) AI integration.

## ✨ Features

### Core Card Builder
- **Glassmorphic Design**: Ultra-premium frosted glass aesthetic with turquoise-to-deep-green color palette
- **Responsive Form**: Intuitive input for headshot, name, designation, contact details, office information, and social media handles
- **Real-Time Preview**: Live card preview with dual aspect ratios (3:4 vertical for mobile/WhatsApp, 16:9 horizontal for desktop)
- **Professional Typography**: Poppins font throughout for modern, clean aesthetics

### Card Features
- **QR Code Generation**: Encodes all contact and social data in vCard format (3.0 standard)
- **Social Media Integration**: Support for LinkedIn, Twitter/X, Instagram, Facebook, YouTube, GitHub, TikTok, and WhatsApp with working links
- **Smart Text Wrapping**: Automatic layout optimization with no blank spaces or overflow
- **WhatsApp Sharing**: One-tap share button with pre-filled profile information

### Export Options
- **PNG Download**: High-quality raster export for easy sharing
- **PDF Download**: Professional document format for printing or archiving
- **WhatsApp Share**: Direct sharing with automatic vCard generation

### AI-Powered Features
- **BYOK Integration**: Connect your own API keys for Groq, OpenRouter, or Cerebras
- **Connection Testing**: Verify API credentials before saving
- **Bio Suggestions**: AI-generated professional bio options
- **Tagline Suggestions**: Catchy professional taglines for designations
- **Built-in LLM Fallback**: Automatic fallback to Manus built-in LLM when no BYOK keys configured

### Batch Processing
- **CSV/Excel Upload**: Upload up to 10 candidate records in bulk
- **Individual Photo Upload**: Assign headshot photos to each candidate
- **Bulk Card Generation**: Generate all cards at once
- **Batch Download**: Download all generated cards as ZIP

## 🎨 Design System

### Color Palette
- **Primary**: Turquoise (#14b8a6)
- **Secondary**: Teal (#0d9488)
- **Accent**: Deep Green (#047857)
- **Glassmorphic**: Semi-transparent white with backdrop blur

### Typography
- **Font Family**: Poppins (Google Fonts)
- **Weights**: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- **Sizes**: Responsive scaling from mobile to desktop

### Glassmorphism Effects
- Backdrop blur with 10px radius
- Semi-transparent white background (rgba with 0.1-0.3 opacity)
- Subtle border with white/gray tones
- Soft shadows for depth

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm package manager

### Installation
```bash
cd /home/ubuntu/glasscard-ai
pnpm install
```

### Development
```bash
pnpm dev
```

The app will start at `http://localhost:3000`

### Building
```bash
pnpm build
pnpm start
```

## 📊 Database Schema

### Tables
- **users**: Core user authentication (from template)
- **digitalCards**: Saved card data with all user inputs
- **aiProviders**: BYOK API keys and endpoints for Groq, OpenRouter, Cerebras
- **batchJobs**: Batch processing job tracking and status

## 🔑 AI Integration

### BYOK Providers Supported
1. **Groq** - Fast LLM inference
2. **OpenRouter** - Multi-provider LLM access
3. **Cerebras** - Ultra-fast AI inference

### Built-in LLM
- Uses Manus internal LLM via `invokeLLM` helper
- Automatically activated when no BYOK keys configured
- No setup required

### API Endpoints
- **Groq**: `https://api.groq.com/openai/v1/chat/completions`
- **OpenRouter**: `https://openrouter.ai/api/v1/chat/completions`
- **Cerebras**: `https://api.cerebras.ai/v1/chat/completions`

## 📁 Project Structure

```
glasscard-ai/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx           # Landing page
│   │   │   ├── CardBuilder.tsx    # Single card builder
│   │   │   └── BatchProcessor.tsx # Batch processing
│   │   ├── components/
│   │   │   ├── CardPreview.tsx    # Card preview & export
│   │   │   └── AISettings.tsx     # BYOK configuration
│   │   ├── index.css              # Glassmorphic design tokens
│   │   └── App.tsx                # Main router
│   └── index.html                 # Entry HTML
├── server/
│   ├── routers.ts                 # Main tRPC router
│   ├── routers-cards.ts           # Card & AI routers
│   ├── db-helpers.ts              # Database query helpers
│   ├── ai-helpers.ts              # AI integration helpers
│   ├── ai-helpers.test.ts         # AI tests
│   └── db.ts                      # Database connection
├── drizzle/
│   ├── schema.ts                  # Database schema
│   └── migrations/                # SQL migrations
└── shared/
    └── types.ts                   # Shared TypeScript types
```

## 🧪 Testing

### Run Tests
```bash
pnpm test
```

### Test Coverage
- AI helper functions (bio/tagline generation, provider testing)
- Authentication flow
- Database operations

## 🔒 Security

### API Key Handling
- API keys stored in database (consider encryption in production)
- Never exposed to frontend
- Connection testing validates credentials before storage

### vCard Format
- Compliant with vCard 3.0 standard
- Includes all contact and social data
- Safe for sharing via QR codes

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px (full-width form, stacked layout)
- **Tablet**: 640px - 1024px (two-column layout)
- **Desktop**: > 1024px (three-column with sticky preview)

### Card Aspect Ratios
- **3:4 Vertical**: 300×400px (optimized for mobile, WhatsApp)
- **16:9 Horizontal**: 800×450px (optimized for desktop, presentations)

## 🎯 Unique Value Proposition

**GlassCard AI** stands apart from existing visiting card generators through:

1. **Glassmorphic Aesthetic**: Premium frosted glass design not commonly seen in card generators
2. **Dual AI Integration**: Both BYOK (user's own keys) and built-in LLM fallback
3. **Batch Intelligence**: Process up to 10 cards with individual photo mapping
4. **Complete vCard Support**: Full contact + social data in QR codes
5. **Professional Export**: PNG, PDF, and direct WhatsApp sharing
6. **Zero Setup AI**: Built-in LLM works immediately without configuration

## 🚀 Future Enhancements

- Template library with pre-designed layouts
- Advanced customization (fonts, colors, layouts)
- Team collaboration features
- Card analytics and sharing tracking
- Integration with CRM systems
- Mobile app version

## 📝 License

MIT

## 🤝 Support

For issues or feature requests, please refer to the project documentation or contact support.

---

**Built with React 19, Tailwind CSS 4, tRPC 11, and Manus AI Integration**
