const fs = require('fs');
const path = require('path');

console.log('NG_APP_SUPABASE_URL:', process.env.NG_APP_SUPABASE_URL);
console.log('NG_APP_SUPABASE_ANON_KEY:', process.env.NG_APP_SUPABASE_ANON_KEY);
console.log('NG_APP_VAPID_PUBLIC_KEY:', process.env.NG_APP_VAPID_PUBLIC_KEY ? '[set]' : '[not set]');

const distPath = path.join(__dirname, 'dist/devotion-tracker/browser');

function replaceInFile(file) {
  const filePath = path.join(distPath, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (process.env.NG_APP_SUPABASE_URL) {
    content = content.replace(/__SUPABASE_URL__/g, process.env.NG_APP_SUPABASE_URL);
  }
  if (process.env.NG_APP_SUPABASE_ANON_KEY) {
    content = content.replace(/__SUPABASE_ANON_KEY__/g, process.env.NG_APP_SUPABASE_ANON_KEY);
  }
  if (process.env.NG_APP_VAPID_PUBLIC_KEY) {
    content = content.replace(/__VAPID_PUBLIC_KEY__/g, process.env.NG_APP_VAPID_PUBLIC_KEY);
  }

  fs.writeFileSync(filePath, content);
}

try {
  const files = fs.readdirSync(distPath);
  files
    .filter(f => f.endsWith('.js'))
    .forEach(replaceInFile);
  console.log('✅ Environment variables injected');
} catch (err) {
  console.error('Error reading dist directory:', err);
  process.exit(1);
}

