'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="container mx-auto px-4 flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-lg bg-background/95 backdrop-blur">
            <CardHeader className="text-center space-y-1">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                <Plus className="h-6 w-6 text-primary" />
                New Project
              </CardTitle>
              <CardDescription>
                Create a new project to start collecting feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="My Awesome Project"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                    className="h-11"
                  />
                  <p className="text-sm text-muted-foreground">
                    Choose a descriptive name for your project
                  </p>
                </div>

                {error && (
                  <Alert className="border-destructive">
                    <AlertDescription className="text-destructive">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  <Button 
                    type="submit" 
                    className="w-full h-11" 
                    disabled={isPending || !name.trim()}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Project...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                      </>
                    )}
                  </Button>
                  
                  <Button type="button" variant="outline" className="w-full h-11" asChild>
                    <Link href="/dashboard">Cancel</Link>
                  </Button>
                </div>
              </form>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">What happens next?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• We'll generate a unique API key for your project</li>
                  <li>• You'll get a code snippet to embed in your website</li>
                  <li>• Start collecting feedback immediately</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
