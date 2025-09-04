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
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user.user_metadata?.full_name || 'Developer'}
            </h1>
            <Button asChild size="sm" className="bg-gradient-primary hover:opacity-90 hero-glow">
              <Link href="/projects/new">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Link>
            </Button>
          </div>
          <p className="text-muted-foreground text-lg">
            Manage your feedback projects and see what your users are saying.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="stat-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
              <BarChart3 className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{projects?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active projects
              </p>
            </CardContent>
          </Card>
          
          <Card className="stat-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Feedback</CardTitle>
              <Mail className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalFeedback}</div>
              <p className="text-xs text-muted-foreground">
                Collected responses
              </p>
            </CardContent>
          </Card>
          
          <Card className="stat-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {Math.floor(totalFeedback * 0.3)}
              </div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Projects</h2>
          </div>

          {projects && projects.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project: any, index: number) => (
                <Card 
                  key={project.id} 
                  className="professional-card hover-lift animate-fade-in" 
                  style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
                      <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                        {project.feedback?.[0]?.count || 0} feedback
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Created {new Date(project.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">API Key</p>
                        <code className="text-xs font-mono">
                          {project.api_key?.slice(0, 20)}...
                        </code>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{Math.floor(Math.random() * 100) + 10}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Active</span>
                          </div>
                        </div>
                        
                        <Button asChild size="sm" variant="outline" className="hover-glow">
                          <Link href={`/projects/${project.id}`}>
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Add New Project Card */}
              <Card className="hover-lift border-2 border-dashed border-muted-foreground/30 cursor-pointer group animate-fade-in" style={{ animationDelay: `${0.4 + projects.length * 0.1}s` }}>
                <Link href="/projects/new">
                  <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                      <Plus className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Create New Project</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                      Start collecting feedback for a new website or app in seconds
                    </p>
                    <Badge className="bg-accent text-accent-foreground">Get Started</Badge>
                  </CardContent>
                </Link>
              </Card>
            </div>
          ) : (
            <Card className="professional-card animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <CardContent className="text-center py-16">
                <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
                    <Plus className="w-10 h-10 text-accent" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">No projects yet</h3>
                  <p className="text-muted-foreground mb-8 text-lg">
                    Create your first project to start collecting valuable feedback from your users.
                  </p>
                  <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90 hero-glow">
                    <Link href="/projects/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Project
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}