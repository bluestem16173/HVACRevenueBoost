import fs from 'fs';
import path from 'path';

function walk(d: string): string[] {
  let res: string[] = [];
  fs.readdirSync(d, { withFileTypes: true }).forEach(dirent => {
    const f = path.join(d, dirent.name);
    if (dirent.isDirectory()) res.push(...walk(f));
    else if (f.endsWith('.ts')) res.push(f);
  });
  return res;
}

const files = walk('./app/api/control');
files.forEach(f => {
  let text = fs.readFileSync(f, 'utf8');
  // I need to replace \` with `
  // and \$ with $
  text = text.replace(/\\`/g, '`');
  text = text.replace(/\\\$/g, '$');
  fs.writeFileSync(f, text);
  console.log('Cleaned', f);
});
