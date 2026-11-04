import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

let files = [];
try {
  files = execFileSync('git', ['ls-files'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
    .split('\n')
    .filter(Boolean);
} catch {
  console.log(
    'No git repository yet: tracked-file filename scan deferred until repository initialized.',
  );
  process.exit(0);
}

const badNames = files.filter(
  (x) =>
    /(^|\/)(\.env(\..+)?|.*\.keystore|.*\.jks|.*\.sqlite|.*\.db)$/.test(x) &&
    x !== '.env.example',
);
if (badNames.length) {
  console.error('Sensitive files tracked:', badNames);
  process.exit(1);
}

/** Lightweight content patterns — not a full secret scanner. */
const CONTENT_PATTERNS = [
  {
    name: 'private-key-block',
    re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  {
    name: 'aws-access-key',
    re: /AKIA[0-9A-Z]{16}/,
  },
  {
    // Literal secret-looking values only (skip SecureStore key *names* with dots).
    name: 'generic-api-key-assignment',
    re: /(?:api[_-]?key|secret[_-]?key|client[_-]?secret)\s*[:=]\s*['"][A-Za-z0-9_+\-\/=]{24,}['"]/i,
  },
];

const SKIP_EXT = /\.(png|jpg|jpeg|gif|webp|apk|aab|jar|so|ttf|otf|woff2?|pdf|lock)$/i;
const SKIP_PATH =
  /(^|\/)(node_modules|dist|coverage|\.git|android\/build|ios\/Pods)\//i;

const contentHits = [];
for (const file of files) {
  if (SKIP_EXT.test(file) || SKIP_PATH.test(file)) continue;
  if (file.endsWith('check-secrets.mjs')) continue;
  let body;
  try {
    body = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  // Skip huge text dumps
  if (body.length > 1_500_000) continue;
  for (const { name, re } of CONTENT_PATTERNS) {
    if (re.test(body)) {
      contentHits.push(`${file} (${name})`);
      break;
    }
  }
}

if (contentHits.length) {
  console.error('Possible secrets in tracked content:', contentHits);
  process.exit(1);
}

console.log('Tracked-file names + light content patterns OK.');
