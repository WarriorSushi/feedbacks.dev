import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { Github } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

const Navigation = () => {
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-bold text-lg">feedbacks.dev</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/docs"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive("/docs") ? "text-primary" : "text-muted-foreground"
              )}
            >
              Documentation
            </Link>
            <Link
              to="/pricing"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive("/pricing") ? "text-primary" : "text-muted-foreground"
              )}
            >
              Pricing
            </Link>
            <Link
              to="/examples"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive("/examples") ? "text-primary" : "text-muted-foreground"
              )}
            >
              Examples
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <a
              href="https://github.com/feedbacksdev"
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 w-9 px-0"
            >
              <Github className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </a>
          </Button>

          <ThemeToggle />

          <div className="hidden sm:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button size="sm" className="bg-gradient-primary hover:opacity-90" asChild>
              <Link to="/dashboard">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navigation