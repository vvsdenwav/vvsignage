import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOrgId, canUpload } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await getOrgId(session);
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folderId = (formData.get('folderId') as string) || null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const sizeBytes = file.size;
    const fileSizeMb = sizeBytes / (1024 * 1024);

    if (!(await canUpload(orgId, fileSizeMb))) {
      return NextResponse.json(
        { error: 'Storage limit exceeded. Please upgrade your plan or delete unused media.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Save directly to public/uploads on the Hostinger server
    const uploadsDir = path.join(/* turbopackIgnore: true */ process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate safe unique filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `${Date.now()}-${sanitizedName}`;
    const filePath = path.join(/* turbopackIgnore: true */ uploadsDir, uniqueFilename);
    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/${uniqueFilename}`;
    const mimeType = file.type || '';
    const isVideo =
      mimeType.startsWith('video/') ||
      ['mp4', 'webm', 'mov', 'm4v', 'avi'].some((ext) =>
        file.name.toLowerCase().endsWith(`.${ext}`)
      );
    const mediaType = isVideo ? 'video' : 'image';

    // Insert record into PostgreSQL database
    const asset = await prisma.$transaction(async (tx: any) => {
      const created = await tx.mediaAsset.create({
        data: {
          name: file.name,
          url: relativeUrl,
          type: mediaType,
          sizeBytes: sizeBytes,
          organizationId: orgId,
          folderId: folderId || null,
        },
      });

      await tx.organization.update({
        where: { id: orgId },
        data: { storageUsedMb: { increment: fileSizeMb } },
      });

      return created;
    });

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any)?.id },
    });
    const pseudoSession = {
      user: {
        id: (session.user as any)?.id,
        email: user?.username,
        name: user?.username,
        orgId,
      },
    };
    await logAudit(
      'UPLOAD_MEDIA',
      `Uploaded media file ${file.name} to Hostinger server storage`,
      pseudoSession
    );

    return NextResponse.json({ success: true, asset });
  } catch (error: any) {
    console.error('Hostinger local storage upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
