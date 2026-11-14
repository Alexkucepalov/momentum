import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { loadSrcModules } from "./loadTsModules.mjs";
const mods = loadSrcModules();
function loadRequest() {
  const input = readFileSync(
    new URL("../apps/mobile/src/integrations/requestText.ts", import.meta.url),
    "utf8",
  );
  const js = ts.transpileModule(input, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  new Function("module", "exports", js)(module, module.exports);
  return module.exports;
}
const requestModule = loadRequest();
const {
  requestText,
  RequestTimeoutError,
  RequestCancelledError,
  RequestNetworkError,
} = requestModule;
const never = () => new Promise(() => {});
const response = (text = "{}") => ({
  ok: true,
  status: 200,
  text: async () => text,
});
function mobileClient() {
  const source = readFileSync(
    new URL(
      "../apps/mobile/src/features/garmin/garminClient.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", output)(
    (s) => {
      if (s.endsWith("/requestText")) return requestModule;
      if (s.endsWith("/domain/garmin")) return mods["domain/garmin/index"];
      if (s === "./garminAuth")
        return {
          GARMIN_BASE_URL: "https://synthetic.invalid",
          GARMIN_USER_AGENT: "Synthetic test",
        };
      throw new Error(`Unexpected dependency ${s}`);
    },
    module,
    module.exports,
  );
  return module.exports;
}
test("deadline bounds missing headers even if native fetch ignores AbortSignal", async () => {
  let signal;
  await assert.rejects(
    requestText(
      "https://synthetic.invalid",
      {},
      {
        timeoutMs: 15,
        fetchImpl: async (_, init) => {
          signal = init.signal;
          return never();
        },
      },
    ),
    RequestTimeoutError,
  );
  assert.equal(signal.aborted, true);
});
test("deadline covers a stalled response body rather than stopping at headers", async () => {
  await assert.rejects(
    requestText(
      "https://synthetic.invalid",
      {},
      {
        timeoutMs: 15,
        fetchImpl: async () => ({ ...response(), text: never }),
      },
    ),
    RequestTimeoutError,
  );
});
test("already cancelled request never starts network and mid-body cancellation settles", async () => {
  const controller = new AbortController();
  controller.abort();
  let called = false;
  await assert.rejects(
    requestText(
      "https://synthetic.invalid",
      {},
      {
        signal: controller.signal,
        fetchImpl: async () => {
          called = true;
          return response();
        },
      },
    ),
    RequestCancelledError,
  );
  assert.equal(called, false);
  const live = new AbortController();
  let enter;
  const started = new Promise((resolve) => {
    enter = resolve;
  });
  const pending = requestText(
    "https://synthetic.invalid",
    {},
    {
      signal: live.signal,
      fetchImpl: async () => ({
        ...response(),
        text: () => {
          enter();
          return never();
        },
      }),
    },
  );
  await started;
  live.abort();
  await assert.rejects(pending, RequestCancelledError);
});
test("successful request clears deadline without aborting healthy native fetch", async () => {
  let signal;
  const result = await requestText(
    "https://synthetic.invalid",
    {},
    {
      timeoutMs: 15,
      fetchImpl: async (_, init) => {
        signal = init.signal;
        return response("ok");
      },
    },
  );
  assert.equal(result.text, "ok");
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(signal.aborted, false);
});
test("network errors never expose URL, key, headers or raw server diagnostics", async () => {
  const result = await requestText(
    "https://synthetic.invalid/synthetic-private-path",
    {},
    {
      fetchImpl: async () => {
        throw new Error("synthetic-private-path synthetic-credential");
      },
    },
  ).catch((e) => e);
  assert.ok(result instanceof RequestNetworkError);
  assert.doesNotMatch(
    result.message,
    /synthetic-private-path|synthetic-credential/,
  );
});
test("Garmin chunk timeout stops the operation instead of starting the rest of history", async () => {
  const originalFetch = global.fetch,
    originalTimer = global.setTimeout;
  let calls = 0;
  global.setTimeout = (fn, ms, ...args) =>
    originalTimer(fn, ms === 20_000 ? 15 : ms, ...args);
  global.fetch = async () => {
    calls++;
    return { ...response(), text: never };
  };
  try {
    await assert.rejects(
      mobileClient().fetchWeightRangeChunked(
        "synthetic",
        "2025-01-01",
        "2026-11-14",
      ),
      RequestTimeoutError,
    );
    assert.equal(calls, 1);
  } finally {
    global.fetch = originalFetch;
    global.setTimeout = originalTimer;
  }
});
test("Garmin cancellation aborts detail workers and never starts fallback requests", async () => {
  const original = global.fetch,
    controller = new AbortController(),
    signals = [];
  let ready;
  const started = new Promise((resolve) => {
    ready = resolve;
  });
  global.fetch = async (_, init) => {
    signals.push(init.signal);
    if (signals.length === 3) ready();
    return { ...response(), text: never };
  };
  try {
    const result = mobileClient().fetchActivityDetailsBatched(
      "synthetic",
      ["a", "b", "c", "d", "e"],
      3,
      controller.signal,
    );
    await started;
    controller.abort();
    await assert.rejects(result, RequestCancelledError);
    assert.equal(signals.length, 3);
    assert.ok(signals.every((s) => s.aborted));
  } finally {
    global.fetch = original;
  }
});
test("invalid OFF timestamps remain unknown instead of crashing a valid product lookup", () => {
  const { normalizeOffProduct } = mods["integrations/openFoodFacts"];
  for (const timestamp of ["not-a-date", Infinity, "1e500"]) {
    const result = normalizeOffProduct("4601234567890", {
      product: {
        product_name: "Synthetic oats",
        last_updated_t: timestamp,
        nutriments: {},
      },
    });
    assert.equal(result.status, "ok");
    assert.equal(result.sourceUpdatedAt, null);
  }
});

test("expired Garmin bearer preserves HTTP 401 and stops remaining chunks", async () => {
  const original = global.fetch;
  let calls = 0;
  global.fetch = async () => {
    calls++;
    return {
      ok: false,
      status: 401,
      text: async () => "synthetic private server diagnostics",
    };
  };
  try {
    const client = mobileClient();
    const error = await client
      .fetchWeightRangeChunked("synthetic", "2025-01-01", "2026-11-14")
      .catch((e) => e);
    assert.ok(error instanceof client.GarminClientError);
    assert.equal(error.statusCode, 401);
    assert.equal(calls, 1);
    assert.doesNotMatch(error.message, /private server diagnostics/);
  } finally {
    global.fetch = original;
  }
});

test('a delayed SecureStore key write cannot resurrect credentials after a full wipe', async () => {
  const epoch = mods['domain/localDataWipeEpoch'];
  const values = new Map();
  let finish;
  const source = readFileSync(new URL('../apps/mobile/src/features/garmin/secureKeyStore.ts', import.meta.url), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  const secure = {
    setItemAsync: (key, value) => new Promise(resolve => { finish = () => { values.set(key, value); resolve(); }; }),
    deleteItemAsync: async key => { values.delete(key); },
  };
  new Function('require', 'module', 'exports', output)(s => {
    if (s === 'expo-secure-store') return secure;
    if (s.endsWith('/localDataWipeEpoch')) return epoch;
    if (s.endsWith('/domain/garmin')) return mods['domain/garmin/index'];
    throw new Error('Unexpected dependency');
  }, module, module.exports);
  const pending = module.exports.setGarminApiKey('synthetic-not-a-real-key');
  epoch.bumpLocalDataWipeEpoch();
  finish();
  await assert.rejects(pending, /локальные данные очищены/);
  assert.equal(values.size, 0);
});
