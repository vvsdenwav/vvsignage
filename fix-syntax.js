const fs = require('fs');
let content = fs.readFileSync('src/components/VisualEditorModal.tsx', 'utf8');

const regex = /      return \(\n        <div key=\{field\.key\} className="form-group">\n          <label className="form-label">\{field\.label\}<\/label>\n          <div style=\{\{ display: 'flex', flexDirection: 'column', gap: '8px' \}\}>\n            <input\n              type="text"\n              value=\{val \?\? ''\}\n              onChange=\{\(e\) => updateDraftPayload\(widget\.id, \{ \[field\.key\]: e\.target\.value \}\)\}\n              className="input-field"\n              placeholder=\{field\.placeholder \|\| "https:\/\/..."\}\n            \/>\n            <select\n              className="input-field"\n              value=""\n              onChange=\{\(e\) => \{\n                if \(e\.target\.value\) \{\n                  updateDraftPayload\(widget\.id, \{ \[field\.key\]: e\.target\.value \}\);\n                \}\n              \}\}\n            >\n              <option value="">-- Or choose from Media Library --<\/option>\n              \{mediaAssets\.map\(\(media: any\) => \(\n                <option key=\{media\.id\} value=\{media\.url\}>\n                  \{media\.name\} \(\{media\.type\}\)\n                <\/option>\n              \)\)\}\n            <\/select>\n          <\/div>\n        <\/div>\n      \);\n    \}/;

content = content.replace(regex, '');
fs.writeFileSync('src/components/VisualEditorModal.tsx', content, 'utf8');
console.log('Fixed VisualEditorModal syntax error');
