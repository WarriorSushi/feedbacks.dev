import { createServerComponentClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardClientLayout } from '@/components/dashboard-client-layout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      redirect('/auth');
    }

    // Server-side data fetching prevents loading states
    const { data: projects } = await supabase
      .from('projects')
      .select(`
        *,
        feedback:feedback(count)
      `)
      .eq('owner_user_id', user.id);

    return (
      <DashboardClientLayout 
        user={user} 
        initialProjects={projects || []}
      >
        {children}
      </DashboardClientLayout>
    );
  } catch (error) {
    console.error('Dashboard layout error:', error);
    redirect('/auth');
  }
}