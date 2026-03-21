import fs from 'fs';

const f = 'app/admin/content-engine/page.tsx';
let text = fs.readFileSync(f, 'utf8');
text = text.replace(/\\`/g, '`');
text = text.replace(/\\\$/g, '$');
fs.writeFileSync(f, text);
console.log('Cleaned', f);
