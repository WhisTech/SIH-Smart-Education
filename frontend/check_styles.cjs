
const fs = require('fs');
const code = fs.readFileSync('./src/pages/ResearchEngine.jsx', 'utf8');
const regex = /style=\{\{([^}]+)\}\}/g;
let match;
while ((match = regex.exec(code)) !== null) {
  const styleStr = match[1];
  const props = styleStr.split(',');
  props.forEach(p => {
    const parts = p.split(':');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join(':').trim();
      // check if val is like \uppercase\ (unquoted word, not boolean/number)
      if (/^[a-zA-Z_]+$/.test(val) && val !== 'true' && val !== 'false') {
        console.log('Suspicious style value:', p.trim());
      }
    }
  });
}

