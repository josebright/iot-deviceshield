const fs = require('node:fs');
const path = require('node:path');
const src = path.join(__dirname, '..', 'src', 'catalog.json');
const dst = path.join(__dirname, '..', 'dist', 'catalog.json');
fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.copyFileSync(src, dst);
