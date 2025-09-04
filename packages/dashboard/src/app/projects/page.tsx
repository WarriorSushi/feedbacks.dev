'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/dashboard-sidebar';
import { Plus, BarChart3, Calendar, ExternalLink, Users, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export default function ProjectsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        setUser(user);

        const { data: projectsData, error } = await supabase
          .from('projects')
          .select(`
            *,
            feedback:feedback(count)
          `)
          .eq('owner_user_id', user.id);

        if (!error) {
          setProjects(projectsData || []);
        }
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [supabase]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout user={user} projectsCount={projects.length}>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Your Projects</h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              Manage all your feedback collection projects in one place.
            </p>
          </div>
          <Button asChild size="default" className="bg-gradient-primary hover:opacity-90 transition-opacity duration-150 w-full sm:w-auto">
            <Link href="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
        </div>

        {projects.length > 0 ? (
          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((project: any, index: number) => (
              <Card key={project.id} className="hover-lift animate-fade-in transition-all duration-200" style={{ animationDelay: `${index * 0.05}s` }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base lg:text-lg truncate">{project.name}</CardTitle>
                    <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 text-xs flex-shrink-0">
                      {project.feedback?.[0]?.count || 0}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3" />
                    <span className="truncate">Created {new Date(project.created_at).toLocaleDateString()}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* API Key - Hidden on mobile, compact on desktop */}
                    <div className="hidden sm:block p-2 md:p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">API Key</p>
                      <code className="text-xs font-mono break-all">
                        {project.api_key?.slice(0, 15)}...
                      </code>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{Math.floor(Math.random() * 100) + 10}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Active</span>
                        </div>
                      </div>
                      
                      <Button asChild size="sm" variant="outline" className="h-8 transition-colors duration-150">
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
          </div>
        ) : (
          <div className="gradient-tile text-center py-16">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mb-6">
                <Plus className="w-10 h-10 opacity-70" />
              </div>
              <h3 className="text-2xl font-bold mb-3">No projects yet</h3>
              <p className="mb-8 text-lg opacity-70">
                Create your first project to start collecting valuable feedback from your users.
              </p>
              <Button asChild size="lg" className="bg-gradient-accent hover:opacity-90">
                <Link href="/projects/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}