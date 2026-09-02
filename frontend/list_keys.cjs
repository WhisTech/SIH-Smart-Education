const fs = require('fs');
const path = require('path');

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

const allJsxFiles = getAllFiles(path.join(__dirname, 'src'));
const usedKeys = new Set();
const tRegex = /t\(["']([^"']+)["']\)/g;
for (const file of allJsxFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = tRegex.exec(content)) !== null) {
    usedKeys.add(match[1]);
  }
}

// Print all keys that are literal (no dots) or have dots
const literal = [...usedKeys].filter(k => !k.includes('.')).sort();
const dotted = [...usedKeys].filter(k => k.includes('.')).sort();

console.log('=== LITERAL KEYS (natural language) ===');
literal.forEach(k => console.log(JSON.stringify(k)));
console.log('\n=== DOTTED KEYS (technical) ===');
dotted.forEach(k => console.log(JSON.stringify(k)));
