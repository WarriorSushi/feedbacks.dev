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
  const sampleCode = `<script src="https://cdn.feedbacks.dev/widget.js" data-project="pk_live_abc123" defer></script>`;

  const rotatingWords = ['Feedbacks', 'Feature Requests', 'Reviews', 'Ideas', 'Ratings'];

  return (
    <section className="relative overflow-hidden py-16 lg:py-20">
      {/* Subtle background elements */}
      <div className="absolute inset-0" />
      <div className="absolute top-10 left-1/4 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-10 right-1/4 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          {/* Three Badge Capsules */}
          <div className="flex flex-wrap justify-center gap-2 mb-6 mt-8 animate-fade-in">
            <Badge variant="secondary" className="px-2 py-1 text-xs md:px-3 md:text-sm bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700/30">
              <Zap className="w-2.5 h-2.5 mr-1 md:w-3 md:h-3 md:mr-1.5" />
              Lightning fast
            </Badge>
            <Badge variant="secondary" className="px-2 py-1 text-xs md:px-3 md:text-sm bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/30">
              <Code className="w-2.5 h-2.5 mr-1 md:w-3 md:h-3 md:mr-1.5" />
              Open source
            </Badge>
            <Badge variant="secondary" className="px-2 py-1 text-xs md:px-3 md:text-sm bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700/30">
              <Shield className="w-2.5 h-2.5 mr-1 md:w-3 md:h-3 md:mr-1.5" />
              No credit card
            </Badge>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 animate-fade-in max-w-4xl">
            <span className="gradient-text">
              <span className="block text-center">
                <RotatingText words={rotatingWords} className="text-4xl md:text-6xl lg:text-7xl" />
              </span>
              <span className="block mt-1 text-center">
                with one line of code
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl mb-8 max-w-2xl animate-fade-in text-gray-700 dark:text-gray-300" style={{ animationDelay: '0.1s' }}>
            Copy - Paste - Done
          </p>

          {/* CTA buttons */}
          <div className="flex flex-row gap-3 mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button size="sm" className="premium-button px-4 md:px-8 text-sm md:text-base md:size-lg" asChild>
              <Link href={isAuthenticated ? "/dashboard" : "https://app.feedbacks.dev/auth"}>
                {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
                <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
              </Link>
            </Button>
            <Button size="sm" variant="outline" className="hover-lift px-4 md:px-6 text-sm md:text-base md:size-lg" asChild>
              <Link href="/docs">View Docs</Link>
            </Button>
          </div>

          {/* Code Window - Compact */}
          <div className="w-full max-w-sm md:max-w-lg animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-premium-lg border border-gray-200/60 dark:border-gray-800 backdrop-blur-sm">
                <CodeSnippet code={sampleCode} className="text-xs md:text-sm" />
              </div>
            </div>
          </div>

          {/* Feature highlights - macOS Style */}
          <div className="flex flex-wrap justify-center items-center gap-1.5 md:gap-3 mt-12 w-full max-w-4xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {[
              { icon: Code, title: "One Line" },
              { icon: Zap, title: "<20KB" },
              { icon: Globe, title: "Universal" },
              { icon: Shield, title: "Secure" }
            ].map((feature, index) => (
              <div 
                key={feature.title} 
                className="flex items-center gap-0.5 md:gap-2 px-1.5 py-0.5 md:px-3 md:py-1.5 rounded-full bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm hover:bg-gray-100 dark:hover:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <feature.icon className="w-2.5 h-2.5 md:w-4 md:h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">{feature.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}