const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const localesDir = path.join(srcDir, 'i18n', 'locales');

const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en', 'translation.json'), 'utf8'));
const hi = JSON.parse(fs.readFileSync(path.join(localesDir, 'hi', 'translation.json'), 'utf8'));
const mr = JSON.parse(fs.readFileSync(path.join(localesDir, 'mr', 'translation.json'), 'utf8'));

// Extract all t('...') from .jsx files
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
const rawKeys = new Set();
const literalKeys = new Set();

const tRegex = /t\(['"]([^'"]+)['"]\)/g;

for (const file of allJsxFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = tRegex.exec(content)) !== null) {
    usedKeys.add(match[1]);
    if (match[1].includes('.')) {
      rawKeys.add(match[1]);
    } else {
      literalKeys.add(match[1]);
    }
  }
}

// Flatten JSON dictionary function for dotted keys
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
const rawKeysMissing = [];

for (const key of usedKeys) {
  // Check if it's a dotted key or a literal key
  let hasHi = false;
  let hasMr = false;
  let hasEn = false;
  
  if (key.includes('.')) {
    hasHi = getNestedValue(hi, key) !== undefined;
    hasMr = getNestedValue(mr, key) !== undefined;
    hasEn = getNestedValue(en, key) !== undefined;
    if (!hasEn) rawKeysMissing.push(key);
  } else {
    // Literal keys would be at the root of JSON
    hasHi = hi[key] !== undefined;
    hasMr = mr[key] !== undefined;
  }
  
  if (!hasHi) missingHi.push(key);
  if (!hasMr) missingMr.push(key);
}

console.log('TOTAL_KEYS:', usedKeys.size);
console.log('RAW_KEYS_TOTAL:', rawKeys.size);
console.log('RAW_KEYS_MISSING_EN:', rawKeysMissing.length);
console.log('MISSING_HI:', missingHi.length);
console.log('MISSING_MR:', missingMr.length);
console.log('EXAMPLES_HI:', missingHi.slice(0, 5).join(', '));
console.log('EXAMPLES_MR:', missingMr.slice(0, 5).join(', '));
