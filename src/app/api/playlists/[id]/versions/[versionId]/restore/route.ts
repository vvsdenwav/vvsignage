import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const params = await context.params;
    const { id: playlistId, versionId } = params;

    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId, organizationId: orgId }
    });

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const version = await prisma.playlistVersion.findFirst({
      where: { id: versionId, playlistId }
    });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    const snapshot = JSON.parse(version.snapshot);

    // Save auto-checkpoint of current state before rollback
    const currentPlaylist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: { items: true, overlays: true }
    });

    if (currentPlaylist) {
      await prisma.playlistVersion.create({
        data: {
          playlistId,
          snapshot: JSON.stringify({
            name: currentPlaylist.name,
            description: currentPlaylist.description,
            transition: currentPlaylist.transition,
            startTime: currentPlaylist.startTime,
            endTime: currentPlaylist.endTime,
            daysOfWeek: currentPlaylist.daysOfWeek,
            items: currentPlaylist.items.map((item: any) => ({
              mediaId: item.mediaId,
              widgetId: item.widgetId,
              order: item.order,
              duration: item.duration,
              transition: item.transition,
              conditionPayload: item.conditionPayload,
              activeFrom: item.activeFrom,
              activeUntil: item.activeUntil
            })),
            overlays: currentPlaylist.overlays.map((overlay: any) => ({
              widgetId: overlay.widgetId
            }))
          }),
          label: `Auto-save before rollback to ${version.label || 'checkpoint'}`,
          createdBy: 'System (Auto)'
        }
      });
    }

    // Execute atomic restoration
    await prisma.$transaction(async (tx: any) => {
      // 1. Delete existing items and overlays
      await tx.playlistItem.deleteMany({ where: { playlistId } });
      await tx.playlistOverlay.deleteMany({ where: { playlistId } });

      // 2. Restore metadata
      await tx.playlist.update({
        where: { id: playlistId },
        data: {
          name: snapshot.name ?? playlist.name,
          description: snapshot.description ?? playlist.description,
          transition: snapshot.transition ?? playlist.transition,
          startTime: snapshot.startTime ?? playlist.startTime,
          endTime: snapshot.endTime ?? playlist.endTime,
          daysOfWeek: snapshot.daysOfWeek ?? playlist.daysOfWeek
        }
      });

      // 3. Re-create items
      if (Array.isArray(snapshot.items) && snapshot.items.length > 0) {
        for (let i = 0; i < snapshot.items.length; i++) {
          const item = snapshot.items[i];
          await tx.playlistItem.create({
            data: {
              playlistId,
              mediaId: item.mediaId || null,
              widgetId: item.widgetId || null,
              order: item.order ?? i,
              duration: item.duration ?? null,
              transition: item.transition ?? null,
              conditionPayload: item.conditionPayload ?? null,
              activeFrom: item.activeFrom ? new Date(item.activeFrom) : null,
              activeUntil: item.activeUntil ? new Date(item.activeUntil) : null
            }
          });
        }
      }

      // 4. Re-create overlays
      if (Array.isArray(snapshot.overlays) && snapshot.overlays.length > 0) {
        for (const overlay of snapshot.overlays) {
          if (overlay.widgetId) {
            await tx.playlistOverlay.create({
              data: {
                playlistId,
                widgetId: overlay.widgetId
              }
            });
          }
        }
      }
    });

    await logAudit('RESTORE_PLAYLIST_VERSION', `Restored playlist "${playlist.name}" to version ${version.label || version.id}`, session);

    return NextResponse.json({ success: true, message: 'Playlist successfully restored' });
  } catch (error) {
    console.error('Failed to restore playlist version:', error);
    return NextResponse.json({ error: 'Failed to restore playlist version' }, { status: 500 });
  }
}
