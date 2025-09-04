'use client';

import Link from 'next/link';
import { ArrowRight, Code, Zap, Globe, Shield } from 'lucide-react';
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
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
      
      {/* Floating elements */}
      <div className="absolute top-20 left-1/4 w-64 h-64 bg-gradient-primary rounded-full opacity-10 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-10 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 px-4 py-2 animate-fade-in">
            <Zap className="w-3 h-3 mr-2" />
            Developer-First Feedback Widget
          </Badge>

          {/* Main headline */}
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 animate-fade-in">
            Collect feedback with
            <span className="gradient-text block mt-2">one line of code</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Lightweight, embeddable feedback widget that works everywhere. 
            From websites to mobile apps – get user insights without the complexity.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 hero-glow" asChild>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 w-full max-w-4xl">
            {[
              { icon: Code, title: "One Line", desc: "Simple integration" },
              { icon: Zap, title: "<20KB", desc: "Lightning fast" },
              { icon: Globe, title: "Cross-Platform", desc: "Web & mobile" },
              { icon: Shield, title: "Secure", desc: "Privacy focused" }
            ].map((feature, index) => (
              <div 
                key={feature.title} 
                className="text-center animate-fade-in hover-lift" 
                style={{ animationDelay: `${0.8 + index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-primary/10 flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}