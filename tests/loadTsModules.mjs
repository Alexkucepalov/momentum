import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

function listTsFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) out.push(...listTsFiles(p));
    else if (name.name.endsWith('.ts')) out.push(p);
  }
  return out;
}

// Load root src TypeScript files as CommonJS with relative imports resolved.
export function loadSrcModules() {
  const files = listTsFiles(join(root, 'src'));
  const cache = new Map();

  function load(absPath) {
    const normalized = absPath.replace(/\\/g, '/');
    if (cache.has(normalized)) return cache.get(normalized).exports;
    const mod = { exports: {} };
    cache.set(normalized, mod);
    const source = readFileSync(absPath, 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
      fileName: absPath,
    });
    const localRequire = (spec) => {
      if (spec.startsWith('.')) {
        let resolved = join(dirname(absPath), spec);
        if (resolved.endsWith('.js')) resolved = resolved.slice(0, -3) + '.ts';
        if (!resolved.endsWith('.ts')) {
          const asFile = `${resolved}.ts`;
          const asIndex = join(resolved, 'index.ts');
          if (existsSync(asFile)) resolved = asFile;
          else if (existsSync(asIndex)) resolved = asIndex;
          else resolved = asFile;
        }
        return load(resolved);
      }
      return require(spec);
    };
    // eslint-disable-next-line no-new-func
    new Function('require', 'module', 'exports', '__filename', '__dirname', outputText)(
      localRequire,
      mod,
      mod.exports,
      absPath,
      dirname(absPath),
    );
    return mod.exports;
  }

  const map = {};
  for (const f of files) {
    const key = relative(join(root, 'src'), f).replace(/\\/g, '/').replace(/\.ts$/, '');
    map[key] = load(f);
  }
  return map;
}
