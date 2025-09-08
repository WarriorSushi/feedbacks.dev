'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { BackgroundLines } from '@/components/ui/background-lines';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { Plus, BarChart3, Calendar, Mail, ExternalLink, TrendingUp, Users, Clock, MessageSquare, Star, Globe, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDashboard } from '@/components/dashboard-client-layout';
import { AnimatePresence, motion } from 'motion/react';

export default function DashboardPage() {
  const { user, projects } = useDashboard();
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);

  useEffect(() => {
    // Mock recent feedback data - in real app, this would come from Supabase
    const mockFeedback = [
      {
        id: '1',
        email: 'john@example.com',
        message: 'Great product! The interface is very intuitive.',
        rating: 5,
        url: 'https://myapp.com/dashboard',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        project_name: 'My App',
        status: 'new'
      },
      {
        id: '2',
        email: 'sarah@company.com',
        message: 'The loading time could be improved on mobile devices.',
        rating: 3,
        url: 'https://myapp.com/mobile',
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        project_name: 'My App',
        status: 'read'
      },
      {
        id: '3',
        email: 'mike@startup.io',
        message: 'Fantastic integration! Works perfectly with our React app.',
        rating: 5,
        url: 'https://myapp.com/integration',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        project_name: 'Website v2',
        status: 'archived'
      },
      {
        id: '4',
        email: 'lisa@design.co',
        message: 'Would be nice to have more customization options.',
        rating: 4,
        url: 'https://myapp.com/settings',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        project_name: 'Website v2',
        status: 'read'
      }
    ];
    setRecentFeedback(mockFeedback);
  }, []);

  // Calculate total feedback across all projects
  const totalFeedback = projects.reduce((acc, project) => {
    return acc + (project.feedback?.[0]?.count || 0);
  }, 0);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-3 w-3 ${i < rating ? 'text-accent fill-accent' : 'text-muted-foreground'}`} 
      />
    ));
  };

  return (
    <div className="p-6 md:p-6 lg:p-8 space-y-8 md:space-y-8 page-illumination">
        {/* Welcome Section */}
        <div className="animate-fade-in relative rounded-2xl p-4 md:p-6 bg-gradient-to-r from-background via-background to-primary/5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h1 className="text-sm md:text-lg font-medium text-muted-foreground">
                Hi, {user.user_metadata?.full_name || 'Developer'} ✨
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
            {/* Stats Overview - Bento Grid with Card Hover Effects */}
            <BentoGrid className="grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 md:gap-6 max-w-none">
              <BentoGridItem 
                className="hover:shadow-lg transition-all duration-300 bg-card border-border hover:border-primary/20 p-3 md:p-4 lg:p-6 min-h-[120px] md:min-h-[140px]"
                icon={<BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-primary" />}
                title={<span className="text-lg md:text-2xl lg:text-3xl font-bold text-foreground">{projects?.length || 0}</span>}
                description={<div className="space-y-1"><p className="text-xs font-medium text-muted-foreground">Total Projects</p><p className="text-xs text-muted-foreground">Active</p></div>}
              />
              
              <BentoGridItem 
                className="hover:shadow-lg transition-all duration-300 bg-card border-border hover:border-primary/20 p-3 md:p-4 lg:p-6 min-h-[120px] md:min-h-[140px]"
                icon={<Mail className="h-4 w-4 md:h-5 md:w-5 text-primary" />}
                title={<span className="text-lg md:text-2xl lg:text-3xl font-bold text-foreground">{totalFeedback}</span>}
                description={<div className="space-y-1"><p className="text-xs font-medium text-muted-foreground">Total Feedback</p><p className="text-xs text-muted-foreground">Responses</p></div>}
              />
              
              <BentoGridItem 
                className="hover:shadow-lg transition-all duration-300 bg-card border-border hover:border-primary/20 p-3 md:p-4 lg:p-6 min-h-[120px] md:min-h-[140px]"
                icon={<TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" />}
                title={<span className="text-lg md:text-2xl lg:text-3xl font-bold text-foreground">{Math.floor(totalFeedback * 0.3)}</span>}
                description={<div className="space-y-1"><p className="text-xs font-medium text-muted-foreground">Recent Activity</p><p className="text-xs text-muted-foreground">This month</p></div>}
              />
            </BentoGrid>

            {/* Projects Section */}
            <div className="space-y-4 md:space-y-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold">Your Projects</h2>
              </div>

              {projects && projects.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 md:gap-4 lg:gap-6 xl:grid-cols-3">
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
                            <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
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
                  <div className="project-card border-dashed border-2 border-accent/30 rounded-xl p-3 md:p-4 lg:p-6 cursor-pointer group animate-fade-in hover:border-accent/50 transition-colors" style={{ animationDelay: `${0.4 + projects.length * 0.05}s` }}>
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
              <div className="space-y-4">
                {recentFeedback.map((feedback, index) => (
                  <motion.div 
                    key={feedback.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="project-item p-4 rounded-lg relative"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-accent to-primary rounded-l-lg"></div>
                    <div className="flex items-start gap-3 pl-4">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="h-4 w-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <p className="font-medium text-sm truncate">{feedback.email}</p>
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {feedback.project_name}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                            <Clock className="h-3 w-3" />
                            <span className="whitespace-nowrap">{formatTimeAgo(feedback.created_at)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {getRatingStars(feedback.rating)}
                          </div>
                          <span className="text-xs text-muted-foreground">({feedback.rating}/5)</span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {feedback.message}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Globe className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{feedback.url}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
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
