import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MobileNav } from '@/components/mobile-nav';
import { Plus, BarChart3, Calendar, Mail, ExternalLink } from 'lucide-react';

export default function DashboardPage() {
  // TODO: Add back user authentication and data fetching
  const user = { email: 'user@example.com' };
  const projects: any[] = [];
  const totalFeedback = 0;

  // TODO: Redirect to auth if not logged in
  // if (!user) {
  //   redirect('/auth');
  // }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <MobileNav />
              <h1 className="text-xl font-bold text-primary">feedbacks.dev</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild size="sm">
                <Link href="/projects/new" className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Project</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Welcome back!
          </h1>
          <p className="text-muted-foreground">
            Manage your feedback projects and see what your users are saying.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFeedback}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.floor(totalFeedback * 0.3)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Projects</h2>
            <Button asChild size="sm" variant="outline">
              <Link href="/projects/new">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Link>
            </Button>
          </div>

          {projects && projects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project: any) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge variant="secondary">
                        {project.feedback?.[0]?.count || 0} feedback
                      </Badge>
                    </div>
                    <CardDescription>
                      Created {new Date(project.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {project.api_key?.slice(0, 20)}...
                      </code>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/projects/${project.id}`}>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <Plus className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
                  <p className="mb-4 mt-2 text-sm text-muted-foreground">
                    Create your first project to start collecting feedback.
                  </p>
                  <Button asChild size="lg">
                    <Link href="/projects/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}