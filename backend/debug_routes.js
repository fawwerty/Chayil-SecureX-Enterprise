// Test each route module independently
const routes = [
  ['auth', './src/routes/auth'],
  ['users', './src/routes/users'],
  ['scans', './src/routes/scans'],
  ['osint', './src/routes/osint'],
  ['threats', './src/routes/threats'],
  ['contact', './src/routes/contact'],
  ['ai', './src/routes/ai'],
  ['portalData', './src/routes/portalData'],
];

for (const [name, path] of routes) {
  try {
    const mod = require(path);
    const t = typeof mod;
    const valid = t === 'function' || (t === 'object' && mod !== null && mod.handle);
    console.log(`${valid ? '✅' : '❌'} ${name}: ${t}${mod?.constructor ? ' (' + mod.constructor.name + ')' : ''}`);
  } catch(e) {
    console.log(`❌ ${name}: LOAD ERROR - ${e.message.split('\n')[0]}`);
  }
}

// Also test combined exports
const combined = require('./src/routes/combined');
for (const [key, val] of Object.entries(combined)) {
  const valid = typeof val === 'function';
  console.log(`${valid ? '✅' : '❌'} combined.${key}: ${typeof val}`);
}
