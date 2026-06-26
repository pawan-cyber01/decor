const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('c:/sites/decor2/admin.html', 'utf8');
const scriptMatches = html.match(/<script type=\"module\">([\s\S]*?)<\/script>/);
if (scriptMatches) {
  try {
    new vm.Script(scriptMatches[1]);
    console.log('No syntax errors!');
  } catch (e) {
    console.error('Syntax error:', e);
  }
} else {
  console.log('Script tag not found');
}
