const https = require('https');
https.get('https://vvsignage.vercel.app/api/screens/a9094da8-0fea-42cc-8573-2f28083720ca/config', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
