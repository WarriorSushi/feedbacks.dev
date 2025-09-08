'use client';

import { Code, Zap, Globe, Shield, Smartphone, BarChart3, ArrowRight, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function FeaturesSection() {
  const features = [
    {
      icon: Code,
      title: "One-Line Integration",
      description: "Copy, paste, and start collecting feedback immediately. No complex setup or configuration required.",
      badge: "Instant Setup",
      highlight: true
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Widget loads in under 100ms and weighs less than 20KB. Your site performance stays perfect.",
      badge: "<20KB",
      highlight: false
    },
    {
      icon: Globe,
      title: "Cross-Platform", 
      description: "Works everywhere - websites, React Native, Flutter, PWAs. One API for all your projects.",
      badge: "Universal",
      highlight: true
    },
    {
      icon: Shield,
      title: "Privacy Focused",
      description: "GDPR compliant with minimal data collection. Your users' privacy is our priority.",
      badge: "GDPR Ready",
      highlight: false
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Responsive design that works perfectly on desktop, tablet, and mobile devices.",
      badge: "Mobile First",
      highlight: false
    },
    {
      icon: BarChart3,
      title: "Rich Analytics", 
      description: "Get insights into feedback trends, response rates, and user engagement patterns.",
      badge: "Pro Insights",
      highlight: true
    }
  ];

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0" />
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_800px_at_50%_200px,hsl(var(--primary)/0.05),transparent)]" />
      
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <Badge variant="outline" className="mb-6 px-4 py-2 bg-background/80 backdrop-blur-sm border-primary/20">
            <CheckCircle className="w-4 h-4 mr-2 text-primary" />
            Production Ready
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            Everything you need to collect feedback
          </h2>
          <p className="text-xl max-w-3xl mx-auto text-muted-foreground leading-relaxed">
            Built for developers, designed for users. Get the insights you need 
            without compromising on performance or user experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className={`group relative overflow-hidden ${
                feature.highlight ? 'ring-1 ring-primary/20' : ''
              }`}
            >
              {feature.highlight && (
                <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
              )}
              
              <CardHeader className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`relative w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center ${
                    feature.highlight ? 'ring-2 ring-primary/20' : ''
                  }`}>
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs font-medium">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <CardDescription className="text-base leading-relaxed text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardContent>
              
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}