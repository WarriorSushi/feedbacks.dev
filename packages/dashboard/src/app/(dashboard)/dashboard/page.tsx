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

export default function DashboardPage() {
  return <div className="p-6">Dashboard</div>;
}

