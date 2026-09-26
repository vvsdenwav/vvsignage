const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');
content = content.replace("flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}", "flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden', aspectRatio: '16/9' }}");
fs.writeFileSync('src/app/page.tsx', content, 'utf8');
console.log('Success');
