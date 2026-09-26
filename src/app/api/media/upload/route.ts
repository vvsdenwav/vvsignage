import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOrgId, canUpload } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    // Vercel Blob handleUpload hardcodes the check for BLOB_WEBHOOK_PUBLIC_KEY.
    // If we're using a prefixed store (BLOB2), we need to trick it into using the correct key!
    if (process.env.BLOB2_WEBHOOK_PUBLIC_KEY) {
      process.env.BLOB_WEBHOOK_PUBLIC_KEY = process.env.BLOB2_WEBHOOK_PUBLIC_KEY;
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      token: process.env.BLOB2_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Authenticate the user
        const session = await getServerSession(authOptions);
        if (!session) {
          throw new Error('Unauthorized');
        }

        const orgId = await getOrgId(session);
        
        // Ensure the organization exists and has space
        const org = await prisma.organization.findUnique({ where: { id: orgId } });
        if (!org) throw new Error('Organization not found');

        // Check if there's enough storage left assuming 20MB max size (optimistic check)
        if (!(await canUpload(orgId, 20))) {
           throw new Error('Storage limit exceeded. Please upgrade your plan or delete unused media.');
        }

        let parsedPayload = null;
        if (clientPayload) {
          parsedPayload = JSON.parse(clientPayload);
        }

        return {
          allowedContentTypes: [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
            'video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'video/x-msvideo'
          ],
          maximumSizeInBytes: 20 * 1024 * 1024, // 20MB limit
          validUntil: Date.now() + 5 * 60 * 1000, // 5 minutes
          tokenPayload: JSON.stringify({
            userId: (session.user as any)?.id || '',
            orgId,
            folderId: parsedPayload?.folderId || null,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This is called by Vercel Blob when the upload is finished successfully.
        if (!tokenPayload) throw new Error('No token payload found');
        const { userId, orgId, folderId } = JSON.parse(tokenPayload);

        try {
          let sizeBytes = 0;
          if ((blob as any).size) {
            sizeBytes = (blob as any).size;
          } else {
             try {
               const headRes = await fetch(blob.url, { method: 'HEAD' });
               sizeBytes = parseInt(headRes.headers.get('content-length') || '0', 10);
             } catch (e) {
               console.warn("Could not fetch blob size, defaulting to 0");
             }
          }
          console.log("Size bytes:", sizeBytes);

          // Extract original name from blob.pathname (which might have a timestamp prefix from the client)
          const nameParts = blob.pathname.split('-');
          const filename = nameParts.length > 1 ? nameParts.slice(1).join('-') : blob.pathname;
          
          const mimeType = blob.contentType || '';
          const isVideo = mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'm4v', 'avi'].some(ext => blob.url.toLowerCase().endsWith(`.${ext}`));
          const mediaType = isVideo ? 'video' : 'image';
          const fileSizeMb = sizeBytes / (1024 * 1024);

          // Insert into database
          await prisma.$transaction(async (tx: any) => {
            console.log("Inside transaction for", blob.pathname);
            await tx.mediaAsset.create({
              data: {
                name: filename,
                url: blob.url,
                type: mediaType,
                sizeBytes: sizeBytes,
                organizationId: orgId,
                folderId: folderId || null,
              }
            });
            
            await tx.organization.update({
              where: { id: orgId },
              data: { storageUsedMb: { increment: fileSizeMb } }
            });
            console.log("Transaction finished");
          });
          
          const user = await prisma.user.findUnique({ where: { id: userId } });
          const pseudoSession = { user: { id: userId, email: user?.email, name: user?.name, orgId: orgId } };
          await logAudit('UPLOAD_MEDIA', `Uploaded media file ${filename}`, pseudoSession);

        } catch (error) {
          console.error("Database insertion failed for uploaded blob:", error);
          throw new Error('Could not update database');
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
