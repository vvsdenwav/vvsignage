import { NextResponse } from 'next/server';
import { getOrgId } from '@/lib/tenant';
import Parser from 'rss-parser';

const parser = new Parser();

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyDeviceToken } from '@/lib/deviceAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const device = verifyDeviceToken(request);
  if (!session && !device) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { searchParams } = new URL(request.url, 'http://localhost');
  const feedUrl = searchParams.get('url') || 'http://feeds.bbci.co.uk/news/rss.xml';

  // Block SSRF: prevent internal/private network access
  try {
    const parsed = new URL(feedUrl);
    const hostname = parsed.hostname.toLowerCase();

    // Block private/internal hostnames
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^0\./,
      /^\[::1\]$/,
      /^metadata\.google\.internal$/i,
    ];

    if (blockedPatterns.some(p => p.test(hostname))) {
      return NextResponse.json({ error: 'Internal URLs are not allowed' }, { status: 403 });
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Only HTTP/HTTPS URLs are allowed' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
  }

  try {
    const feed = await parser.parseURL(feedUrl);
    
    // Extract the latest 15 headlines with rich metadata
    const items = (feed.items || []).slice(0, 15).map((item: any) => ({
      title: item.title || 'Untitled',
      snippet: item.contentSnippet || item.content || '',
      pubDate: item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      link: item.link || '#'
    }));

    return NextResponse.json({ 
      title: feed.title || 'News Feed',
      items 
    });
  } catch (error) {
    console.error("RSS fetch error", error);
    return NextResponse.json({ error: 'Failed to fetch RSS feed' }, { status: 500 });
  }
}
