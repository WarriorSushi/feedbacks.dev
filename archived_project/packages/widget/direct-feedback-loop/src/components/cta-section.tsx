import * as React from "react"
import { ArrowRight, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const CTASection = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-primary rounded-full opacity-20 blur-3xl" />
      
      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-2">
            <Sparkles className="w-3 h-3 mr-2" />
            Ready to get started?
          </Badge>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
            Start collecting feedback
            <span className="gradient-text block">in under 60 seconds</span>
          </h2>

          <p className="text-xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Join hundreds of developers who trust feedbacks.dev to understand their users better. 
            Free forever for open source projects.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 hero-glow" asChild>
              <Link to="/dashboard">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <Button size="lg" variant="outline" className="hover-lift" asChild>
              <Link to="/docs">
                View Documentation
              </Link>
            </Button>
          </div>

          <div className="mt-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <p>No credit card required • 100 feedback submissions free • Cancel anytime</p>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <p className="text-sm text-muted-foreground mb-4">Trusted by developers worldwide</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {[
                "React", "Next.js", "Vue", "Angular", "Svelte", "Flutter"
              ].map((framework, index) => (
                <div 
                  key={framework} 
                  className="text-sm font-medium animate-fade-in"
                  style={{ animationDelay: `${1 + index * 0.1}s` }}
                >
                  {framework}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTASection