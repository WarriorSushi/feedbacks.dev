'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  Clock,
  Star,
  User,
  Globe,
  ChevronRight,
  Eye,
  Archive,
  Reply,
  MoreHorizontal
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDashboard } from '@/components/dashboard-client-layout';

interface FeedbackItem {
  id: string;
  email: string;
  message: string;
  rating: number;
  url: string;
  created_at: string;
  project_name: string;
  status: 'new' | 'read' | 'archived';
}

export default function FeedbackPage() {
  const { user, projects } = useDashboard();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProject, setFilterProject] = useState('all');

  useEffect(() => {
    // Mock feedback data - in real app, this would come from Supabase
    const mockFeedback: FeedbackItem[] = [
      {
        id: '1',
        email: 'john@example.com',
        message: 'Great product! The interface is very intuitive and easy to use. I love how responsive the feedback widget is.',
        rating: 5,
        url: 'https://myapp.com/dashboard',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        project_name: 'My App',
        status: 'new'
      },
      {
        id: '2', 
        email: 'sarah@company.com',
        message: 'The loading time could be improved on mobile devices. Also, the submit button sometimes takes a few clicks.',
        rating: 3,
        url: 'https://myapp.com/mobile',
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        project_name: 'My App',
        status: 'read'
      },
      {
        id: '3',
        email: 'mike@startup.io',
        message: 'Fantastic integration! Works perfectly with our React app. The documentation is clear and helpful.',
        rating: 5,
        url: 'https://myapp.com/integration',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        project_name: 'My App',
        status: 'archived'
      },
      {
        id: '4',
        email: 'lisa@design.co',
        message: 'Would be nice to have more customization options for the widget appearance to match our brand colors.',
        rating: 4,
        url: 'https://myapp.com/settings',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        project_name: 'Website v2',
        status: 'read'
      },
      {
        id: '5',
        email: 'alex@tech.com',
        message: 'Bug report: The widget crashes on Safari when submitting feedback with special characters in the message.',
        rating: 2,
        url: 'https://myapp.com/contact',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        project_name: 'Website v2',
        status: 'new'
      }
    ];
    
    setFeedback(mockFeedback);
  }, []);

  const filteredFeedback = feedback.filter(item => {
    const matchesSearch = item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesProject = filterProject === 'all' || item.project_name === filterProject;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const feedbackProjects = Array.from(new Set(feedback.map(f => f.project_name)));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'read': return 'bg-green-100 text-green-800 border-green-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

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

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">All Feedback</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all feedback from your projects.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 grid-cols-2 md:gap-4 lg:gap-6 lg:grid-cols-4">
          <div className="gradient-tile p-3 md:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium opacity-80 leading-tight">Total Feedback</p>
                <p className="text-xl md:text-2xl lg:text-3xl font-bold">{feedback.length}</p>
              </div>
              <MessageSquare className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 opacity-60 flex-shrink-0" />
            </div>
          </div>
          <div className="gradient-tile-warm p-3 md:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium opacity-80 leading-tight">New</p>
                <p className="text-xl md:text-2xl lg:text-3xl font-bold">{feedback.filter(f => f.status === 'new').length}</p>
              </div>
              <Eye className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 opacity-60 flex-shrink-0" />
            </div>
          </div>
          <div className="gradient-tile-accent p-3 md:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium opacity-80 leading-tight">Avg Rating</p>
                <p className="text-xl md:text-2xl lg:text-3xl font-bold">
                  {(feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length).toFixed(1)}
                </p>
              </div>
              <Star className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 opacity-60 flex-shrink-0" />
            </div>
          </div>
          <div className="gradient-tile p-3 md:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium opacity-80 leading-tight">This Week</p>
                <p className="text-xl md:text-2xl lg:text-3xl font-bold">
                  {feedback.filter(f => new Date(f.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                </p>
              </div>
              <Calendar className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 opacity-60 flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Feedback Management</CardTitle>
                <CardDescription>Filter and search through your feedback</CardDescription>
              </div>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search feedback..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {feedbackProjects.map(project => (
                    <SelectItem key={project} value={project}>{project}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Feedback List */}
            <div className="space-y-2">
              {filteredFeedback.length > 0 ? (
                filteredFeedback.map((item) => (
                  <div key={item.id} className="project-item group overflow-hidden">
                    <div className="flex items-start gap-3 p-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Single row layout with all info */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{item.email}</p>
                            <Badge className={`text-xs ${getStatusColor(item.status)} flex-shrink-0`}>
                              {item.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs flex-shrink-0 hidden sm:inline-flex">
                              {item.project_name}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                            <Clock className="h-3 w-3" />
                            <span className="whitespace-nowrap">{formatTimeAgo(item.created_at)}</span>
                          </div>
                        </div>
                        
                        {/* Compact info row */}
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-3">
                            {/* Rating */}
                            <div className="flex items-center gap-1">
                              {getRatingStars(item.rating)}
                              <span className="text-xs text-muted-foreground">({item.rating}/5)</span>
                            </div>
                            
                            {/* URL */}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0 hidden md:flex">
                              <Globe className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate max-w-[200px]">{item.url}</span>
                            </div>
                          </div>
                          
                          {/* Actions - always visible on mobile */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2">
                              <Reply className="h-3 w-3" />
                              <span className="hidden sm:inline ml-1">Reply</span>
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2">
                              <Archive className="h-3 w-3" />
                              <span className="hidden sm:inline ml-1">Archive</span>
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Message */}
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                        
                        {/* Mobile project name */}
                        <div className="mt-1 sm:hidden">
                          <Badge variant="outline" className="text-xs">
                            {item.project_name}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No feedback found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || filterStatus !== 'all' || filterProject !== 'all' 
                      ? 'Try adjusting your filters or search terms.'
                      : 'When users submit feedback through your widget, it will appear here.'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
    </div>
  );
}