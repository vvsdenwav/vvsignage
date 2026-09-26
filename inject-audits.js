const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/users/[id]/route.ts',
  'src/app/api/playlists/[id]/route.ts',
  'src/app/api/screens/route.ts',
  'src/app/api/screens/[id]/route.ts',
  'src/app/api/media/route.ts',
  'src/app/api/media/[id]/route.ts'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('logAudit')) {
    const importStr = `import { getServerSession } from 'next-auth';\nimport { authOptions } from '@/lib/auth';\nimport { logAudit } from '@/lib/audit';\n`;
    content = content.replace(/(import .*;\n)+/, (m) => m + importStr);
  }

  // Inject session into POST/PATCH/DELETE
  content = content.replace(/export async function (POST|PATCH|DELETE)\(.*\) \{([\s\S]*?)try \{/g, (match, method, beforeTry) => {
    return `${match}\n    const session = await getServerSession(authOptions);`;
  });

  // Basic manual injections based on file
  if (file.includes('users/[id]')) {
    content = content.replace(/await prisma\.user\.delete\(\{[\s\S]*?where: \{ id \}[\s\S]*?\}\);/, (m) => m + `\n    await logAudit('DELETE_USER', \`Deleted user \${id}\`, session);`);
    content = content.replace(/const user = await prisma\.user\.update\(\{[\s\S]*?\}\);/, (m) => m + `\n    await logAudit('UPDATE_USER', \`Updated user \${user.username}\`, session);`);
  }
  
  if (file.includes('playlists/[id]')) {
    content = content.replace(/await prisma\.playlist\.delete\(\{[\s\S]*?where: \{ id \}[\s\S]*?\}\);/, (m) => m + `\n    await logAudit('DELETE_PLAYLIST', \`Deleted playlist \${id}\`, session);`);
    content = content.replace(/const playlist = await prisma\.playlist\.update\(\{[\s\S]*?\}\);/, (m) => m + `\n    await logAudit('UPDATE_PLAYLIST', \`Updated playlist \${playlist.name}\`, session);`);
  }

  if (file.includes('screens/route.ts')) {
    content = content.replace(/const screen = await prisma\.screen\.create\(\{[\s\S]*?\}\);/, (m) => m + `\n    await logAudit('ADD_SCREEN', \`Added screen \${screen.name}\`, session);`);
  }

  if (file.includes('screens/[id]')) {
    content = content.replace(/await prisma\.screen\.delete\(\{[\s\S]*?where: \{ id \}[\s\S]*?\}\);/, (m) => m + `\n    await logAudit('DELETE_SCREEN', \`Deleted screen \${id}\`, session);`);
    content = content.replace(/const screen = await prisma\.screen\.update\(\{[\s\S]*?\}\);/, (m) => m + `\n    await logAudit('UPDATE_SCREEN', \`Updated screen \${screen.name}\`, session);`);
  }

  if (file.includes('media/route.ts')) {
    content = content.replace(/const media = await prisma\.mediaAsset\.create\(\{[\s\S]*?\}\);/, (m) => m + `\n    await logAudit('UPLOAD_MEDIA', \`Uploaded media \${media.name}\`, session);`);
  }

  if (file.includes('media/[id]')) {
    content = content.replace(/await prisma\.mediaAsset\.delete\(\{[\s\S]*?where: \{ id \}[\s\S]*?\}\);/, (m) => m + `\n    await logAudit('DELETE_MEDIA', \`Deleted media \${id}\`, session);`);
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${file}`);
}
