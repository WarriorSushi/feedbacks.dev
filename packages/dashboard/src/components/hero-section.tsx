'use client';

import Link from 'next/link';
import { ArrowRight, Code, Zap, Globe, Shield, Users, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CodeSnippet } from '@/components/code-snippet';

interface HeroSectionProps {
  isAuthenticated?: boolean;
}

export function HeroSection({ isAuthenticated = false }: HeroSectionProps) {
  const sampleCode = `<script 
  src="https://cdn.feedbacks.dev/widget-1.0.0.js"
  data-project="pk_live_abc123"
  defer>
</script>`;

  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      {/* Enhanced Mesh Background */}
      <div className="absolute inset-0 mesh-gradient-hero" />
      
      {/* Additional floating elements for depth */}
      <div className="absolute top-20 left-1/4 w-64 h-64 bg-gradient-primary rounded-full opacity-5 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-5 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 px-4 py-2 animate-fade-in bg-white/90 text-gray-900 border-gray-200 dark:bg-gray-900/90 dark:text-gray-100 dark:border-gray-700 transition-none hover:bg-white/90 hover:dark:bg-gray-900/90">
            <Zap className="w-3 h-3 mr-2" />
            Lightning fast, Open source, No Credit card required
          </Badge>

          {/* Main headline */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6 animate-fade-in max-w-4xl">
            <span className="gradient-text">Collect feedbacks with one line of code</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl mb-8 max-w-3xl animate-fade-in text-[#1a1a1a] dark:text-gray-300" style={{ animationDelay: '0.2s' }}>
            One copy-paste, get updates everywhere—we got you.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12 px-4 sm:px-0 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button size="lg" className="premium-button" asChild>
              <Link href={isAuthenticated ? "/dashboard" : "https://app.feedbacks.dev/auth"}>
                {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="hover-lift" asChild>
              <Link href="/docs">View Documentation</Link>
            </Button>
          </div>

          {/* Code snippet preview */}
          <div className="w-full max-w-2xl animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-primary rounded-lg blur opacity-25" />
              <div className="relative">
                <CodeSnippet code={sampleCode} />
              </div>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center items-center gap-6 mt-16 w-full max-w-4xl">
            {[
              { icon: Code, title: "One Line", desc: "Simple integration" },
              { icon: Zap, title: "<20KB", desc: "Lightning fast" },
              { icon: Globe, title: "Cross-Platform", desc: "Web & mobile" },
              { icon: Shield, title: "Secure", desc: "Privacy focused" }
            ].map((feature, index) => (
              <div 
                key={feature.title} 
                className="text-center animate-fade-in group cursor-default flex-shrink-0" 
                style={{ animationDelay: `${0.8 + index * 0.1}s` }}
              >
                <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-primary/10 border border-primary/20 group-hover:bg-gradient-primary/15 group-hover:border-primary/30 transition-all duration-300 min-w-[140px] justify-center">
                  <feature.icon className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="text-center">
                    <h3 className="font-semibold text-sm leading-tight whitespace-nowrap">{feature.title}</h3>
                    <p className="text-xs text-[#1a1a1a] dark:text-gray-400 leading-tight whitespace-nowrap">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="mt-20 w-full max-w-5xl animate-fade-in" style={{ animationDelay: '1.2s' }}>
            {/* Stats */}
            <div className="flex flex-wrap justify-center items-center gap-8 mb-12">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold gradient-text">10,000+</span>
                </div>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold gradient-text">500K+</span>
                </div>
                <p className="text-sm text-muted-foreground">Feedback Collected</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-2xl font-bold gradient-text">4.8</span>
                </div>
                <p className="text-sm text-muted-foreground">Developer Rating</p>
              </div>
            </div>

            {/* Company Logos */}
            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground mb-6">
                Trusted by developers at top companies
              </p>
              <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">V</span>
                  </div>
                  <span className="font-semibold text-foreground">Vercel</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">N</span>
                  </div>
                  <span className="font-semibold text-foreground">Next.js</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <span className="font-semibold text-foreground">Supabase</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">F</span>
                  </div>
                  <span className="font-semibold text-foreground">Framer</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <span className="font-semibold text-foreground">Stripe</span>
                </div>
              </div>
            </div>

            {/* Quick testimonial */}
            <div className="mesh-gradient-card rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold">JS</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <p className="text-foreground italic mb-2">
                    "Setup took literally 2 minutes. Our conversion rate increased by 23% in the first week!"
                  </p>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold">Jake Smith</span> • Senior Developer at TechCorp
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}