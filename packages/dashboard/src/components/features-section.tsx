'use client';

import { Code, Zap, Globe, Shield, Smartphone, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function FeaturesSection() {
  const features = [
    {
      icon: Code,
      title: "One-Line Integration",
      description: "Copy, paste, and start collecting feedback immediately. No complex setup or configuration required."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Widget loads in under 100ms and weighs less than 20KB. Your site performance stays perfect."
    },
    {
      icon: Globe,
      title: "Cross-Platform", 
      description: "Works everywhere - websites, React Native, Flutter, PWAs. One API for all your projects."
    },
    {
      icon: Shield,
      title: "Privacy Focused",
      description: "GDPR compliant with minimal data collection. Your users' privacy is our priority."
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Responsive design that works perfectly on desktop, tablet, and mobile devices."
    },
    {
      icon: BarChart3,
      title: "Rich Analytics", 
      description: "Get insights into feedback trends, response rates, and user engagement patterns."
    }
  ];

  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to collect feedback
          </h2>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: '#1a1a1a' }}>
            Built for developers, designed for users. Get the insights you need 
            without compromising on performance or user experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className="hover-lift border-0 bg-background/60 backdrop-blur-sm animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base" style={{ color: '#1a1a1a' }}>
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