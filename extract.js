const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Dennis\\.gemini\\antigravity\\brain\\adf6be7e-dcf6-406d-ba62-9b44b506d785\\.system_generated\\logs\\transcript_full.jsonl', 'utf-8');
const lines = content.split('\n');

let files = {};

for (let i = 0; i < lines.length; i++) {
  if (!lines[i]) continue;
  try {
    const data = JSON.parse(lines[i]);
    
    if (data.type === 'VIEW_FILE' && data.content) {
        const text = data.content;
        
        let pathLine = text.split('\n').find(l => l.includes('File Path: '));
        if (pathLine) {
           let p = pathLine.split('file:///')[1];
           if (p) p = p.replace(/`/g, '').trim();
           p = decodeURI(p);
           
           if (p && !files[p]) {
              const fileLines = text.split('\n');
              let actualLines = [];
              let startParsing = false;
              for (const ln of fileLines) {
                 if (ln.includes('The following code has been modified')) {
                    startParsing = true;
                    continue;
                 }
                 if (ln.includes('The above content shows the entire')) {
                    startParsing = false;
                    continue;
                 }
                 if (startParsing) {
                    const colonIdx = ln.indexOf(': ');
                    if (colonIdx !== -1 && !isNaN(parseInt(ln.substring(0, colonIdx)))) {
                       actualLines.push(ln.substring(colonIdx + 2));
                    } else {
                       actualLines.push(ln);
                    }
                 }
              }
              files[p] = actualLines.join('\n');
           }
        }
    }
  } catch(e) {}
}

const writeIfFound = (searchStr, dest) => {
   const key = Object.keys(files).find(k => k.toLowerCase().includes(searchStr.toLowerCase()));
   if (key) {
      fs.writeFileSync(dest, files[key]);
      console.log('Saved ' + dest);
   } else {
      console.log('Could not find ' + searchStr);
   }
};

writeIfFound('globals.css', 'C:\\Users\\Dennis\\OneDrive - tropicair.com\\Documents\\signage\\src\\app\\globals.css.original');
writeIfFound('dashboard/layout.tsx', 'C:\\Users\\Dennis\\OneDrive - tropicair.com\\Documents\\signage\\src\\app\\dashboard\\layout.tsx.original');
writeIfFound('dashboard/page.tsx', 'C:\\Users\\Dennis\\OneDrive - tropicair.com\\Documents\\signage\\src\\app\\dashboard\\page.tsx.original');
writeIfFound('login/page.tsx', 'C:\\Users\\Dennis\\OneDrive - tropicair.com\\Documents\\signage\\src\\app\\login\\page.tsx.original');
