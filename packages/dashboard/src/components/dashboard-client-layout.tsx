'use client';

/* eslint-disable @next/next/no-img-element */

import React, { createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { RouteLoading } from '@/components/route-loading';
import { ThemeToggle } from '@/components/theme-toggle';
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
  const isProjectDetailPage = pathname.startsWith('/projects/') && pathname.split('/').length > 2;

  return (
    <DashboardContext.Provider value={{ user, projects: initialProjects }}>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <DashboardSidebar user={user} />
          
          {/* Desktop: No top bar, just main content */}
          <div className="hidden lg:flex flex-1 flex-col overflow-hidden">
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
          
          {/* Mobile: Simple header with logo and theme toggle only */}
          <div className="flex lg:hidden flex-1 flex-col overflow-hidden">
            {!isProjectDetailPage && (
              <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                {/* Left: Logo and text */}
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <div className="h-8 w-8 flex items-center justify-center">
                    <img 
                    src="/logo.svg" 
                    alt="feedbacks.dev" 
                    className="h-8 w-8 rounded"
                  />
                  </div>
                  <span className="text-sm font-semibold text-foreground">feedbacks.dev</span>
                </Link>
                
                {/* Right: Theme Toggle */}
                <div className="flex items-center">
                  <ThemeToggle className="opacity-100" />
                </div>
              </header>
            )}
            
            <main className="flex-1 overflow-auto w-full bg-background prevent-bounce">
              <div
                className={'min-h-screen bg-background transition-opacity duration-200 ease-in-out flex flex-col ' + (isProjectDetailPage ? 'pt-4 ' : 'pt-16 ') + ' pb-20'}
              >
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
