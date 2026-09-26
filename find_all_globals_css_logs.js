const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainDir = 'C:\\Users\\Dennis\\.gemini\\antigravity\\brain';

async function scanLog(logPath) {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let firstMatch = null;
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (line.includes('globals.css') && (obj.type === 'VIEW_FILE' || obj.type === 'CODE_ACTION')) {
        firstMatch = {
          stepIndex: obj.step_index,
          type: obj.type,
          created: obj.created_at || '',
          contentLength: obj.content ? obj.content.length : 0
        };
        break; // we only need the first one in this log
      }
    } catch (e) {}
  }
  return firstMatch;
}

async function main() {
  const dirs = fs.readdirSync(brainDir);
  const results = [];

  for (const dir of dirs) {
    const logPath = path.join(brainDir, dir, '.system_generated', 'logs', 'transcript_full.jsonl');
    if (fs.existsSync(logPath)) {
      const stat = fs.statSync(logPath);
      const match = await scanLog(logPath);
      if (match) {
        results.push({
          dir,
          mtime: stat.mtime,
          ...match
        });
      }
    }
  }

  // Sort by modification time ascending (oldest first)
  results.sort((a, b) => a.mtime - b.mtime);

  console.log(`Found ${results.length} logs with globals.css matches.`);
  for (const res of results) {
    console.log(`Folder: ${res.dir} (Last Modified: ${res.mtime.toISOString()})`);
    console.log(`  First Match Step: ${res.stepIndex} (${res.type}) - Date: ${res.created} - Length: ${res.contentLength}`);
  }
}

main();
