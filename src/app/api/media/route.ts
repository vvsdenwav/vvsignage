import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getOrgId, canUpload } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url, 'http://localhost');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const page = parseInt(searchParams.get('page') || '1');
    const folderId = searchParams.get('folderId');
    const tag = searchParams.get('tag');
    const isPaginatedRequest = searchParams.has('page') || searchParams.has('limit');
    const orgId = await getOrgId(session);

    const skip = (page - 1) * limit;

    const where: any = { organizationId: orgId };
    if (folderId !== null && folderId !== undefined && folderId !== 'all') {
      where.folderId = folderId === 'root' ? null : folderId;
    }
    if (tag && tag !== 'all') {
      where.tags = {
        some: {
          name: tag
        }
      };
    }

    const [media, totalCount] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        include: { tags: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.mediaAsset.count({ where })
    ]);

    if (isPaginatedRequest) {
      return NextResponse.json({
        items: media,
        totalCount,
        page,
        limit,
        hasMore: skip + media.length < totalCount
      });
    }

    // Default backward compatible array response
    return NextResponse.json(media);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const contentType = request.headers.get('content-type') || '';

    // Handle JSON payload for Web Embeds and Creatives
    if (contentType.includes('application/json')) {
      const data = await request.json();
      if (!data.url || !data.name) {
        return NextResponse.json({ success: false, error: 'URL and Name are required' }, { status: 400 });
      }

      // Validate against Allowed Web Domains for all URL-based media (creatives + web embeds)
      const setting = await prisma.systemSetting.findUnique({ where: { key: 'allowedWebDomains' } });
      const allowedDomains: string[] = setting?.value ? JSON.parse(setting.value) : [];

      if (allowedDomains.length === 0) {
        return NextResponse.json({ success: false, error: 'Security Policy blocks all web embeds. Please configure allowed domains in Settings.' }, { status: 403 });
      }

      try {
        const urlStr = data.url.startsWith('http') ? data.url : `https://${data.url}`;
        const hostname = new URL(urlStr).hostname.toLowerCase();
        const isAllowed = allowedDomains.some((domain: string) => hostname === domain || hostname.endsWith(`.${domain}`));
        if (!isAllowed) {
          return NextResponse.json({ success: false, error: `Domain ${hostname} is not in the allowed domains list. Ask an admin to add it in Settings.` }, { status: 403 });
        }
      } catch (e) {
        return NextResponse.json({ success: false, error: 'Invalid URL format' }, { status: 400 });
      }

      if (data.type === 'creative') {
        const orgId = await getOrgId(session);
        const mediaAsset = await prisma.mediaAsset.create({
          data: {
            name: data.name,
            url: data.url,
            type: 'creative',
            organizationId: orgId,
            folderId: data.folderId || null,
          }
        });
        await logAudit('CREATE_CREATIVE', `Created creative ${data.name}`, session);
        return NextResponse.json({ success: true, media: mediaAsset });
      }

      // Web embed (already domain-validated above)
      const orgId = await getOrgId(session);
      const mediaAsset = await prisma.mediaAsset.create({
        data: {
          name: data.name,
          url: data.url,
          type: 'web',
          organizationId: orgId,
          folderId: data.folderId || null,
        }
      });
      
      await logAudit('CREATE_WEB_MEDIA', `Created web embed ${data.name}`, session);
      
      return NextResponse.json({ success: true, media: mediaAsset });
    }

    } catch (error) {
      return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
