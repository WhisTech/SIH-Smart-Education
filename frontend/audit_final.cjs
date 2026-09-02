const fs = require('fs');
const path = require('path');

const hi = JSON.parse(fs.readFileSync('src/i18n/locales/hi/translation.json'));
const mr = JSON.parse(fs.readFileSync('src/i18n/locales/mr/translation.json'));
const skipSet = new Set(['-','*','id','@','start','type','initial','id, name, category','id, name, description, category','content-type','skill_id']);

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) getAllFiles(filePath, fileList);
    else if (filePath.endsWith('.jsx')) fileList.push(filePath);
  }
  return fileList;
}

const usedKeys = new Set();
const tRegex = /t\(["']([^"']+)["']\)/g;
for (const file of getAllFiles('src')) {
  const content = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = tRegex.exec(content)) !== null) usedKeys.add(m[1]);
}

function getVal(obj, key) {
  // If key has dots, check if it's a technical key (like nav.dashboard) vs a sentence with a period
  // A technical key is all lowercase letters and underscores separated by dots
  if (/^[a-z_]+(\.[a-z_]+)+$/.test(key)) {
    const parts = key.split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
      else return undefined;
    }
    return cur;
  }
  // Otherwise treat as flat key (literal string that may contain dots)
  return obj[key];
}

const missingHi = [], missingMr = [];
for (const key of usedKeys) {
  if (skipSet.has(key)) continue;
  const inHi = getVal(hi, key) !== undefined;
  const inMr = getVal(mr, key) !== undefined;
  if (!inHi) missingHi.push(key);
  if (!inMr) missingMr.push(key);
}

console.log('Missing HI:', missingHi.length);
console.log('Missing MR:', missingMr.length);
if (missingHi.length) {
  console.log('Missing HI examples:');
  missingHi.forEach(k => console.log(' ', JSON.stringify(k)));
}
