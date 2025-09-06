'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useCallback } from 'react';
import {
  Home,
  BarChart3,
  MessageSquare,
  Settings,
  Plus,
  LogOut,
  User as UserIcon,
  HelpCircle,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import type { User } from '@supabase/supabase-js';

interface DashboardSidebarProps {
  user: User;
  projectsCount?: number;
}

export function DashboardSidebar({ user, projectsCount = 0 }: DashboardSidebarProps) {
  const pathname = usePathname();

  const mainNavItems = useMemo(() => [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: BarChart3,
      badge: projectsCount > 0 ? projectsCount.toString() : undefined,
    },
    {
      title: "Feedback",
      url: "/feedback",
      icon: MessageSquare,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ], [projectsCount]);

  const quickActions = useMemo(() => [
    {
      title: "New Project",
      url: "/projects/new",
      icon: Plus,
    },
  ], []);

  const supportItems = useMemo(() => [
    {
      title: "Help & Support",
      url: "/help",
      icon: HelpCircle,
    },
  ], []);

  const handleSignOut = useCallback(async () => {
    try {
      await fetch('/api/sign-out', {
        method: 'POST',
        credentials: 'include',
      });
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  const userInitials = useMemo(() => 
    user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase(),
    [user.user_metadata?.full_name, user.email]
  );

  const displayName = useMemo(() => 
    user.user_metadata?.full_name || 'User',
    [user.user_metadata?.full_name]
  );

  return (
    <Sidebar variant="inset" className="border-r">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 flex items-center justify-center">
            <img 
              src="/logo.svg" 
              alt="Feedbacks.dev Logo" 
              className="h-8 w-8 rounded-lg"
            />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">feedbacks.dev</span>
            <span className="truncate text-xs text-muted-foreground">Dashboard</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-150"
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <IconComponent className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((item) => {
                const IconComponent = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url} className="flex items-center gap-3 text-primary hover:bg-primary/10 transition-colors duration-150">
                        <IconComponent className="h-4 w-4" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Support */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {supportItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url} className="flex items-center gap-3 transition-colors duration-150">
                        <IconComponent className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <Separator className="mb-4" />
        
        {/* Theme Toggle - Desktop Only */}
        <div className="hidden lg:flex justify-center mb-4">
          <ThemeToggle />
        </div>
        
        {/* User Profile */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium block">
              {displayName}
            </span>
            <span className="truncate text-xs text-muted-foreground block">
              {user.email}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" asChild className="flex-1 transition-colors duration-150">
            <Link href="/profile" className="flex items-center gap-2">
              <UserIcon className="h-3 w-3" />
              Profile
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="flex items-center gap-2 transition-colors duration-150"
          >
            <LogOut className="h-3 w-3" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

