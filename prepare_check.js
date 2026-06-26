const fs = require('fs');
const html = fs.readFileSync('c:/sites/decor2/admin.html', 'utf8');
const scriptMatches = html.match(/<script type=\"module\">([\s\S]*?)<\/script>/);
if (scriptMatches) {
  try {
    const code = scriptMatches[1];
    // Write code to a temp file and run node --check
    fs.writeFileSync('c:/sites/decor2/temp_check.js', code);
    console.log('File temp_check.js written');
  } catch(e) {
    console.log('Error', e);
  }
}
