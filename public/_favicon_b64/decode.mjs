#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname);
for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.b64'))) {
  const out = path.join(__dirname, '..', f.replace(/\.b64$/, ''));
  fs.writeFileSync(out, Buffer.from(fs.readFileSync(path.join(dir, f), 'utf8').trim(), 'base64'));
  console.log('wrote', out);
}
