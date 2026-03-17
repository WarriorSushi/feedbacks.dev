'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { useDashboard } from '@/components/dashboard-client-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewProjectPage() {
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserSupabaseClient();
  const { refreshProjects } = useDashboard();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
      }
    };
    checkAuth();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      setError('');

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth');
          return;
        }

        const trimmedName = name.trim();

        if (!trimmedName || trimmedName.length > 100) {
          setError('Project name must be between 1 and 100 characters');
          return;
        }

        const { data: project, error: createError } = await supabase
          .from('projects')
          .insert({
            name: trimmedName,
            owner_user_id: user.id,
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        toast({
          title: 'Project created!',
          description: `${trimmedName} is ready to collect feedback.`,
        });

        await refreshProjects();
        router.push(`/projects/${project.id}`);
      } catch (err: any) {
        setError(err.message || 'Failed to create project');
        toast({
          variant: 'destructive',
          title: 'Creation failed',
          description: err.message || 'Failed to create project',
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" asChild className="gap-2 hover:bg-transparent hover:text-primary transition-colors">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 pb-20">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8 space-y-2">
            <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
              <Plus className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Create a new project</h1>
            <p className="text-muted-foreground text-lg">
              Start collecting feedback in minutes
            </p>
          </div>

          <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-base font-medium">Project Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g. My Awesome SaaS"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                    className="h-12 text-lg bg-background/50 transition-all focus:ring-2 focus:ring-primary/20"
                    autoFocus
                  />
                  <p className="text-sm text-muted-foreground">
                    This will be displayed in your dashboard and emails.
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                    <AlertDescription>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="pt-2 space-y-3">
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 hover:scale-[1.01]"
                    disabled={isPending || !name.trim()}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Project'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
            <div className="bg-muted/30 p-6 md:p-8 border-t border-border/50">
              <h3 className="font-medium mb-3 text-sm uppercase tracking-wider text-muted-foreground">What happens next?</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold">1</span>
                  </div>
                  We'll generate a unique API key for your project
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold">2</span>
                  </div>
                  You'll get a simple code snippet to embed
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold">3</span>
                  </div>
                  Customize the widget to match your brand
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}



