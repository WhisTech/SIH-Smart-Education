const fs = require('fs');
const path = require('path');

const hi = JSON.parse(fs.readFileSync('src/i18n/locales/hi/translation.json'));
const mr = JSON.parse(fs.readFileSync('src/i18n/locales/mr/translation.json'));

const skipSet = new Set(['-','*','id','@','start','type','initial',
  'id, name, category','id, name, description, category','content-type','skill_id']);

function getAllFiles(dir, fileList) {
  fileList = fileList || [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) getAllFiles(filePath, fileList);
    else if (filePath.endsWith('.jsx')) fileList.push(filePath);
  }
  return fileList;
}

const usedKeys = new Set();
// Match t("...") or t('...')
const tRegex = /t\(["']([^"']+)["']\)/g;
for (const file of getAllFiles('src')) {
  const content = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = tRegex.exec(content)) !== null) usedKeys.add(m[1]);
}

// Navigate nested object by dot-path (for technical keys like auth.feature_1_title)
// A technical key uses only letters, digits, underscores, separated by dots
function isTechnicalDotKey(key) {
  return /^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)+$/.test(key);
}

function getNestedVal(obj, key) {
  const parts = key.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && Object.prototype.hasOwnProperty.call(cur, p)) {
      cur = cur[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

function getVal(obj, key) {
  if (isTechnicalDotKey(key)) {
    return getNestedVal(obj, key);
  }
  return obj[key];
}

const missingHi = [];
const missingMr = [];

for (const key of usedKeys) {
  if (skipSet.has(key)) continue;
  if (!getVal(hi, key) !== false && getVal(hi, key) === undefined) missingHi.push(key);
  if (!getVal(mr, key) !== false && getVal(mr, key) === undefined) missingMr.push(key);
}

console.log('Missing HI:', missingHi.length);
console.log('Missing MR:', missingMr.length);
if (missingHi.length > 0) {
  console.log('\nActually missing in HI:');
  missingHi.forEach(k => console.log(' ', JSON.stringify(k)));
}
