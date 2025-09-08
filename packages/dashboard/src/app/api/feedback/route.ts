import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role client only in server-side API routes
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting storage (in-memory for MVP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const key = ip;
  const limit = rateLimitMap.get(key);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (limit.count >= 10) { // 10 requests per minute per IP
    return false;
  }
  
  limit.count++;
  return true;
}

function isValidEmail(email?: string): boolean {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { apiKey, message, email, url, userAgent, type, rating } = body;

    // Validate required fields
    if (!apiKey || !message || !url) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate message
    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 2 || trimmedMessage.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Message must be between 2 and 2000 characters' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate email if provided
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate optional type
    const allowedTypes = new Set(['bug', 'idea', 'praise']);
    if (typeof type !== 'undefined' && type !== null && !allowedTypes.has(String(type))) {
      return NextResponse.json(
        { success: false, error: 'Invalid feedback type' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate optional rating
    const numericRating = typeof rating === 'string' ? parseInt(rating, 10) : rating;
    if (
      typeof numericRating !== 'undefined' && numericRating !== null &&
      (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5)
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid rating value' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find project by API key
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('api_key', apiKey)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Invalid project key' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Insert feedback
    const { data: feedback, error: feedbackError } = await supabaseAdmin
      .from('feedback')
      .insert({
        project_id: project.id,
        message: trimmedMessage,
        email: email?.trim() || null,
        url: url.trim(),
        user_agent: userAgent || request.headers.get('user-agent') || 'Unknown',
        type: type ? String(type) : null,
        rating: typeof numericRating === 'number' ? numericRating : null,
      })
      .select('id')
      .single();

    if (feedbackError) {
      console.error('Database error:', feedbackError);
      return NextResponse.json(
        { success: false, error: 'Failed to save feedback' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      id: feedback.id,
    }, {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
