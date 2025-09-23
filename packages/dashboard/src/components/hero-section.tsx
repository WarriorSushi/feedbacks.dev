'use client';

import Link from 'next/link';
import { ArrowRight, Code, Zap, Globe, Shield, Users, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CodeSnippet } from '@/components/code-snippet';
import { TypewriterText } from '@/components/ui/typewriter-text';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';

interface HeroSectionProps {
  isAuthenticated?: boolean;
}

export function HeroSection({ isAuthenticated = false }: HeroSectionProps) {
  const sampleCode = `<script 
  src="https://app.feedbacks.dev/cdn/widget/1.0.js" 
  data-project="feedbacks_dev_api_key_abc123" 
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
          {/* Three Badge Capsules */}
          <div className="flex flex-wrap justify-center gap-2 mb-6 mt-8">
            <Badge variant="secondary" className="px-2 py-1 text-xs md:px-3 md:text-sm">
              <Zap className="w-2.5 h-2.5 mr-1 md:w-3 md:h-3 md:mr-1.5" />
              Lightning fast
            </Badge>
            <Badge variant="secondary" className="px-2 py-1 text-xs md:px-3 md:text-sm">
              <Code className="w-2.5 h-2.5 mr-1 md:w-3 md:h-3 md:mr-1.5" />
              Open source
            </Badge>
            <Badge variant="secondary" className="px-2 py-1 text-xs md:px-3 md:text-sm">
              <Shield className="w-2.5 h-2.5 mr-1 md:w-3 md:h-3 md:mr-1.5" />
              No credit card
            </Badge>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 max-w-4xl">
            <span>
              <span className="block text-center">
                <TypewriterText
                  words={rotatingWords}
                  className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary"
                  typeSpeed={60}
                  deleteSpeed={40}
                  pauseDuration={150}
                />
              </span>
              <span className="block mt-1 text-center">
                with one line of code
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl mb-8 max-w-2xl text-muted-foreground">
            Copy - Paste - Done
          </p>

          {/* CTA buttons */}
          <div className="flex flex-row gap-3 mb-10">
            <Button size="lg" asChild>
              <Link href={isAuthenticated ? "/dashboard" : "/auth"} className="flex items-center gap-2 px-5 md:px-7">
                <span>{isAuthenticated ? "Go to Dashboard" : "Get Started Free"}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/docs" className="px-5 md:px-7">View Docs</Link>
            </Button>
          </div>

          {/* Code Window - Compact */}
          <div className="w-full max-w-sm md:max-w-lg">
            <div className="relative">
              <div className="relative bg-card rounded-xl overflow-hidden shadow-lg border">
                <CodeSnippet code={sampleCode} className="text-xs md:text-sm" />
              </div>
            </div>
          </div>

          {/* Feature highlights - macOS Style */}
          <div className="flex flex-wrap justify-center items-center gap-1.5 md:gap-3 mt-12 w-full max-w-4xl">
            {[
              { icon: Code, title: "One Line" },
              { icon: Zap, title: "<20KB" },
              { icon: Globe, title: "Universal" },
              { icon: Shield, title: "Secure" }
            ].map((feature, index) => (
              <div 
                key={feature.title} 
                className="flex items-center gap-1 md:gap-2 px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-muted/50 border shadow-sm"
              >
                <feature.icon className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                <span className="text-xs md:text-sm font-medium">{feature.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
