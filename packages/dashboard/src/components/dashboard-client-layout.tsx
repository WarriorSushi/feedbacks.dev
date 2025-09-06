'use client';

import React, { createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { RouteLoading } from '@/components/route-loading';
import { ThemeToggle } from '@/components/theme-toggle';
import { BackButton } from '@/components/back-button';
import { Button } from '@/components/ui/button';
import { BottomBar } from '@/components/bottom-bar';

export interface Project {
  id: string;
  name: string;
  url: string;
  description?: string;
  api_key: string;
  created_at: string;
  updated_at: string;
  owner_user_id: string;
  feedback?: Array<{ count: number }>;
}

interface DashboardContextType {
  user: User;
  projects: Project[];
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardClientLayout');
  }
  return context;
}

interface DashboardClientLayoutProps {
  user: User;
  initialProjects: Project[];
  children: React.ReactNode;
}

export function DashboardClientLayout({ 
  user, 
  initialProjects, 
  children 
}: DashboardClientLayoutProps) {
  const pathname = usePathname();
  const isDashboardPage = pathname === '/dashboard';

  return (
    <DashboardContext.Provider value={{ user, projects: initialProjects }}>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <DashboardSidebar user={user} projectsCount={initialProjects.length} />
          <div className="flex-1 flex flex-col overflow-hidden min-w-0 pt-16 lg:pt-0 transition-opacity duration-150">
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:sticky lg:left-auto">
              {/* Left Side - Menu Button */}
              <div className="flex items-center">
                <SidebarTrigger className="lg:hidden">
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 h-auto bg-white/10 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20 backdrop-blur-sm rounded-xl transition-all duration-300">
                    <div className="flex flex-col gap-1">
                      <div className="w-4 h-0.5 bg-foreground rounded-full transition-all duration-300"></div>
                      <div className="w-4 h-0.5 bg-foreground rounded-full transition-all duration-300"></div>
                      <div className="w-4 h-0.5 bg-foreground rounded-full transition-all duration-300"></div>
                    </div>
                    <span className="text-xs font-medium">Menu</span>
                  </Button>
                </SidebarTrigger>
              </div>
              
              {/* Center Branding */}
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <div className="h-8 w-8 flex items-center justify-center">
                    <img 
                      src="/logo.svg" 
                      alt="feedbacks.dev" 
                      className="h-8 w-8 rounded"
                    />
                  </div>
                  <span className="hidden sm:inline text-sm font-semibold">feedbacks.dev</span>
                </Link>
              </div>
              
              {/* Right Side - Theme Toggle */}
              <div className="flex items-center relative z-10">
                <ThemeToggle className="opacity-100" />
              </div>
            </header>
            {!isDashboardPage && (
              <div className="px-4 py-1 border-b border-border/30">
                <BackButton className="h-6 text-xs px-2" />
              </div>
            )}
            <main className="flex-1 overflow-auto w-full bg-background prevent-bounce">
              <div className="min-h-screen bg-background transition-opacity duration-200 ease-in-out flex flex-col">
                <div className="flex-1 pb-8 sm:pb-12 md:pb-16">
                  <RouteLoading />
                  {children}
                </div>
                <div className="mt-auto">
                  <div className="h-8"></div>
                  <BottomBar />
                </div>
              </div>
            </main>
          </div>
          <MobileBottomNav projectsCount={initialProjects.length} />
        </div>
      </SidebarProvider>
    </DashboardContext.Provider>
  );
}