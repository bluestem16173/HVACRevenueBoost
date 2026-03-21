import "dotenv/config";
import sql from '../lib/db';

async function bootstrap() {
  await sql`
    CREATE TABLE IF NOT EXISTS system_logs (
      id SERIAL PRIMARY KEY,
      event_type VARCHAR(50),
      message TEXT,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('system_logs created');
  process.exit(0);
}

bootstrap().catch(console.error);
