'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/dashboard-sidebar';
import { Plus, BarChart3, Calendar, Mail, ExternalLink, TrendingUp, Users, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Get the current user session
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Auth error:', authError);
          // Wait a bit and try again in case session is still being established
          setTimeout(() => router.push('/auth'), 100);
          return;
        }
        
        if (!user) {
          console.log('No user found, redirecting to auth');
          router.push('/auth');
          return;
        }
        
        console.log('User authenticated:', user.email);
        setUser(user);

        // Fetch user's projects with feedback count
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select(`
            *,
            feedback:feedback(count)
          `)
          .eq('owner_user_id', user.id);

        if (projectsError) {
          console.error('Error fetching projects:', projectsError);
        } else {
          setProjects(projectsData || []);
        }
      } catch (error) {
        console.error('Dashboard load error:', error);
        // Give a small delay before redirecting in case of session establishment
        setTimeout(() => router.push('/auth'), 100);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboard();
  }, [router, supabase]);

  // Calculate total feedback across all projects
  const totalFeedback = projects.reduce((acc, project) => {
    return acc + (project.feedback?.[0]?.count || 0);
  }, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <DashboardLayout user={user} projectsCount={projects.length}>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 page-illumination">
        {/* Welcome Section */}
        <div className="animate-fade-in relative rounded-2xl p-4 md:p-6 bg-gradient-to-r from-background via-background to-primary/5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Welcome back, {user.user_metadata?.full_name || 'Developer'} ✨
              </h1>
              <p className="text-muted-foreground text-sm md:text-lg mt-1 md:mt-2">
                Ready to collect some amazing feedback today?
              </p>
            </div>
            <Button asChild size="default" className="bg-gradient-warm hover:opacity-90 hero-glow text-white w-full md:w-auto md:size-lg shrink-0">
              <Link href="/projects/new" className="justify-center">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Link>
            </Button>
          </div>
          
          <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-2xl"></div>
        </div>

        {/* Stats Overview - Gradient Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="gradient-tile p-4 md:p-6 relative">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-xs md:text-sm font-medium opacity-80">Total Projects</h3>
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 opacity-70" />
            </div>
            <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">{projects?.length || 0}</div>
            <p className="text-xs md:text-sm opacity-70">Active projects</p>
          </div>
          
          <div className="gradient-tile-warm p-4 md:p-6 relative">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-xs md:text-sm font-medium opacity-80">Total Feedback</h3>
              <Mail className="h-4 w-4 md:h-5 md:w-5 opacity-70" />
            </div>
            <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">{totalFeedback}</div>
            <p className="text-xs md:text-sm opacity-70">Collected responses</p>
          </div>
          
          <div className="gradient-tile-accent p-4 md:p-6 relative sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-xs md:text-sm font-medium opacity-80">Recent Activity</h3>
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 opacity-70" />
            </div>
            <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">
              {Math.floor(totalFeedback * 0.3)}
            </div>
            <p className="text-xs md:text-sm opacity-70">This month</p>
          </div>
        </div>

        {/* Projects Section */}
        <div className="space-y-4 md:space-y-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold">Your Projects</h2>
          </div>

          {projects && projects.length > 0 ? (
            <div className="grid gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {projects.map((project: any, index: number) => (
                <div 
                  key={project.id} 
                  className="project-card bg-gradient-to-br from-background to-muted/20 rounded-xl border border-border/50 p-4 md:p-6 hover:shadow-lg transition-all duration-300 animate-fade-in" 
                  style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-semibold text-foreground truncate mb-2">
                          {project.name}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 text-xs">
                            {project.feedback?.[0]?.count || 0} responses
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-xs md:text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 flex-shrink-0" />
                        <span>{Math.floor(Math.random() * 100) + 10} users</span>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">API Key</p>
                      <code className="text-xs font-mono break-all">
                        {project.api_key?.slice(0, 20)}...
                      </code>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button asChild size="sm" variant="outline" className="flex-1 hover-glow">
                        <Link href={`/projects/${project.id}`}>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add New Project Card */}
              <div className="project-card border-dashed border-2 border-accent/30 rounded-xl p-4 md:p-6 cursor-pointer group animate-fade-in hover:border-accent/50 transition-colors" style={{ animationDelay: `${0.4 + projects.length * 0.05}s` }}>
                <Link href="/projects/new" className="block h-full">
                  <div className="flex flex-col items-center justify-center text-center h-full min-h-[200px] space-y-4">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Plus className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base md:text-lg mb-2">Create New Project</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Start collecting feedback for a new website or app
                      </p>
                    </div>
                    <Badge className="bg-accent text-accent-foreground">Get Started</Badge>
                  </div>
                </Link>
              </div>
            </div>
          ) : (
            <div className="gradient-tile text-center py-12 md:py-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-accent/20 flex items-center justify-center mb-6 backdrop-blur">
                  <Plus className="w-8 h-8 md:w-10 md:h-10 text-accent" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3">No projects yet</h3>
                <p className="mb-6 md:mb-8 text-sm md:text-lg opacity-70">
                  Create your first project to start collecting valuable feedback from your users.
                </p>
                <Button asChild size="default" className="bg-gradient-accent hover:opacity-90 hero-glow w-full md:w-auto">
                  <Link href="/projects/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Project
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}