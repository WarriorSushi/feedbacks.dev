'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { BackgroundLines } from '@/components/ui/background-lines';
import { Plus, BarChart3, Calendar, ExternalLink, Users, Clock } from 'lucide-react';
import { useDashboard } from '@/components/dashboard-client-layout';

export default function ProjectsPage() {
  const { user, projects } = useDashboard();

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Your Projects</h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              Manage all your feedback collection projects in one place.
            </p>
          </div>
          <HoverBorderGradient
            containerClassName="rounded-full w-full sm:w-auto"
            className="dark:bg-black bg-white text-black dark:text-white flex items-center justify-center space-x-2 px-4 py-2"
          >
            <Link href="/projects/new" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </Link>
          </HoverBorderGradient>
        </div>

        {projects.length > 0 ? (
          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((project: any, index: number) => (
              <Card key={project.id} className="">
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
          <BackgroundLines className="flex h-[500px] w-full flex-col items-center justify-center px-4">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mb-6">
                <Plus className="w-10 h-10 opacity-70" />
              </div>
              <h3 className="text-2xl font-bold mb-3">No projects yet</h3>
              <p className="mb-8 text-lg opacity-70">
                Create your first project to start collecting valuable feedback from your users.
              </p>
              <HoverBorderGradient
                containerClassName="rounded-full"
                className="dark:bg-black bg-white text-black dark:text-white flex items-center justify-center space-x-2 px-6 py-3"
              >
                <Link href="/projects/new" className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Create Your First Project</span>
                </Link>
              </HoverBorderGradient>
            </div>
          </BackgroundLines>
        )}
    </div>
  );
}