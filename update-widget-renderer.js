const fs = require('fs');
let content = fs.readFileSync('src/components/WidgetRenderer.tsx', 'utf8');
content = content.replace(/fontFamily: 'inherit'/g, "fontFamily: payload.fontFamily || 'inherit'");
fs.writeFileSync('src/components/WidgetRenderer.tsx', content, 'utf8');
console.log('Success');
