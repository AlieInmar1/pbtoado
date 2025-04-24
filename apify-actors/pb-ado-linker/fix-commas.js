// Script to fix missing commas in function calls in main.js
import fs from 'fs';

// Read the file
let content = fs.readFileSync('main.js', 'utf8');

// Fix missing commas in saveScreenshot calls
content = content.replace(/saveScreenshot\(page\s+'/g, "saveScreenshot(page, '");

// Fix missing commas in console.log and innerHTML.substring calls
content = content.replace(/modalHtml\.substring\(0\s+(\d+)\)/g, "modalHtml.substring(0, $1)");

// Fix catch blocks with missing braces
content = content.replace(/}\s+catch\s+\(/g, "} catch (");

// Save the fixed content
fs.writeFileSync('main.js', content);

console.log('Fixed missing commas in main.js');
