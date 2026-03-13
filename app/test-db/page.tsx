import { neon } from '@neondatabase/serverless';

// Force dynamic rendering so it bypasses static generation and always hits the DB on request
export const dynamic = 'force-dynamic';

export default async function TestDbConnectionPage() {
  try {
    const start = Date.now();
    const sql = neon(process.env.DATABASE_URL as string);
    const results = await sql`SELECT slug, generated_at FROM pages WHERE status = 'published' ORDER BY generated_at DESC LIMIT 5`;
    const time = Date.now() - start;

    return (
      <div className="p-8 font-mono">
        <h1 className="text-2xl font-bold mb-4 text-green-600">✅ Neon Database Connection Successful</h1>
        <p className="mb-4">Query execution time: {time}ms</p>
        
        <h2 className="text-xl font-bold mt-8 mb-4">Latest Generated Slugs:</h2>
        <ul className="space-y-2">
          {results.map((row: any, i: number) => (
            <li key={i} className="bg-slate-100 p-2 rounded">
              {row.slug} <span className="text-gray-400 text-sm">({new Date(row.generated_at).toLocaleString()})</span>
            </li>
          ))}
        </ul>
      </div>
    );
  } catch (error: any) {
    return (
      <div className="p-8 font-mono">
        <h1 className="text-2xl font-bold mb-4 text-red-600">❌ Neon Database Connection Failed</h1>
        <p className="mb-2"><strong>Error Name:</strong> {error.name}</p>
        <p className="mb-2"><strong>Message:</strong> {error.message}</p>
        <pre className="mt-4 bg-slate-100 p-4 rounded text-sm overflow-auto">
          {error.stack}
        </pre>
      </div>
    );
  }
}
