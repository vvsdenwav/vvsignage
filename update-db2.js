const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.clqvljrgvtyzryyevdpi:D3stiny.chl03.2014@aws-0-ca-central-1.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();
  
  try {
    await client.query('ALTER TABLE "Playlist" ADD COLUMN "transition" TEXT DEFAULT \'fade\'');
    console.log('transition ok');
  } catch(e) {
    console.log('t: ' + e.message);
  }
  
  try {
    await client.query('ALTER TABLE "Playlist" ADD COLUMN "startTime" TEXT');
    console.log('startTime ok');
  } catch(e) {
    console.log('st: ' + e.message);
  }
  
  try {
    await client.query('ALTER TABLE "Playlist" ADD COLUMN "endTime" TEXT');
    console.log('endTime ok');
  } catch(e) {
    console.log('et: ' + e.message);
  }
  
  try {
    await client.query('ALTER TABLE "Playlist" ADD COLUMN "daysOfWeek" TEXT');
    console.log('daysOfWeek ok');
  } catch(e) {
    console.log('dow: ' + e.message);
  }
  
  await client.end();
}

main().catch(console.error);
