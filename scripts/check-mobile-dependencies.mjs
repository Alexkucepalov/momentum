import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mobile = createRequire(join(root, "apps/mobile/package.json"));
const router = createRequire(mobile.resolve("expo-router/package.json"));
const query = router("query-string");
const queryRequire = createRequire(router.resolve("query-string"));
assert.equal(
  realpathSync(queryRequire.resolve("decode-uri-component")),
  join(root, "apps/mobile/vendor/decode-uri-component-cjs/index.cjs"),
  "Do not fall back to an unpatched system decoder",
);
assert.equal(
  typeof query.parse,
  "function",
  "Router needs named CommonJS query methods",
);
assert.equal(typeof query.stringify, "function");
for (const value of [
  "Вело + сила",
  "42,5",
  "/activity?segment=sleep",
  "a&b=c#d",
  "",
])
  assert.equal(query.parse(query.stringify({ value })).value, value);
assert.deepEqual(query.parse("item=a&item=b").item, ["a", "b"]);
assert.equal(query.parse("segment=sleep").segment, "sleep");
assert.equal(query.parse("empty&zero=0").empty, null);
assert.equal(query.parse("empty&zero=0").zero, "0");
assert.equal(typeof query.parse("q=" + "%E0%A4%A".repeat(500)).q, "string");
const fingerprint = mobile.resolve("@expo/fingerprint");
const paths = mobile(join(dirname(fingerprint), "utils/Path.js"));
assert.equal(
  paths.isIgnoredPath("node_modules/test/a.ts", ["node_modules/**"]),
  true,
);
assert.equal(paths.isIgnoredPath("src/app.ts", ["node_modules/**"]), false);
const patterns = paths.buildPathMatchObjects(["**/*.ts", "!**/keep.ts"]);
assert.equal(paths.isIgnoredPathWithMatchObjects("src/app.ts", patterns), true);
assert.equal(
  paths.isIgnoredPathWithMatchObjects("src/keep.ts", patterns),
  false,
);
console.log(
  "Mobile dependency compatibility: Router CommonJS/deeplinks and Expo fingerprint globs passed.",
);
