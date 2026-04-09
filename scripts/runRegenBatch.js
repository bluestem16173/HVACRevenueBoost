// Wrapper to support standard node execution while running the TypeScript worker source
require('child_process').execSync('npx tsx scripts/runRegenBatch.ts', { stdio: 'inherit' });
