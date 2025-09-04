'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DashboardLayout } from '@/components/dashboard-sidebar';
import { 
  HelpCircle, 
  Book, 
  MessageCircle, 
  Code, 
  Zap, 
  Shield, 
  ExternalLink,
  ChevronRight,
  Mail,
  FileText,
  Video,
  Search
} from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';

export default function HelpPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, [supabase]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading help center...</p>
        </div>
      </div>
    );
  }

  const quickLinks = [
    {
      title: "Getting Started",
      description: "Learn how to set up your first feedback widget",
      icon: Zap,
      href: "#getting-started",
      badge: "Popular"
    },
    {
      title: "Widget Integration",
      description: "Embed the feedback widget on your website",
      icon: Code,
      href: "#widget-integration"
    },
    {
      title: "API Documentation",
      description: "Integrate with our REST API",
      icon: Book,
      href: "#api-docs"
    },
    {
      title: "Security & Privacy",
      description: "Learn about our security measures",
      icon: Shield,
      href: "#security"
    }
  ];

  const faqItems = [
    {
      question: "How do I integrate the widget on my website?",
      answer: "Simply copy the provided script tag from your project settings and paste it before the closing </body> tag of your website."
    },
    {
      question: "Is there a limit to how much feedback I can collect?",
      answer: "Our free plan includes up to 1,000 feedback submissions per month. Paid plans offer higher limits and additional features."
    },
    {
      question: "Can I customize the widget appearance?",
      answer: "Yes! You can customize colors, position, text, and styling through the widget configuration options in your project settings."
    },
    {
      question: "How do I export my feedback data?",
      answer: "You can export your feedback data as CSV, JSON, or PDF from the project dashboard. Go to your project and click the export button."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use industry-standard encryption, secure hosting, and follow GDPR compliance guidelines to protect your data."
    }
  ];

  return (
    <DashboardLayout user={user} projectsCount={0}>
      <div className="p-6 lg:p-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
            <HelpCircle className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Help Center</h1>
            <p className="text-muted-foreground mt-1">
              Find answers, guides, and support for using feedbacks.dev
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link, index) => (
            <Card key={index} className="hover-lift group cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <link.icon className="h-5 w-5 text-accent" />
                  </div>
                  {link.badge && (
                    <Badge variant="secondary" className="bg-accent/10 text-accent">
                      {link.badge}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-2">{link.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {link.description}
                </p>
                <div className="flex items-center text-accent text-sm font-medium">
                  Learn more <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Support */}
        <Card className="hover-lift">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-accent" />
              <CardTitle>Contact Support</CardTitle>
            </div>
            <CardDescription>
              Need personalized help? Get in touch with our support team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/30">
                <Mail className="h-6 w-6 text-accent mb-2" />
                <h3 className="font-medium mb-1">Email Support</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Get help via email within 24 hours
                </p>
                <Button variant="outline" size="sm">
                  Send Email
                </Button>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/30">
                <MessageCircle className="h-6 w-6 text-accent mb-2" />
                <h3 className="font-medium mb-1">Live Chat</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Chat with us in real-time
                </p>
                <Button variant="outline" size="sm">
                  Start Chat
                </Button>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/30">
                <Book className="h-6 w-6 text-accent mb-2" />
                <h3 className="font-medium mb-1">Documentation</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Browse our complete docs
                </p>
                <Button variant="outline" size="sm">
                  View Docs
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-accent" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>
              Quick answers to common questions about feedbacks.dev
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {faqItems.map((faq, index) => (
              <div key={index}>
                <h3 className="font-medium text-lg mb-2">{faq.question}</h3>
                <p className="text-muted-foreground mb-4">{faq.answer}</p>
                {index < faqItems.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Resources */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover-lift">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-accent" />
                <CardTitle>Video Tutorials</CardTitle>
              </div>
              <CardDescription>
                Step-by-step video guides to get you started quickly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Widget Setup Guide</p>
                    <p className="text-sm text-muted-foreground">5 min tutorial</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Watch
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Dashboard Overview</p>
                    <p className="text-sm text-muted-foreground">8 min tutorial</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Watch
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                <CardTitle>Guides & Articles</CardTitle>
              </div>
              <CardDescription>
                In-depth guides and best practices for collecting feedback.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Feedback Best Practices</p>
                    <p className="text-sm text-muted-foreground">10 min read</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Read
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Integration Examples</p>
                    <p className="text-sm text-muted-foreground">15 min read</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Read
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}