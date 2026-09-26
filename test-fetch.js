const https = require('https');
https.get('https://vvsignage.vercel.app/api/dump', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(data);
  });
}).on('error', err => console.log('Error:', err.message));
