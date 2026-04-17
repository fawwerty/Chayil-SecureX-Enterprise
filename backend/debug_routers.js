const combined = require('./src/routes/combined');
console.log('--- Router Verification ---');
for (const [key, val] of Object.entries(combined)) {
  console.log(`${key}: ${typeof val === 'function' ? 'FUNCTION (OK)' : typeof val}`);
  if (typeof val === 'object' && val !== null) {
     console.log(`  Constructor: ${val.constructor?.name}`);
  }
}
