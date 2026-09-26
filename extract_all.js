const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Dennis\\.gemini\\antigravity\\brain\\adf6be7e-dcf6-406d-ba62-9b44b506d785\\.system_generated\\logs\\transcript_full.jsonl', 'utf-8');
const lines = content.split('\n');

let targetFiles = new Set();
let filesOriginalContent = {};

// Pass 1: Find all modified files
for (let i = 0; i < lines.length; i++) {
  if (!lines[i]) continue;
  try {
    const data = JSON.parse(lines[i]);
    if (data.type === 'PLANNER_RESPONSE' && data.tool_calls) {
      for (const call of data.tool_calls) {
        if (call.name === 'replace_file_content' || call.name === 'multi_replace_file_content') {
           let fp = call.args.TargetFile;
           if (fp) {
               fp = fp.replace(/\\/g, '/').toLowerCase();
               targetFiles.add(fp);
           }
        }
      }
    }
  } catch(e) {}
}

console.log('Modified files:', targetFiles.size);

// Pass 2: Find the FIRST VIEW_FILE for these files
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
           
           let normalizedP = p.replace(/\\/g, '/').toLowerCase();
           
           if (targetFiles.has(normalizedP) && !filesOriginalContent[normalizedP]) {
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
              filesOriginalContent[normalizedP] = { path: p, content: actualLines.join('\n') };
           }
        }
    }
  } catch(e) {}
}

let restoredCount = 0;
for (const [normPath, fileData] of Object.entries(filesOriginalContent)) {
    let originalPath = fileData.path;
    // Fix up drive letter casing if necessary, but writing to c:/... works in Node on Windows
    
    // We do NOT want to overwrite layout.tsx, globals.css, or page.tsx again if we already got them right,
    // but the script will extract their FIRST viewed state which should be perfect.
    // Except globals.css which was never viewed prior to modification! (We wrote a clean one manually)
    
    if (originalPath.includes('/src/components/') || originalPath.includes('/src/app/')) {
        if (originalPath.includes('globals.css')) continue; // Skip globals.css
        
        // Write the file
        fs.writeFileSync(originalPath, fileData.content);
        console.log('Restored: ' + originalPath);
        restoredCount++;
    }
}
console.log('Restored ' + restoredCount + ' files.');
