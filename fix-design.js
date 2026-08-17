const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Colors
  content = content.replace(/border-\[#E2E8F0\]/g, 'border-border');
  content = content.replace(/text-\[#475569\]/g, 'text-muted-foreground');
  
  // Text sizes
  content = content.replace(/text-\[10px\]/g, 'text-xs tracking-tight');
  content = content.replace(/text-\[11px\]/g, 'text-xs');

  // Icons
  content = content.replace(/MoreVertical/g, 'MoreHorizontal');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
