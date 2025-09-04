import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      return NextResponse.json(
        { authenticated: false }, 
        { 
          headers: {
            'Access-Control-Allow-Origin': 'https://www.feedbacks.dev',
            'Access-Control-Allow-Credentials': 'true',
          }
        }
      );
    }
    
    return NextResponse.json(
      { 
        authenticated: !!user,
        email: user?.email 
      },
      { 
        headers: {
          'Access-Control-Allow-Origin': 'https://www.feedbacks.dev',
          'Access-Control-Allow-Credentials': 'true',
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      { authenticated: false },
      { 
        headers: {
          'Access-Control-Allow-Origin': 'https://www.feedbacks.dev',
          'Access-Control-Allow-Credentials': 'true',
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://www.feedbacks.dev',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}