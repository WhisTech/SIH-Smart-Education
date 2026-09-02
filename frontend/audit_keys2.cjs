const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const localesDir = path.join(srcDir, 'i18n', 'locales');

const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en', 'translation.json'), 'utf8'));
const hi = JSON.parse(fs.readFileSync(path.join(localesDir, 'hi', 'translation.json'), 'utf8'));
const mr = JSON.parse(fs.readFileSync(path.join(localesDir, 'mr', 'translation.json'), 'utf8'));

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (filePath.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allJsxFiles = getAllFiles(srcDir);
const usedKeys = new Set();

const tRegex = /t\(["']([^"']+)["']\)/g;

for (const file of allJsxFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = tRegex.exec(content)) !== null) {
    usedKeys.add(match[1]);
  }
}

function getNestedValue(obj, keyPath) {
  const parts = keyPath.split('.');
  let current = obj;
  for (const p of parts) {
    if (current && typeof current === 'object' && p in current) {
      current = current[p];
    } else {
      return undefined;
    }
  }
  return current;
}

const missingHi = [];
const missingMr = [];
const skipped = [];
const SKIP = new Set(['-', '*', 'id', '@', 'start', 'type', 'initial',
  'id, name, category', 'id, name, description, category', 'content-type', 'skill_id']);

for (const key of usedKeys) {
  if (SKIP.has(key)) { skipped.push(key); continue; }

  let hasHi = false;
  let hasMr = false;

  if (key.includes('.')) {
    hasHi = getNestedValue(hi, key) !== undefined;
    hasMr = getNestedValue(mr, key) !== undefined;
  } else {
    hasHi = hi[key] !== undefined;
    hasMr = mr[key] !== undefined;
  }

  if (!hasHi) missingHi.push(key);
  if (!hasMr) missingMr.push(key);
}

console.log('MISSING_HI:', missingHi.length);
console.log('MISSING_MR:', missingMr.length);
if (missingHi.length > 0) {
  console.log('\nAll missing HI keys:');
  missingHi.forEach(k => console.log(' ', JSON.stringify(k)));
}
