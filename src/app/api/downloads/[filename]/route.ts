import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// APK files fall back to Vercel Blob CDN if local release file is missing.
const APK_URLS: Record<string, string> = {
  'signage.apk':    'https://uyewkjqtfi6fsohx.public.blob.vercel-storage.com/apks/tv-app.apk',
  'tv-app.apk':     'https://uyewkjqtfi6fsohx.public.blob.vercel-storage.com/apks/tv-app.apk',
  'tablet-app.apk': 'https://uyewkjqtfi6fsohx.public.blob.vercel-storage.com/apks/tablet-app.apk',
};

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Sanitize — only .apk files, no path traversal
  if (!filename.endsWith('.apk') || filename.includes('/') || filename.includes('..')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Check if updated local release APK exists
  const localPaths = [
    path.join(/* turbopackIgnore: true */ process.cwd(), 'releases', filename),
    path.join(/* turbopackIgnore: true */ process.cwd(), 'public', 'releases', filename),
    path.join(/* turbopackIgnore: true */ process.cwd(), 'public', 'downloads', filename),
    path.join(/* turbopackIgnore: true */ process.cwd(), 'public', filename)
  ];

  for (let localPath of localPaths) {
    if (fs.existsSync(localPath)) {
      const fileBuffer = fs.readFileSync(localPath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      });
    }
  }

  const blobUrl = APK_URLS[filename];
  if (!blobUrl) {
    return NextResponse.json({ error: 'APK not found' }, { status: 404 });
  }

  // Redirect to Blob CDN — the Downloader app follows this and triggers a real download.
  return NextResponse.redirect(blobUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
