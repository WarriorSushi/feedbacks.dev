'use client';

/* eslint-disable @next/next/no-img-element */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { RouteLoading } from '@/components/route-loading';
import { ThemeToggle } from '@/components/theme-toggle';
import { BottomBar } from '@/components/bottom-bar';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

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
  refreshProjects: () => Promise<void>;
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

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const mountedRef = useRef(true);
  const mobileLayoutMetrics = useMemo(
    () =>
      ({
        '--dashboard-mobile-header-height': 'calc(4rem + env(safe-area-inset-top, 0px))',
        '--dashboard-mobile-bottom-offset': 'calc(4.5rem + env(safe-area-inset-bottom, 0px))',
      }) as React.CSSProperties,
    [],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  const refreshProjects = useCallback(async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        feedback:feedback(count)
      `)
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to refresh projects', error);
      return;
    }

    if (data && mountedRef.current) {
      setProjects(data as Project[]);
    }
  }, [supabase, user.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`projects-dashboard-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `owner_user_id=eq.${user.id}`,
        },
        () => {
          void refreshProjects();
        },
      )
      .subscribe();

    void refreshProjects();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshProjects, supabase, user.id]);

  return (
    <DashboardContext.Provider value={{ user, projects, refreshProjects }}>
      <SidebarProvider>
        <div className="flex min-h-dvh w-full bg-background">
          <DashboardSidebar user={user} />

          {/* Desktop: No top bar, just main content */}
          <div className="hidden lg:flex flex-1 flex-col overflow-hidden">
            <main className="flex-1 overflow-auto w-full bg-background prevent-bounce">
              <div className="min-h-dvh bg-background transition-opacity duration-200 ease-in-out flex flex-col">
                <div className="flex-1 pb-8 sm:pb-12 md:pb-16">
                  <RouteLoading />
                  <div className="mx-auto w-full max-w-6xl">
                    {children}
                  </div>
                </div>
                <div className="mt-auto">
                  <BottomBar />
                </div>
              </div>
            </main>
          </div>

          {/* Mobile: Simple header with logo and theme toggle only */}
          <div
            className="flex lg:hidden flex-1 flex-col overflow-hidden"
            style={mobileLayoutMetrics}
          >
            {!isProjectDetailPage && (
              <header
                className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pb-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
                style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
              >
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
                className="min-h-dvh bg-background transition-opacity duration-200 ease-in-out flex flex-col"
                style={{
                  paddingTop: isProjectDetailPage
                    ? 'calc(env(safe-area-inset-top, 0px) + 1rem)'
                    : 'var(--dashboard-mobile-header-height)',
                  paddingBottom: 'var(--dashboard-mobile-bottom-offset)',
                }}
              >
                <div className="flex-1 pb-8 sm:pb-12 md:pb-16">
                  <RouteLoading />
                  <div className="mx-auto w-full max-w-6xl">
                    {children}
                  </div>
                </div>
                <div className="mt-auto">
                  <BottomBar />
                </div>
              </div>
            </main>
          </div>
          
          <MobileBottomNav projectsCount={projects.length} />
        </div>
      </SidebarProvider>
    </DashboardContext.Provider>
  );
}
