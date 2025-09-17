'use client';

/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useCallback, useState, useEffect } from 'react';
import {
  Home,
  BarChart3,
  MessageSquare,
  Settings,
  Plus,
  LogOut,
  User as UserIcon,
  HelpCircle,
  Code,
  ChevronDown,
  MonitorSmartphone,
  Webhook,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeSelectorSidebar } from '@/components/theme-selector-sidebar';
import { useDashboard, type Project } from '@/components/dashboard-client-layout';
import type { User } from '@supabase/supabase-js';

interface DashboardSidebarProps {
  user: User;
}

type ProjectSectionId =
  | 'widget-installation'
  | 'feedback'
  | 'analytics'
  | 'integrations';

const projectSections: Array<{ id: ProjectSectionId; label: string; icon: LucideIcon }> = [
  { id: 'widget-installation', label: 'Widget Installation', icon: Code },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'integrations', label: 'Integrations', icon: Webhook },
];

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const { projects } = useDashboard();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [projectsOpen, setProjectsOpen] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const activeProjectId = useMemo(() => {
    if (!pathname.startsWith('/projects/')) {
      return null;
    }
    const segments = pathname.split('/');
    if (segments.length >= 3 && segments[2]) {
      return segments[2];
    }
    return null;
  }, [pathname]);

  useEffect(() => {
    if (!activeProjectId) {
      return;
    }

    setProjectsOpen(true);
    setExpandedProjects((prev) => {
      if (prev[activeProjectId]) {
        return prev;
      }
      return { ...prev, [activeProjectId]: true };
    });
  }, [activeProjectId]);

  const getDefaultSection = useCallback((project: Project): ProjectSectionId => {
    const feedbackCount = project.feedback?.[0]?.count ?? 0;
    return feedbackCount > 0 ? 'feedback' : 'widget-installation';
  }, []);

  const currentSection = useMemo<ProjectSectionId | null>(() => {
    if (!activeProjectId) {
      return null;
    }

    const explicitSection = searchParams.get('section') as ProjectSectionId | null;
    if (explicitSection && projectSections.some((section) => section.id === explicitSection)) {
      return explicitSection;
    }

    const activeProject = projects.find((project) => project.id === activeProjectId);
    if (!activeProject) {
      return null;
    }

    return getDefaultSection(activeProject);
  }, [activeProjectId, getDefaultSection, projects, searchParams]);

  const toggleProjectExpanded = useCallback((projectId: string) => {
    setExpandedProjects((prev) => ({ ...prev, [projectId]: !prev[projectId] }));
  }, []);

  const handleProjectNavigate = useCallback(
    (project: Project) => {
      const targetSection = getDefaultSection(project);
      setProjectsOpen(true);
      setExpandedProjects((prev) => ({ ...prev, [project.id]: true }));
      router.push('/projects/' + project.id + '?section=' + targetSection);
    },
    [getDefaultSection, router],
  );

  const buildSectionHref = useCallback((projectId: string, section: ProjectSectionId) => {
    const params = new URLSearchParams();
    params.set('section', section);
    return '/projects/' + projectId + '?' + params.toString();
  }, []);

  const mainNavItems = useMemo(
    () => [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: Home,
      },
      {
        title: 'Feedback',
        url: '/feedback',
        icon: MessageSquare,
      },
      {
        title: 'Settings',
        url: '/settings',
        icon: Settings,
      },
    ],
    [],
  );

  const quickActions = useMemo(
    () => [
      {
        title: 'New Project',
        url: '/projects/new',
        icon: Plus,
      },
    ],
    [],
  );

  const supportItems = useMemo(
    () => [
      {
        title: 'Help & Support',
        url: '/help',
        icon: HelpCircle,
      },
    ],
    [],
  );

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

  const userInitials = useMemo(
    () => user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase(),
    [user.user_metadata?.full_name, user.email],
  );

  const displayName = useMemo(
    () => user.user_metadata?.full_name || 'User',
    [user.user_metadata?.full_name],
  );

  return (
    <Sidebar variant="inset" className="border-r">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2">
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
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url} className="flex items-center gap-3">
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

        <SidebarGroup>
          <SidebarGroupLabel
            role="button"
            tabIndex={0}
            onClick={() => setProjectsOpen((prev) => !prev)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setProjectsOpen((prev) => !prev);
              }
            }}
            className="cursor-pointer select-none"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Projects</span>
          </SidebarGroupLabel>
          <SidebarGroupAction
            type="button"
            aria-label={projectsOpen ? 'Collapse project list' : 'Expand project list'}
            onClick={() => setProjectsOpen((prev) => !prev)}
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', projectsOpen ? 'rotate-0' : '-rotate-90')} />
          </SidebarGroupAction>
          {projectsOpen && (
            <SidebarGroupContent>
              <SidebarMenu>
                {projects.length === 0 && (
                  <SidebarMenuItem>
                    <div className="px-2 py-1 text-xs text-muted-foreground">
                      Create your first project to get started.
                    </div>
                  </SidebarMenuItem>
                )}
                {projects.map((project) => {
                  const feedbackCount = project.feedback?.[0]?.count ?? 0;
                  const isProjectActive = activeProjectId === project.id;
                  const isExpanded = expandedProjects[project.id] || false;

                  return (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton
                        type="button"
                        isActive={isProjectActive}
                        onClick={() => handleProjectNavigate(project)}
                        className="justify-between"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{project.name}</span>
                        </span>
                        <Badge variant="secondary" className="bg-accent/20 text-xs text-muted-foreground">
                          {feedbackCount}
                        </Badge>
                      </SidebarMenuButton>
                      <SidebarMenuAction
                        type="button"
                        aria-label={isExpanded ? 'Collapse project sections' : 'Expand project sections'}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleProjectExpanded(project.id);
                        }}
                      >
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform',
                            isExpanded ? 'rotate-0' : '-rotate-90',
                          )}
                        />
                      </SidebarMenuAction>
                      {isExpanded && (
                        <SidebarMenuSub>
                          {projectSections.map((section) => {
                            const SectionIcon = section.icon;
                            const isActiveSection = isProjectActive && currentSection === section.id;

                            return (
                              <SidebarMenuSubItem key={project.id + '-' + section.id}>
                                <SidebarMenuSubButton asChild isActive={isActiveSection}>
                                  <Link href={buildSectionHref(project.id, section.id)} className="flex items-center gap-2">
                                    <SectionIcon className="h-4 w-4" />
                                    <span>{section.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((item) => {
                const IconComponent = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url} className="flex items-center gap-3 text-primary">
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

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {supportItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url} className="flex items-center gap-3">
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

        <div className="hidden lg:block mb-4 space-y-2">
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
          <ThemeSelectorSidebar />
        </div>

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
          <Button variant="ghost" size="sm" asChild className="flex-1">
            <Link href="/profile" className="flex items-center gap-2">
              <UserIcon className="h-3 w-3" />
              Profile
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-3 w-3" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
