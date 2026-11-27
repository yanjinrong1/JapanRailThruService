const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const output = path.resolve(__dirname, '../dist');
const html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const url = match[1];
  if (/^(?:https?:|#|data:)/.test(url)) continue;
  fs.accessSync(path.join(output, url.split(/[?#]/)[0]));
}
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(output, 'rail-systems.js'), 'utf8'), context);
for (const system of Object.values(context.RAIL_SYSTEM_FILES)) {
  for (const file of [system, ...(system.shared || [])]) {
    JSON.parse(fs.readFileSync(path.join(output, file.url), 'utf8'));
  }
}
console.log('Static Pages output verified in dist.');
