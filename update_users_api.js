const fs = require('fs');

// 1. Update GET users to include permissions
let routeContent = fs.readFileSync('src/app/api/users/route.ts', 'utf8');
routeContent = routeContent.replace('role: true,', 'role: true,\n        permissions: true,');
routeContent = routeContent.replace('role: data.role || \'AGENT\',', 'role: data.role || \'AGENT\',\n        permissions: data.permissions || \'[]\',');
routeContent = routeContent.replace('select: { id: true, username: true, role: true }', 'select: { id: true, username: true, role: true, permissions: true }');
fs.writeFileSync('src/app/api/users/route.ts', routeContent, 'utf8');

// 2. Update PATCH user to include permissions
let idRouteContent = fs.readFileSync('src/app/api/users/[id]/route.ts', 'utf8');
idRouteContent = idRouteContent.replace('if (data.role) updateData.role = data.role;', 'if (data.role) updateData.role = data.role;\n    if (data.permissions !== undefined) updateData.permissions = data.permissions;');
idRouteContent = idRouteContent.replace('select: { id: true, username: true, role: true }', 'select: { id: true, username: true, role: true, permissions: true }');
fs.writeFileSync('src/app/api/users/[id]/route.ts', idRouteContent, 'utf8');

console.log('API routes updated successfully.');
