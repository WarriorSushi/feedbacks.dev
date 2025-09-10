import * as React from "react"
import { Link } from "react-router-dom"
import { Github, Twitter, Mail, Heart } from "lucide-react"

import { Button } from "@/components/ui/button"

const Footer = () => {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="font-bold text-lg">feedbacks.dev</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              The developer-first feedback widget. Collect user insights without the complexity.
            </p>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <a
                  href="https://github.com/feedbacksdev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 p-0"
                >
                  <Github className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a
                  href="https://twitter.com/feedbacksdev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 p-0"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a
                  href="mailto:hello@feedbacks.dev"
                  className="h-8 w-8 p-0"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="font-semibold">Product</h3>
            <div className="space-y-2 text-sm">
              <Link to="/docs" className="block text-muted-foreground hover:text-primary transition-colors">
                Documentation
              </Link>
              <Link to="/examples" className="block text-muted-foreground hover:text-primary transition-colors">
                Examples
              </Link>
              <Link to="/pricing" className="block text-muted-foreground hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link to="/changelog" className="block text-muted-foreground hover:text-primary transition-colors">
                Changelog
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-semibold">Resources</h3>
            <div className="space-y-2 text-sm">
              <Link to="/blog" className="block text-muted-foreground hover:text-primary transition-colors">
                Blog
              </Link>
              <Link to="/guides" className="block text-muted-foreground hover:text-primary transition-colors">
                Guides
              </Link>
              <Link to="/support" className="block text-muted-foreground hover:text-primary transition-colors">
                Support
              </Link>
              <Link to="/status" className="block text-muted-foreground hover:text-primary transition-colors">
                Status
              </Link>
            </div>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="font-semibold">Company</h3>
            <div className="space-y-2 text-sm">
              <Link to="/about" className="block text-muted-foreground hover:text-primary transition-colors">
                About
              </Link>
              <Link to="/careers" className="block text-muted-foreground hover:text-primary transition-colors">
                Careers
              </Link>
              <Link to="/privacy" className="block text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="block text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 mt-8 border-t">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} feedbacks.dev. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2 md:mt-0">
            Made with <Heart className="w-3 h-3 text-red-500 fill-current" /> for developers
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer