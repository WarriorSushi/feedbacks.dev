import * as React from "react"
import { Check, Zap, Github } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "0",
      description: "Perfect for side projects and getting started",
      badge: "Open Source",
      features: [
        "1 project",
        "100 feedback submissions/month",
        "Basic dashboard",
        "Email support",
        "Powered by feedbacks.dev badge"
      ],
      cta: "Start for Free",
      popular: false
    },
    {
      name: "Pro",
      price: "19",
      description: "For growing projects and professional use",
      badge: "Most Popular",
      features: [
        "5 projects",
        "1,000 feedback submissions/month",
        "Remove branding badge",
        "Slack integration",
        "Priority support",
        "Advanced filtering",
        "Export data (CSV)"
      ],
      cta: "Start Pro Trial",
      popular: true
    },
    {
      name: "Team",
      price: "49",
      description: "For teams and high-volume applications",
      badge: "Best Value",
      features: [
        "Unlimited projects",
        "10,000 feedback submissions/month",
        "Team collaboration",
        "GitHub/Linear integrations",
        "Advanced analytics",
        "Custom webhooks",
        "White-label options"
      ],
      cta: "Start Team Trial",
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free and scale as you grow. All plans include our core features 
            with no hidden fees or surprises.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name} 
              className={`relative hover-lift ${
                plan.popular ? 'border-primary shadow-lg scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-primary px-3 py-1">
                    <Zap className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {plan.name === "Free" && (
                    <Badge variant="secondary" className="text-xs">
                      <Github className="w-3 h-3 mr-1" />
                      OSS
                    </Badge>
                  )}
                </div>
                <div className="mb-2">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </CardContent>

              <CardFooter>
                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-gradient-primary hover:opacity-90' 
                      : ''
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            {[
              {
                q: "What happens when I exceed my plan limits?",
                a: "We'll notify you as you approach your limits. You can upgrade anytime or we'll pause collection until next month. No surprise charges."
              },
              {
                q: "Can I change plans anytime?",
                a: "Yes! Upgrade or downgrade anytime. Changes take effect immediately with prorated billing."
              },
              {
                q: "Do you offer discounts for open source projects?",
                a: "Absolutely! Open source projects get our Pro plan free forever. Just contact us with your project details."
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards and PayPal. All payments are processed securely through Stripe."
              }
            ].map((faq, index) => (
              <Card key={index} className="p-6">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h3 className="text-xl font-semibold mb-4">
            Ready to start collecting feedback?
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90">
              Start Free Today
            </Button>
            <Button size="lg" variant="outline">
              View Documentation
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Pricing