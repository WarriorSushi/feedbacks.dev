'use client';

import Link from 'next/link';
import { ArrowRight, Code, Zap, Globe, Shield, Users, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CodeSnippet } from '@/components/code-snippet';
import { RotatingText } from '@/components/rotating-text';

interface HeroSectionProps {
  isAuthenticated?: boolean;
}

export function HeroSection({ isAuthenticated = false }: HeroSectionProps) {
  const sampleCode = `<script 
  src="https://cdn.feedbacks.dev/widget-1.0.0.js"
  data-project="pk_live_abc123"
  defer>
</script>`;

  const rotatingWords = ['Feedbacks', 'Feature Requests', 'Reviews', 'Ideas', 'Ratings'];

  return (
    <section className="relative overflow-hidden py-16 lg:py-20">
      {/* Subtle background elements */}
      <div className="absolute inset-0" />
      <div className="absolute top-10 left-1/4 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-10 right-1/4 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          {/* Badge */}
          <Badge variant="secondary" className="mb-4 px-3 py-1 animate-fade-in bg-white/90 text-gray-900 border-gray-200 dark:bg-gray-900/90 dark:text-gray-100 dark:border-gray-700">
            <Zap className="w-3 h-3 mr-1.5" />
            Lightning fast • Open source • No credit card
          </Badge>

          {/* Main headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 animate-fade-in max-w-4xl">
            <span className="gradient-text">
              <span className="block text-center">
                <RotatingText words={rotatingWords} className="text-5xl md:text-6xl lg:text-7xl" />
              </span>
              <span className="block mt-1 text-center">
                with one line of code
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl mb-8 max-w-2xl animate-fade-in text-gray-700 dark:text-gray-300" style={{ animationDelay: '0.1s' }}>
            Copy, paste, done. Get user feedback everywhere instantly.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button size="lg" className="premium-button px-8" asChild>
              <Link href={isAuthenticated ? "/dashboard" : "https://app.feedbacks.dev/auth"}>
                {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="hover-lift px-6" asChild>
              <Link href="/docs">View Docs</Link>
            </Button>
          </div>

          {/* Code Window - Clean */}
          <div className="w-full max-w-xl animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-premium-lg border border-gray-200/60 dark:border-gray-800 backdrop-blur-sm">
                <CodeSnippet code={sampleCode} className="text-sm" />
              </div>
            </div>
          </div>

          {/* Feature highlights - Compact */}
          <div className="flex flex-wrap justify-center items-center gap-4 mt-12 w-full max-w-3xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {[
              { icon: Code, title: "One Line" },
              { icon: Zap, title: "<20KB" },
              { icon: Globe, title: "Universal" },
              { icon: Shield, title: "Secure" }
            ].map((feature, index) => (
              <div 
                key={feature.title} 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-gray-800/70 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90 shadow-premium-sm hover:shadow-premium transition-all duration-300"
              >
                <feature.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{feature.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}