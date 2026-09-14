const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'src', 'api');
const files = fs.readdirSync(apiDir).filter(f => f.endsWith('Service.ts'));

files.forEach(file => {
  const filePath = path.join(apiDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  content = content.replace(/if\s*\(\s*true\s*\)\s*\{/g, 'if (false) {');
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
