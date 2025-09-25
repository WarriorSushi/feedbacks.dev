'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackgroundLines } from '@/components/ui/background-lines';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { StatsCard } from '@/components/ui/stats-card';
import { FeedbackCard } from '@/components/ui/feedback-card';
import { Plus, BarChart3, Calendar, Mail, ExternalLink, TrendingUp, Users, Clock, MessageSquare, PlayCircle, Settings, BookOpen, Code2, ShieldCheck } from 'lucide-react';
import { OverviewAnalytics } from '@/components/overview-analytics';
import { ProjectsComparison } from '@/components/projects-comparison';
import { useEffect, useState } from 'react';
import { useDashboard } from '@/components/dashboard-client-layout';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { ClientDate } from '@/components/client-date';

export default function DashboardPage() {
  const { user, projects } = useDashboard();
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const projectIds = projects.map(p => p.id);
        if (!projectIds.length) {
          setRecentFeedback([]);
          return;
        }
        const { data, error } = await supabase
          .from('feedback')
          .select('*')
          .in('project_id', projectIds)
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) {
          console.error('Load feedback error:', error);
          setRecentFeedback([]);
          return;
        }
        const idToName = new Map(projects.map(p => [p.id, p.name] as const));
        const mapped = (data || []).map((f: any) => ({
          id: f.id,
          email: f.email || 'anonymous',
          message: f.message,
          rating: typeof f.rating === 'number' ? f.rating : 0,
          url: f.url,
          created_at: f.created_at,
          project_name: idToName.get(f.project_id) || 'Project',
          status: f.is_read ? 'read' : 'new',
        }));
        setRecentFeedback(mapped);
      } catch (e) {
        console.error('Recent feedback load failed:', e);
        setRecentFeedback([]);
      }
    };
    run();
  }, [projects]);

  // Calculate total feedback across all projects
  const totalFeedback = projects.reduce((acc, project) => {
    return acc + (project.feedback?.[0]?.count || 0);
  }, 0);


  return (
    <div className="py-6 lg:py-8 space-y-8 md:space-y-8 page-illumination">
        {/* Welcome Section */}
        <div className="relative rounded-2xl p-4 md:p-6 bg-gradient-to-r from-background via-background to-primary/5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h1 className="text-sm md:text-lg font-medium text-muted-foreground">
                Hi, {user?.user_metadata?.full_name || 'Developer'} ✨
              </h1>
              <p className="text-muted-foreground text-sm md:text-lg mt-1 md:mt-2">
                Ready to collect some amazing feedback today?
              </p>
            </div>
            <HoverBorderGradient
              containerClassName="rounded-full w-full md:w-auto shrink-0"
              className="dark:bg-black bg-white text-black dark:text-white flex items-center justify-center space-x-2 px-4 py-2"
            >
              <Link href="/projects/new" className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Project</span>
              </Link>
            </HoverBorderGradient>
          </div>
          
          <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-2xl"></div>
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="overview" className="w-full">

          <TabsList className="grid w-full grid-cols-2 mb-6 bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="recent-feedback" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
            >
              Recent Feedbacks
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6 md:space-y-8">
            {/* Stats Overview - Enhanced Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
              <StatsCard
                title="Total Projects"
                value={projects?.length || 0}
                description="Active projects"
                icon={<BarChart3 className="h-4 w-4 md:h-5 md:w-5" />}
                className="animate-fade-in"
              />
              
              <StatsCard
                title="Total Feedback"
                value={totalFeedback}
                description="Total responses"
                icon={<Mail className="h-4 w-4 md:h-5 md:w-5" />}
                className="animate-fade-in"
              />
              
              <StatsCard
                title="Recent Activity"
                value={Math.floor(totalFeedback * 0.3)}
                description="This month"
                icon={<TrendingUp className="h-4 w-4 md:h-5 md:w-5" />}
                className="animate-fade-in"
              />
            </div>

            {/* Guided Setup + Resources */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" /> Quick Start
                  </CardTitle>
                  <CardDescription>Follow these steps to start collecting feedback.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2 font-medium mb-1"><Plus className="h-4 w-4" /> Create a Project</div>
                      <p className="text-sm text-muted-foreground">Set up a project to generate an API key.</p>
                      <div className="mt-2"><Link href="/projects/new" className="text-sm underline">Create Project →</Link></div>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2 font-medium mb-1"><Settings className="h-4 w-4" /> Configure the Widget</div>
                      <p className="text-sm text-muted-foreground">Choose mode, colors, and success messages.</p>
                      <div className="mt-2"><Link href="/projects" className="text-sm underline">Open Installer →</Link></div>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2 font-medium mb-1"><PlayCircle className="h-4 w-4" /> Test & Install</div>
                      <p className="text-sm text-muted-foreground">Preview live and copy the tailored snippet.</p>
                      <div className="mt-2"><Link href="/widget-demo" className="text-sm underline">Open Live Demo →</Link></div>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2 font-medium mb-1"><TrendingUp className="h-4 w-4" /> Verify Submissions</div>
                      <p className="text-sm text-muted-foreground">View new feedback in your dashboard.</p>
                      <div className="mt-2"><Link href="/feedback" className="text-sm underline">View Feedback →</Link></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Resources</CardTitle>
                  <CardDescription>Helpful links to get you going.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/docs" className="text-sm flex items-center gap-2 underline"><Code2 className="h-4 w-4" /> Docs</Link>
                  <Link href="/terms" className="text-sm flex items-center gap-2 underline"><ShieldCheck className="h-4 w-4" /> Terms & Privacy</Link>
                  <a href="https://github.com/WarriorSushi/feedbacks.dev" target="_blank" className="text-sm flex items-center gap-2 underline"><ExternalLink className="h-4 w-4" /> GitHub</a>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Components */}
            {projects && projects.length > 0 && (
              <>
                <ProjectsComparison projects={projects.map((p: any) => ({ id: p.id, name: p.name }))} />
                <OverviewAnalytics />
              </>
            )}

            {/* Projects Section */}
            <div className="space-y-4 md:space-y-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold">Your Projects</h2>
              </div>

              {projects && projects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
                  {projects.map((project: any, index: number) => (
                    <div 
                      key={project.id} 
                      className="project-card bg-card rounded-xl border border-border p-3 md:p-4 lg:p-6 hover:shadow-lg transition-all duration-300 animate-fade-in" 
                      style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                    >
                      <div className="space-y-3 md:space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm md:text-base lg:text-lg font-semibold text-foreground truncate mb-2">
                              {project.name}
                            </h3>
                            <div className="flex flex-wrap gap-1.5 mb-2 md:mb-3">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50 text-xs">
                                {project.feedback?.[0]?.count || 0} responses
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-1.5 md:space-y-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <ClientDate date={project.created_at} prefix="Created " />
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3 flex-shrink-0" />
                            <span>{Math.floor(Math.random() * 100) + 10} users</span>
                          </div>
                        </div>
                        
                        
                        <div className="flex gap-2 pt-1 md:pt-2">
                          <Button asChild size="sm" variant="outline" className="flex-1 hover-glow h-8">
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
                  <div className="project-card border-dashed border-2 border-accent/30 rounded-xl p-3 md:p-4 lg:p-6 cursor-pointer group">
                    <Link href="/projects/new" className="block h-full">
                      <div className="flex flex-col items-center justify-center text-center h-full min-h-[160px] md:min-h-[200px] space-y-3 md:space-y-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                          <Plus className="w-5 h-5 md:w-6 md:h-6 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm md:text-base lg:text-lg mb-2">Create New Project</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Start collecting feedback for a new website or app
                          </p>
                        </div>
                        <Badge className="bg-accent text-accent-foreground text-xs">Get Started</Badge>
                      </div>
                    </Link>
                  </div>
                </div>
              ) : (
                <BackgroundLines className="flex h-[400px] w-full flex-col items-center justify-center px-4">
                  <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-accent/20 flex items-center justify-center mb-6 backdrop-blur">
                      <Plus className="w-8 h-8 md:w-10 md:h-10 text-accent" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-3">No projects yet</h3>
                    <p className="mb-6 md:mb-8 text-sm md:text-lg opacity-70">
                      Create your first project to start collecting valuable feedback from your users.
                    </p>
                    <HoverBorderGradient
                      containerClassName="rounded-full w-full md:w-auto"
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
          </TabsContent>

          <TabsContent value="recent-feedback" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Feedbacks
              </h2>
              <Button asChild size="sm" variant="outline">
                <Link href="/feedback">
                  View All
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
            
            {recentFeedback.length > 0 ? (
              <div className="space-y-3">
                {recentFeedback.map((feedback, index) => (
                  <FeedbackCard 
                    key={feedback.id}
                    feedback={feedback}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <BackgroundLines className="flex h-[300px] w-full flex-col items-center justify-center px-4">
                <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-6">
                    <MessageSquare className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">No recent feedback</h3>
                  <p className="mb-6 text-sm opacity-70">
                    When users submit feedback through your widgets, the most recent ones will appear here.
                  </p>
                </div>
              </BackgroundLines>
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
}