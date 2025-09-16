"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessageSquare,
  Search,
  Download,
  Clock,
  Star,
  User,
  Globe,
  Reply,
  Archive,
  MoreHorizontal,
  Paperclip,
  Eye,
  Calendar,
  Mail,
  MonitorSmartphone,
} from "lucide-react";
import { ImageLightbox } from "@/components/image-lightbox";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useDashboard } from "@/components/dashboard-client-layout";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

interface FeedbackItem {
  id: string;
  email: string;
  message: string;
  rating: number;
  url: string;
  created_at: string;
  project_name: string;
  type?: 'bug' | 'idea' | 'praise';
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  screenshot_url?: string;
  project_id?: string;
  attachments?: Array<{ url: string; name?: string; type?: string; size?: number }>;
  status: "new" | "read" | "archived";
}

export default function FeedbackPage() {
  const { projects } = useDashboard();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkTag, setBulkTag] = useState("");
  const [removeTagValue, setRemoveTagValue] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [selectAllFiltered, setSelectAllFiltered] = useState(false);
  const supabase = createBrowserSupabaseClient();

  // Compute selected project id from name filter
  const selectedProjectId = useMemo(() => {
    if (filterProject === 'all') return null;
    const match = projects.find((p) => p.name === filterProject);
    return match?.id || null;
  }, [filterProject, projects]);

  const buildFilters = useCallback((q: any) => {
    if (selectedProjectId) q = q.eq('project_id', selectedProjectId);
    else q = q.in('project_id', projects.map((p) => p.id));
    if (filterStatus !== 'all') {
      if (filterStatus === 'archived') q = q.eq('archived', true);
      else q = q.eq('is_read', filterStatus === 'read');
    }
    if (filterType !== 'all') q = q.eq('type', filterType);
    if (filterRating !== 'all') q = q.eq('rating', Number(filterRating));
    if (searchTerm.trim()) {
      const term = `%${searchTerm.trim()}%`;
      q = q.or(`message.ilike.${term},email.ilike.${term}`);
    }
    return q;
  }, [selectedProjectId, projects, filterStatus, filterType, filterRating, searchTerm]);

  useEffect(() => {
    const run = async () => {
      const ids = projects.map((p) => p.id);
      if (!ids.length) { setFeedback([]); setTotalCount(0); return; }
      // Count
      let countQ = supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true });
      countQ = buildFilters(countQ);
      const { count } = await countQ;
      setTotalCount(count || 0);
      // Page data
      let dataQ = supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      dataQ = buildFilters(dataQ);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await dataQ.range(from, to);
      if (error) {
        console.error('Load feedback error:', error);
        setFeedback([]);
        return;
      }
      const idToName = new Map(projects.map((p) => [p.id, p.name] as const));
      const mapped = (data || []).map((f: any) => ({
        id: f.id,
        email: f.email || 'anonymous',
        message: f.message,
        rating: typeof f.rating === 'number' ? f.rating : 0,
        url: f.url,
        created_at: f.created_at,
        project_id: f.project_id,
        project_name: idToName.get(f.project_id) || 'Project',
        type: f.type || undefined,
        priority: f.priority || undefined,
        tags: Array.isArray(f.tags) ? f.tags : [],
        screenshot_url: f.screenshot_url || undefined,
        attachments: Array.isArray(f.attachments) ? f.attachments : [],
        status: (f.archived ? 'archived' : (f.is_read ? 'read' : 'new')) as 'new' | 'read' | 'archived',
      }));
      setFeedback(mapped);
    };
    run();
  }, [projects, selectedProjectId, filterStatus, filterType, filterRating, searchTerm, page, pageSize, buildFilters, supabase]);

  const filteredFeedback = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return feedback.filter((item) => {
      const matchesSearch =
        item.message.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term);
      const matchesStatus = filterStatus === "all" || item.status === filterStatus;
      const matchesProject = filterProject === "all" || item.project_name === filterProject;
      const matchesType = filterType === "all" || item.type === filterType;
      const matchesRating = filterRating === "all" || String(item.rating) === filterRating;
      return matchesSearch && matchesStatus && matchesProject && matchesType && matchesRating;
    });
  }, [feedback, searchTerm, filterStatus, filterProject, filterType, filterRating]);

  const feedbackProjects = useMemo(() => projects.map(p => p.name), [projects]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "read":
        return "bg-green-100 text-green-800 border-green-200";
      case "archived":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
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

  const bulkArchive = async (archive: boolean) => {
    if (selectAllFiltered) {
      await fetch('/api/feedbacks/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: archive ? 'archive' : 'unarchive',
          filters: {
            projectId: selectedProjectId,
            status: filterStatus,
            type: filterType,
            rating: filterRating,
            searchTerm,
          },
        }),
      });
      setSelected(new Set()); setSelectAllFiltered(false); setPage(1);
    } else if (selected.size > 0) {
      const ids = Array.from(selected);
      await fetch('/api/feedbacks/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: archive ? 'archive' : 'unarchive', ids }),
      });
      if (archive) setFeedback(prev => prev.map(f => selected.has(f.id) ? { ...f, status: 'archived' } : f));
      else setPage(1);
      clearSelection();
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const markRead = async (read: boolean) => {
    if (selectAllFiltered) {
      await fetch('/api/feedbacks/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: read ? 'mark_read' : 'mark_unread',
          filters: {
            projectId: selectedProjectId,
            status: filterStatus,
            type: filterType,
            rating: filterRating,
            searchTerm,
          },
        }),
      });
      setSelected(new Set()); setSelectAllFiltered(false); setPage(1);
    } else {
      if (selected.size === 0) return;
      const ids = Array.from(selected);
      await fetch('/api/feedbacks/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: read ? 'mark_read' : 'mark_unread', ids }),
      });
      setFeedback(prev => prev.map(f => selected.has(f.id) ? { ...f, status: read ? 'read' : 'new' } : f));
      clearSelection();
    }
  };

  const applyTag = async () => {
    const tag = bulkTag.trim();
    if (!tag) return;
    if (selectAllFiltered) {
      await fetch('/api/feedbacks/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_tag', filters: { projectId: selectedProjectId, status: filterStatus, type: filterType, rating: filterRating, searchTerm, tag } }),
      });
      setBulkTag(""); setSelectAllFiltered(false); setPage(1);
    } else if (selected.size > 0) {
      const ids = Array.from(selected);
      await fetch('/api/feedbacks/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_tag', ids, filters: { tag } }),
      });
      setFeedback(prev => prev.map(f => selected.has(f.id) ? { ...f, tags: Array.from(new Set([...(f.tags || []), tag])) } : f));
      setBulkTag("");
      clearSelection();
    }
  };

  const removeTag = async () => {
    const tag = removeTagValue.trim();
    if (!tag) return;
    if (selectAllFiltered) {
      await fetch('/api/feedbacks/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove_tag', filters: { projectId: selectedProjectId, status: filterStatus, type: filterType, rating: filterRating, searchTerm, tag } }),
      });
      setRemoveTagValue(""); setSelectAllFiltered(false); setPage(1);
    } else if (selected.size > 0) {
      const ids = Array.from(selected);
      await fetch('/api/feedbacks/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove_tag', ids, filters: { tag } }),
      });
      setFeedback(prev => prev.map(f => selected.has(f.id) ? { ...f, tags: (f.tags || []).filter(t => t !== tag) } : f));
      setRemoveTagValue("");
      clearSelection();
    }
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
              {selectedProjectId ? (
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <a href={`/api/projects/${selectedProjectId}/feedback.csv`} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV
                  </a>
                </Button>
              ) : (
                <Button className="bg-primary/50 hover:bg-primary/50" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Choose a project
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Type distribution bar for current results */}
            <div className="mb-4">
              {(() => {
                const total = filteredFeedback.length || 1;
                const bug = filteredFeedback.filter(f => f.type === 'bug').length;
                const idea = filteredFeedback.filter(f => f.type === 'idea').length;
                const praise = filteredFeedback.filter(f => f.type === 'praise').length;
                const bugPct = (bug / total) * 100;
                const ideaPct = (idea / total) * 100;
                const praisePct = (praise / total) * 100;
                return (
                  <div>
                    <div className="flex h-2 w-full overflow-hidden rounded bg-muted">
                      <div className="bg-destructive" style={{ width: `${bugPct}%` }} />
                      <div className="bg-primary/50" style={{ width: `${ideaPct}%` }} />
                      <div className="bg-green-500/60" style={{ width: `${praisePct}%` }} />
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Bug: {bug}</span>
                      <span>Idea: {idea}</span>
                      <span>Praise: {praise}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            {selected.size > 0 && (
              <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border rounded mb-4 p-3 flex items-center gap-2">
                <span className="text-sm">{selected.size} selected</span>
                <Button size="sm" variant="outline" onClick={() => markRead(true)}>Mark read</Button>
                <Button size="sm" variant="outline" onClick={() => markRead(false)}>Mark unread</Button>
                <Button size="sm" variant="outline" onClick={() => bulkArchive(true)}>Archive</Button>
                <Button size="sm" variant="outline" onClick={() => bulkArchive(false)}>Unarchive</Button>
                <div className="flex items-center gap-2">
                  <Input value={bulkTag} onChange={(e)=>setBulkTag(e.target.value)} placeholder="Add tag" className="h-8 w-32" />
                  <Button size="sm" onClick={applyTag} disabled={!bulkTag.trim()}>Apply</Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input value={removeTagValue} onChange={(e)=>setRemoveTagValue(e.target.value)} placeholder="Remove tag" className="h-8 w-32" />
                  <Button size="sm" variant="destructive" onClick={removeTag} disabled={!removeTagValue.trim()}>Remove</Button>
                </div>
                <Button size="sm" variant="outline" onClick={() => setSelected(new Set(feedback.map(f => f.id)))}>Select all</Button>
                <Button size="sm" variant="ghost" onClick={clearSelection}>Clear</Button>
              </div>
            )}
            {/* Pagination controls */}
            <div className="mb-3 flex items-center justify-between text-sm">
              <div className="text-muted-foreground">{totalCount} results • Page {page} of {totalPages}</div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}>Previous</Button>
                <Button size="sm" variant="outline" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}>Next</Button>
                {!selectAllFiltered ? (
                  <Button size="sm" onClick={()=>{ setSelectAllFiltered(true); setSelected(new Set()); }}>Select all {totalCount} filtered</Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={()=>setSelectAllFiltered(false)}>Cancel select all</Button>
                )}
              </div>
            </div>
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

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="idea">Idea</SelectItem>
                  <SelectItem value="praise">Praise</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
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
                  <details key={item.id} className={`project-item group overflow-hidden border rounded-lg ${selected.has(item.id) ? 'ring-1 ring-primary' : ''}`}>
                    <summary className="list-none cursor-pointer">
                      <div className="flex items-start gap-3 p-3">
                        <input type="checkbox" aria-label="Select feedback" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} className="mt-1 h-4 w-4" />
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
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={async (e)=>{ e.preventDefault(); try { await fetch(`/api/feedbacks/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: true }) }); setFeedback(prev => prev.map(f => f.id === item.id ? { ...f, status: 'archived' } : f)); } catch {} }}>
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
                        {/* Priority, Tags, Screenshot */}
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {item.priority && (
                            <Badge variant="outline" className="text-xs">Priority: {item.priority}</Badge>
                          )}
                          {Array.isArray(item.tags) && item.tags.length > 0 && item.tags.slice(0,4).map((t) => (
                            <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                          ))}
                          {item.screenshot_url && (
                            <div className="ml-auto">
                              <ImageLightbox src={item.screenshot_url} thumbClassName="h-12 w-auto rounded border" />
                            </div>
                          )}
                        </div>
                        {Array.isArray(item.attachments) && item.attachments.length > 0 && (
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {item.attachments.slice(0,3).map((att, idx) => (
                              att.type?.startsWith('image/') ? (
                                <ImageLightbox key={idx} src={att.url} thumbClassName="h-12 w-auto rounded border" />
                              ) : (
                                <a key={idx} href={att.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs underline">
                                  <Paperclip className="h-3 w-3" /> {att.name || 'attachment'}
                                </a>
                              )
                            ))}
                          </div>
                        )}
                        
                        {/* Mobile project name */}
                        <div className="mt-1 sm:hidden">
                          <Badge variant="outline" className="text-xs">
                            {item.project_name}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    </summary>
                    <div className="px-3 pb-3 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {item.email || 'anonymous'}</div>
                        <div className="flex items-center gap-2 truncate"><MonitorSmartphone className="h-4 w-4" /> <span title={item.url}>{item.url}</span></div>
                        {item.type && <div className="capitalize">Type: {item.type}</div>}
                        <div>Created: {new Date(item.created_at).toLocaleString()}</div>
                      </div>
                      {item.screenshot_url && (
                        <ImageLightbox src={item.screenshot_url} thumbClassName="h-24 w-auto rounded border" />
                      )}
                      {Array.isArray(item.attachments) && item.attachments.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Attachments</div>
                          <div className="flex flex-wrap gap-2">
                            {item.attachments.map((att, idx) => (
                              att.type?.startsWith('image/') ? (
                                <ImageLightbox key={idx} src={att.url} thumbClassName="h-20 w-auto rounded border" />
                              ) : (
                                <a key={idx} href={att.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm underline">
                                  <Paperclip className="h-3 w-3" /> {att.name || 'attachment'}
                                </a>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium mb-1">Message</div>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{item.message}</p>
                      </div>
                    </div>
                  </details>
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



