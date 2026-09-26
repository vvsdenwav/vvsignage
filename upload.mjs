import { put } from '@vercel/blob';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.production' });

const token = process.env.BLOB_READ_WRITE_TOKEN;

async function uploadApks() {
  const tvApkPath = path.join(process.cwd(), 'releases', 'tv-app.apk');
  const tabletApkPath = path.join(process.cwd(), 'releases', 'tablet-app.apk');

  if (fs.existsSync(tvApkPath)) {
    console.log('Uploading tv-app.apk...');
    const tvFile = fs.readFileSync(tvApkPath);
    const tvBlob = await put('apks/tv-app.apk', tvFile, { access: 'public', token, addRandomSuffix: false });
    console.log('TV APK Uploaded to:', tvBlob.url);
  } else {
    console.error('tv-app.apk not found in releases/');
  }

  if (fs.existsSync(tabletApkPath)) {
    console.log('Uploading tablet-app.apk...');
    const tabletFile = fs.readFileSync(tabletApkPath);
    const tabletBlob = await put('apks/tablet-app.apk', tabletFile, { access: 'public', token, addRandomSuffix: false });
    console.log('Tablet APK Uploaded to:', tabletBlob.url);
  } else {
    console.error('tablet-app.apk not found in releases/');
  }
}

uploadApks().catch(console.error);
