require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.systemSetting.findMany();
  console.log('SETTINGS:', settings);
  const widgets = await prisma.widget.findMany();
  console.log('WIDGETS:', widgets.map(w => w.dataPayload));
  const media = await prisma.mediaAsset.findMany();
  console.log('MEDIA:', media.filter(m => m.type === 'web').map(m => m.url));
}
main().then(() => process.exit(0)).catch(e => console.error(e));
