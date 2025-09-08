import { createServerSupabaseClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CopyButton } from '@/components/copy-button';
import { ArrowLeft, ExternalLink, Settings, MessageSquare, Code } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface ProjectPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const supabase = createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth');
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('owner_user_id', user.id)
    .single();

  if (error || !project) {
    redirect('/dashboard');
  }

  const { data: feedbacks } = await supabase
    .from('feedback')
    .select('*')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const WIDGET_VERSION = '1.0'; // Update this when widget version changes
  const widgetCode = `<!-- Feedbacks Widget -->
<script src="https://cdn.jsdelivr.net/gh/WarriorSushi/feedbacks.dev@main/packages/widget/dist/widget-${WIDGET_VERSION}.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/WarriorSushi/feedbacks.dev@main/packages/widget/dist/widget-${WIDGET_VERSION}.css">

<!-- Inline embed -->
<div id="feedback-widget"></div>
<script>
  new FeedbacksWidget({
    projectKey: '${project.api_key}',
    target: '#feedback-widget',
    embedMode: 'inline',
    apiUrl: 'https://app.feedbacks.dev/api/feedback'
  });
</script>`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" asChild className="gap-2">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/settings">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>

        {/* Project Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600 mt-2">Manage your feedback collection</p>
        </div>

        {/* Project Tabs */}
        <Tabs defaultValue="feedback" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Feedback</span>
            </TabsTrigger>
            <TabsTrigger value="widget-installation" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              <span className="hidden sm:inline">Widget Installation</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feedback" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Feedback */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Recent Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {feedbacks && feedbacks.length > 0 ? (
                    <div className="space-y-4">
                      {feedbacks.slice(0, 5).map((feedback) => (
                        <div key={feedback.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={feedback.type === 'bug' ? 'destructive' : 'default'}>
                                  {feedback.type || 'general'}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {new Date(feedback.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-900">{feedback.message}</p>
                              {feedback.email && (
                                <p className="text-sm text-gray-600 mt-1">
                                  From: {feedback.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No feedback yet.</p>
                      <p className="text-sm mt-1">Install the widget to start collecting feedback!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Project Stats Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Total Feedback</Label>
                      <p className="text-2xl font-bold text-blue-600">
                        {feedbacks?.length || 0}
                      </p>
                    </div>
                    <div>
                      <Label>Project ID</Label>
                      <p className="text-sm font-mono text-gray-600">
                        {project.id}
                      </p>
                    </div>
                    <div>
                      <Label>Created</Label>
                      <p className="text-sm text-gray-600">
                        {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <ExternalLink className="h-4 w-4" />
                    View All Feedback
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" asChild>
                    <Link href="/settings">
                      <Settings className="h-4 w-4" />
                      Project Settings
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="widget-installation" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Widget Setup */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Widget Installation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>API Key</Label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        value={project.api_key} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <CopyButton text={project.api_key} />
                    </div>
                  </div>

                  <div>
                    <Label>Widget Code</Label>
                    <div className="relative mt-1">
                      <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{widgetCode}</code>
                      </pre>
                      <CopyButton 
                        text={widgetCode}
                        className="absolute top-2 right-2"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild className="flex-1">
                      <Link 
                        href={process.env.NODE_ENV === 'development' ? "http://localhost:8080" : "https://cdn.jsdelivr.net/gh/WarriorSushi/feedbacks.dev@main/packages/widget/dist/demo.html"} 
                        target="_blank"
                      >
                        Test Widget
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="flex-1">
                      <Link href="https://cdn.jsdelivr.net/gh/WarriorSushi/feedbacks.dev@main/packages/widget/dist/demo.html" target="_blank">
                        View Demo
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="flex-1">
                      <Link href={`/api/projects/${params.id}/feedback.csv`} target="_blank">
                        Export CSV
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project Stats Sidebar for Widget Installation */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Installation Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium">Step 1:</p>
                      <p className="text-gray-600">Copy your API key</p>
                    </div>
                    <div>
                      <p className="font-medium">Step 2:</p>
                      <p className="text-gray-600">Copy the widget code</p>
                    </div>
                    <div>
                      <p className="font-medium">Step 3:</p>
                      <p className="text-gray-600">Paste before closing &lt;/body&gt; tag</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Project Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Project ID</Label>
                      <p className="text-sm font-mono text-gray-600">
                        {project.id}
                      </p>
                    </div>
                    <div>
                      <Label>Created</Label>
                      <p className="text-sm text-gray-600">
                        {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
