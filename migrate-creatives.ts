import { prisma } from './src/lib/prisma';

async function main() {
  const canvasWidgets = await prisma.widget.findMany({
    where: { type: 'canvas' }
  });

  console.log(`Found ${canvasWidgets.length} canvas widgets to migrate...`);

  for (const widget of canvasWidgets) {
    console.log(`Migrating widget: ${widget.name}`);
    await prisma.mediaAsset.create({
      data: {
        name: widget.name,
        type: 'creative',
        url: widget.dataPayload || '{}', // Store payload in url
        createdAt: widget.createdAt,
      }
    });
  }
  
  console.log("Migration complete!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
