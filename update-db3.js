const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.clqvljrgvtyzryyevdpi:D3stiny.chl03.2014@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
});

async function run() {
  await client.connect();
  try {
    await client.query('ALTER TABLE "PlaylistItem" ADD COLUMN "transition" TEXT;');
    console.log('Successfully added transition column to PlaylistItem');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
