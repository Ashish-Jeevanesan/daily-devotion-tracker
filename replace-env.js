const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist/devotion-tracker');

function replaceInFile(file) {
  const filePath = path.join(distPath, file);
  let content = fs.readFileSync(filePath, 'utf8');

  content = content
    .replace(/__SUPABASE_URL__/g, process.env.NG_APP_SUPABASE_URL)
    .replace(/__SUPABASE_ANON_KEY__/g, process.env.NG_APP_SUPABASE_ANON_KEY);

  fs.writeFileSync(filePath, content);
}

fs.readdirSync(distPath)
  .filter(f => f.endsWith('.js'))
  .forEach(replaceInFile);

console.log('✅ Environment variables injected');
