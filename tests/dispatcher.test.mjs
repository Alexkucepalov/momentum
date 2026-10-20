import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

function loadTs(rel) {
  const abs = join(root, rel);
  const source = readFileSync(abs, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: abs,
  });
  const mod = { exports: {} };
  const localRequire = (spec) => {
    if (spec.startsWith('.')) {
      const resolved = join(dirname(abs), spec.replace(/\.js$/, '') + '.ts');
      return loadTs(resolved.replace(root + '/', '').replace(/\\/g, '/').replace(/^\//, '') || resolved);
    }
    return require(spec);
  };
  // Fix relative path for loadTs when given absolute
  const run = new Function('exports', 'require', 'module', '__filename', '__dirname', outputText);
  run(mod.exports, (s) => {
    if (s.startsWith('.')) {
      const base = dirname(abs);
      let candidate = join(base, s);
      if (!candidate.endsWith('.ts')) {
        candidate = candidate.replace(/\.js$/, '') + '.ts';
      }
      return loadTsFile(candidate);
    }
    return require(s);
  }, mod, abs, dirname(abs));
  return mod.exports;
}

function loadTsFile(absPath) {
  const source = readFileSync(absPath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: absPath,
  });
  const mod = { exports: {} };
  const run = new Function('exports', 'require', 'module', '__filename', '__dirname', outputText);
  run(
    mod.exports,
    (s) => {
      if (s.startsWith('.')) {
        let candidate = join(dirname(absPath), s);
        if (!candidate.endsWith('.ts')) candidate = candidate.replace(/\.js$/, '') + '.ts';
        return loadTsFile(candidate);
      }
      return require(s);
    },
    mod,
    absPath,
    dirname(absPath),
  );
  return mod.exports;
}

const select = loadTsFile(join(root, 'automation/dispatcher/select-next-issue.ts'));
const state = loadTsFile(join(root, 'automation/dispatcher/state.ts'));
const prompt = loadTsFile(join(root, 'automation/dispatcher/prompt.ts'));

function issue(partial) {
  return {
    number: 1,
    title: 't',
    body: '## Acceptance\n- [ ] do thing',
    state: 'open',
    labels: ['agent-ready', 'dogfood'],
    html_url: 'https://github.com/x/y/issues/1',
    ...partial,
  };
}

test('selectNextIssue picks lowest p0 then number', () => {
  const r = select.selectNextIssue({
    issues: [
      issue({ number: 5, labels: ['agent-ready', 'p1'], title: 'later' }),
      issue({ number: 3, labels: ['agent-ready', 'p0'], title: 'first' }),
      issue({ number: 4, labels: ['agent-ready', 'p0'], title: 'second' }),
    ],
    openPulls: [],
    closedIssueNumbers: new Set(),
    activeIssueNumbers: [],
  });
  assert.equal(r.kind, 'pick');
  assert.equal(r.issue.number, 3);
});

test('selectNextIssue skips needs-human and missing acceptance', () => {
  const r = select.selectNextIssue({
    issues: [
      issue({ number: 2, labels: ['agent-ready', 'needs-human'] }),
      issue({ number: 3, body: 'short' }),
      issue({ number: 4 }),
    ],
    openPulls: [],
    closedIssueNumbers: new Set(),
    activeIssueNumbers: [],
  });
  assert.equal(r.kind, 'pick');
  assert.equal(r.issue.number, 4);
});

test('selectNextIssue respects dependencies', () => {
  const r = select.selectNextIssue({
    issues: [
      issue({
        number: 10,
        body: '## Acceptance\n- [x] ok\nDepends-on: #9',
      }),
    ],
    openPulls: [],
    closedIssueNumbers: new Set(),
    activeIssueNumbers: [],
  });
  assert.equal(r.kind, 'none');

  const r2 = select.selectNextIssue({
    issues: [
      issue({
        number: 10,
        body: '## Acceptance\n- [x] ok\nDepends-on: #9',
      }),
    ],
    openPulls: [],
    closedIssueNumbers: new Set([9]),
    activeIssueNumbers: [],
  });
  assert.equal(r2.kind, 'pick');
});

test('selectNextIssue blocks when serial active', () => {
  const r = select.selectNextIssue({
    issues: [issue({ number: 8 })],
    openPulls: [],
    closedIssueNumbers: new Set(),
    activeIssueNumbers: [7],
  });
  assert.equal(r.kind, 'blocked');
});

test('selectNextIssue skips issue with open linked PR', () => {
  const r = select.selectNextIssue({
    issues: [issue({ number: 12 })],
    openPulls: [
      {
        number: 99,
        html_url: 'https://github.com/x/y/pull/99',
        state: 'open',
        draft: false,
        merged_at: null,
        title: 'feat',
        body: 'Closes #12',
        headRef: 'feat/12-x',
      },
    ],
    closedIssueNumbers: new Set(),
    activeIssueNumbers: [],
  });
  assert.equal(r.kind, 'none');
});

test('parseDependencies extracts issue numbers', () => {
  assert.deepEqual(select.parseDependencies('Depends-on: #3 and blocked by #4'), [3, 4]);
});

test('state round-trip', () => {
  const s = state.freshState(42, true, new Date('2026-01-01T00:00:00Z'));
  const blob = state.serializeState(s);
  const parsed = state.parseStateFromComment(`hello\n${blob}\n`);
  assert.equal(parsed.issueNumber, 42);
  assert.equal(parsed.dryRun, true);
});

test('idempotentAgentId is stable for same inputs', () => {
  const a = prompt.idempotentAgentId(15, '2026-10-19T12:00:00.000Z');
  const b = prompt.idempotentAgentId(15, '2026-10-19T12:00:00.000Z');
  assert.equal(a, b);
  assert.match(a, /^bc-[0-9a-f-]{36}$/);
});

test('buildAgentPrompt includes verify and never merge', () => {
  const t = prompt.buildAgentPrompt(issue({ number: 15, title: 'X' }), 'https://github.com/Alexkucepalov/momentum');
  assert.match(t, /npm run verify/);
  assert.match(t, /NEVER merge/i);
  assert.match(t, /#15/);
});
