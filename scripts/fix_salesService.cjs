const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/services/salesService.ts');
let content = fs.readFileSync(filePath, 'utf8');

// The pattern: inside async method body there's a blank line followed immediately by try {
// We need to insert "if (true) {" before the try block in those cases.
// Pattern: after async function opening brace we see "\n    \n      try {"
// Replace "\n    \n      try {" with "\n    if (true) {\n      try {"

// This regex matches the specific broken pattern: a line with only whitespace, then a try block indented with 6 spaces
// (meaning it's inside an if block that's missing)
content = content.replace(/\n    \r?\n      try \{/g, '\n    if (true) {\n      try {');
content = content.replace(/\n    \n      try \{/g, '\n    if (true) {\n      try {');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed salesService.ts');

// Verify count
const matches = (content.match(/if \(true\) \{/g) || []).length;
console.log(`Found ${matches} if(true) blocks`);
