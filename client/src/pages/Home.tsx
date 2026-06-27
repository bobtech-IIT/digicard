import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Sparkles, Upload, Zap, Share2 } from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-green-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/30 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary" size={28} />
            <h1 className="text-2xl font-bold text-foreground">GlassCard AI</h1>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-32">
        <div className="text-center space-y-8 mb-16">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold text-foreground">
              Create Stunning Digital
              <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-green-600 bg-clip-text text-transparent">
                {" "}Visiting Cards
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Generate beautiful glassmorphic business cards with AI-powered suggestions. Share on WhatsApp, download as PNG/PDF, and process up to 10 cards in bulk.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              onClick={() => navigate("/card-builder")}
              size="lg"
              className="glass-button gap-2 px-8"
            >
              <Sparkles size={20} />
              Create Single Card
            </Button>
            <Button
              onClick={() => navigate("/batch-processor")}
              size="lg"
              variant="outline"
              className="glass-button-secondary gap-2 px-8"
            >
              <Upload size={20} />
              Batch Upload
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            {
              icon: <Sparkles size={32} />,
              title: "Glassmorphic Design",
              description: "Ultra-premium frosted glass aesthetic with turquoise-to-green palette",
            },
            {
              icon: <Zap size={32} />,
              title: "AI-Powered",
              description: "BYOK integration with Groq, OpenRouter, and Cerebras for smart suggestions",
            },
            {
              icon: <Share2 size={32} />,
              title: "Easy Sharing",
              description: "One-tap WhatsApp sharing with QR codes and vCard support",
            },
            {
              icon: <Upload size={32} />,
              title: "Batch Processing",
              description: "Generate up to 10 cards at once with CSV/Excel upload",
            },
          ].map((feature, idx) => (
            <Card
              key={idx}
              className="glass-card p-6 text-center space-y-4 hover:shadow-xl transition-shadow"
            >
              <div className="text-primary flex justify-center">{feature.icon}</div>
              <h3 className="font-bold text-lg text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Features Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left: Text */}
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-foreground">
              Everything You Need for Professional Cards
            </h2>
            <div className="space-y-4">
              {[
                "Dual aspect ratios (3:4 vertical & 16:9 horizontal)",
                "Real-time preview with tight, responsive layout",
                "All social media platforms with working links",
                "QR code generation in vCard format",
                "PNG & PDF export with high quality",
                "WhatsApp integration for instant sharing",
              ].map((feature, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <p className="text-foreground/80">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Visual */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-green-400 rounded-3xl blur-3xl opacity-20" />
              <Card className="glass-card relative w-full max-w-sm aspect-[3/4] p-6 flex flex-col justify-between">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-300 to-green-300 mx-auto" />
                  <div>
                    <h3 className="font-bold text-lg">Your Name</h3>
                    <p className="text-sm text-primary">Your Designation</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-foreground/70">
                  <p>📧 email@example.com</p>
                  <p>📱 +1 (555) 123-4567</p>
                </div>
                <div className="flex gap-2 justify-center">
                  <div className="w-8 h-8 rounded-full bg-white/30" />
                  <div className="w-8 h-8 rounded-full bg-white/30" />
                  <div className="w-8 h-8 rounded-full bg-white/30" />
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Batch Processing Section */}
        <Card className="glass-card p-12 text-center space-y-6 mb-16">
          <h2 className="text-3xl font-bold text-foreground">Batch Generate Cards</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload a CSV file with up to 10 candidates, add their headshots, and generate all cards at once. Perfect for teams and organizations.
          </p>
          <Button
            onClick={() => navigate("/batch-processor")}
            size="lg"
            className="glass-button gap-2"
          >
            <Upload size={20} />
            Start Batch Upload
          </Button>
        </Card>

        {/* AI Integration Section */}
        <Card className="glass-card p-12 space-y-6 mb-16">
          <h2 className="text-3xl font-bold text-foreground text-center mb-8">AI-Powered Card Generation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "BYOK Integration",
                description: "Bring your own API keys for Groq, OpenRouter, or Cerebras. Full control over your AI provider.",
              },
              {
                title: "Built-in Fallback",
                description: "No keys? No problem. Use our built-in LLM to generate catchy bios and professional taglines.",
              },
              {
                title: "Smart Suggestions",
                description: "AI suggests designation descriptions, professional bios, and taglines to enhance your card.",
              },
            ].map((item, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="font-bold text-lg text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-white/30 backdrop-blur-md border-t border-white/20 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground">
          <p>GlassCard AI © 2026. Create beautiful digital visiting cards effortlessly.</p>
        </div>
      </footer>
    </div>
  );
}
