import { execFileSync } from 'node:child_process';
let files = [];
try { files = execFileSync('git', ['ls-files'], { encoding: 'utf8', stdio: ['ignore','pipe','ignore'] }).split('\n').filter(Boolean); }
catch { console.log('No git repository yet: tracked-file filename scan deferred until repository initialized.'); process.exit(0); }
const bad = files.filter(x => /(^|\/)(\.env(\..+)?|.*\.keystore|.*\.jks|.*\.sqlite|.*\.db)$/.test(x) && x !== '.env.example');
if (bad.length) { console.error('Sensitive files tracked:', bad); process.exit(1); }
console.log('Tracked-file names OK (not a full content secret scan).');
