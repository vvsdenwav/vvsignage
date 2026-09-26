const fs = require('fs');
const json = JSON.parse(fs.readFileSync('dump_test_final.json'));
console.log(JSON.stringify(json.testResult, null, 2));
console.log("Settings keys:", json.settings.map(s => s.key));
