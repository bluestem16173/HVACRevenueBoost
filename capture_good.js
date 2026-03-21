const { execSync } = require('child_process');
const fs = require('fs');
try {
  const out = execSync('npx tsx scripts/test-good-prompt.ts "diagnose/ac-not-cooling"', { encoding: 'utf8' });
  fs.writeFileSync('out_good.txt', out, 'utf8');
} catch (e) {
  fs.writeFileSync('out_good.txt', "STDOUT:\n" + e.stdout + "\nSTDERR:\n" + e.stderr, 'utf8');
}
