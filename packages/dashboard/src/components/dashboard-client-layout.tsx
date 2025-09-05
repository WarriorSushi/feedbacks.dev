'use client';

import React, { createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { RouteLoading } from '@/components/route-loading';

export interface Project {
  id: string;
  name: string;
  url: string;
  description?: string;
  api_key: string;
  created_at: string;
  updated_at: string;
  owner_user_id: string;
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
  return (
    <DashboardContext.Provider value={{ user, projects: initialProjects }}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <RouteLoading />
          <DashboardSidebar />
          <main className="flex-1 flex flex-col overflow-hidden">
            {children}
          </main>
          <MobileBottomNav projectsCount={initialProjects.length} />
        </div>
      </SidebarProvider>
    </DashboardContext.Provider>
  );
}