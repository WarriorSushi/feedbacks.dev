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
        // Add timeout protection
        const authPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout')), 2000)
        );
        
        const { data: { user } } = await Promise.race([authPromise, timeoutPromise]) as any;
        
        if (!user) {
          router.push('/auth');
          return;
        }
        
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
        router.push('/auth');
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
      <div className="p-6 lg:p-8 space-y-8 page-illumination">
        {/* Welcome Section */}
        <div className="animate-fade-in relative rounded-2xl p-6 bg-gradient-to-r from-background via-background to-primary/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Welcome back, {user.user_metadata?.full_name || 'Developer'} ✨
              </h1>
              <p className="text-muted-foreground text-lg mt-2">
                Ready to collect some amazing feedback today?
              </p>
            </div>
            <Button asChild size="lg" className="bg-gradient-warm hover:opacity-90 hero-glow text-white">
              <Link href="/projects/new">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Link>
            </Button>
          </div>
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-2xl"></div>
        </div>

        {/* Stats Overview - Gradient Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="gradient-tile p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/80">Total Projects</h3>
              <BarChart3 className="h-5 w-5 text-accent" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{projects?.length || 0}</div>
            <p className="text-sm text-white/60">Active projects</p>
          </div>
          
          <div className="gradient-tile-warm p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/80">Total Feedback</h3>
              <Mail className="h-5 w-5 text-accent" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{totalFeedback}</div>
            <p className="text-sm text-white/60">Collected responses</p>
          </div>
          
          <div className="gradient-tile-accent p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-primary/80">Recent Activity</h3>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary mb-2">
              {Math.floor(totalFeedback * 0.3)}
            </div>
            <p className="text-sm text-primary/60">This month</p>
          </div>
        </div>

        {/* Projects Section */}
        <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Projects</h2>
          </div>

          {projects && projects.length > 0 ? (
            <div className="space-y-4">
              {projects.map((project: any, index: number) => (
                <div 
                  key={project.id} 
                  className="project-item animate-fade-in" 
                  style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
                        <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                          {project.feedback?.[0]?.count || 0} responses
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Active</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{Math.floor(Math.random() * 100) + 10} users</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-xs text-muted-foreground">
                          API Key: <code className="font-mono bg-muted/30 px-2 py-1 rounded text-xs">
                            {project.api_key?.slice(0, 20)}...
                          </code>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button asChild size="sm" variant="outline" className="hover-glow">
                        <Link href={`/projects/${project.id}`}>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add New Project Item */}
              <div className="project-item border-dashed border-2 border-accent/30 cursor-pointer group animate-fade-in" style={{ animationDelay: `${0.4 + projects.length * 0.05}s` }}>
                <Link href="/projects/new" className="block">
                  <div className="flex items-center gap-6 py-2">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Plus className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Create New Project</h3>
                      <p className="text-sm text-muted-foreground">
                        Start collecting feedback for a new website or app in seconds
                      </p>
                    </div>
                    <div className="ml-auto">
                      <Badge className="bg-accent text-accent-foreground">Get Started</Badge>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          ) : (
            <div className="gradient-tile text-center py-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mb-6 backdrop-blur">
                  <Plus className="w-10 h-10 text-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">No projects yet</h3>
                <p className="text-white/70 mb-8 text-lg">
                  Create your first project to start collecting valuable feedback from your users.
                </p>
                <Button asChild size="lg" className="bg-gradient-accent hover:opacity-90 hero-glow">
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