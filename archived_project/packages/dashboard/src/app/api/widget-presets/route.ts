import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(_req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { data, error } = await supabase
    .from('widget_presets')
    .select('slug,name,description,category,preview_image_url,config,created_at')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ items: [], error: 'Failed to load presets' }, { status: 200 });
  }

  return NextResponse.json(
    {
      items: Array.isArray(data) ? data : [],
    },
    {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600', // 5min cache, 10min stale
      }
    }
  );
}
