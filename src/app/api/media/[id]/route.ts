import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { del } from '@vercel/blob';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getOrgId } from '@/lib/tenant';
import fs from 'fs';
import path from 'path';

export async function DELETE(request: Request, context: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await context.params;
    const orgId = await getOrgId(session);

    // Fetch the asset first to get its size
    const asset = await prisma.mediaAsset.findUnique({
      where: { id, organizationId: orgId }
    });

    if (!asset) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Delete the media asset and decrement storage in a transaction
    await prisma.$transaction(async (tx: any) => {
      await tx.mediaAsset.delete({
        where: { id }
      });

      if (asset.sizeBytes) {
        const sizeMb = asset.sizeBytes / (1024 * 1024);
        await tx.organization.update({
          where: { id: orgId },
          data: {
            storageUsedMb: { decrement: sizeMb }
          }
        });
      }
    });
    
    await logAudit('DELETE_MEDIA', `Deleted media ${id}`, session);

    // Delete from Hostinger local storage if hosted locally
    if (asset.url && asset.url.startsWith('/uploads/')) {
      try {
        const localFilePath = path.join(/* turbopackIgnore: true */ process.cwd(), 'public', asset.url);
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }
      } catch (fileErr) {
        console.error("Failed to delete local file:", fileErr);
      }
    }

    // Delete the file from Vercel Blob storage if it's an old legacy blob
    if (asset.url && asset.url.includes('.vercel-storage.com')) {
      try {
        await del(asset.url, {
          token: process.env.BLOB2_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN
        });
      } catch (blobErr) {
        console.error("Failed to delete blob from Vercel:", blobErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete media error:", error);
    return NextResponse.json({ success: false, error: 'Failed to delete media' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const body = await request.json();
    const { name, url, expiresAt, approvalStatus, tagNames } = body;
    const orgId = await getOrgId(session);

    // If tagNames are provided, connect them
    let tagsUpdate: any = undefined;
    if (Array.isArray(tagNames)) {
      // Ensure tags exist
      const tagRecords = await Promise.all(
        tagNames.filter(Boolean).map((tName: string) =>
          prisma.tag.upsert({
            where: {
              organizationId_name: {
                organizationId: orgId,
                name: tName.trim().toLowerCase()
              }
            },
            update: {},
            create: {
              name: tName.trim().toLowerCase(),
              organizationId: orgId
            }
          })
        )
      );
      tagsUpdate = {
        set: tagRecords.map((t: any) => ({ id: t.id }))
      };
    }

    const updated = await prisma.mediaAsset.update({
      where: { id, organizationId: orgId },
      data: {
        ...(name && { name }),
        ...(url && { url }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        ...(approvalStatus !== undefined && { approvalStatus }),
        ...(tagsUpdate !== undefined && { tags: tagsUpdate })
      },
      include: {
        tags: true
      }
    });

    await logAudit('UPDATE_MEDIA', `Updated media ${id}`, session);
    return NextResponse.json({ success: true, media: updated });
  } catch (error) {
    console.error("Update media error:", error);
    return NextResponse.json({ success: false, error: 'Failed to update media' }, { status: 500 });
  }
}
