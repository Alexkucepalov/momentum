#!/usr/bin/env node
/**
 * Local dogfood APK via expo prebuild + Gradle release (JS bundle embedded).
 * Expects JAVA_HOME + ANDROID_HOME (or ~/.momentum-build toolchain).
 *
 * FORCE_PREBUILD=1 — wipe android/ and re-run expo prebuild.
 * APK_ABIS=arm64-v8a,x86_64 — native ABIs to package (default arm64-v8a: real phones).
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const toolRoot = join(homedir(), '.momentum-build');
const forcePrebuild = process.env.FORCE_PREBUILD === '1';
const abis = (process.env.APK_ABIS ?? 'arm64-v8a').trim();

function resolveJavaHome() {
  if (process.env.JAVA_HOME && existsSync(join(process.env.JAVA_HOME, 'bin', 'java'))) {
    return process.env.JAVA_HOME;
  }
  const macHome = join(toolRoot, 'jdk', 'Contents', 'Home');
  if (existsSync(join(macHome, 'bin', 'java'))) return macHome;
  const plain = join(toolRoot, 'jdk');
  if (existsSync(join(plain, 'bin', 'java'))) return plain;
  return null;
}

function resolveAndroidHome() {
  if (process.env.ANDROID_HOME && existsSync(process.env.ANDROID_HOME)) {
    return process.env.ANDROID_HOME;
  }
  if (process.env.ANDROID_SDK_ROOT && existsSync(process.env.ANDROID_SDK_ROOT)) {
    return process.env.ANDROID_SDK_ROOT;
  }
  const local = join(toolRoot, 'android-sdk');
  if (existsSync(local)) return local;
  return null;
}

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: false,
    ...opts,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const javaHome = resolveJavaHome();
const androidHome = resolveAndroidHome();

if (!javaHome) {
  console.error('JAVA_HOME not found. Install JDK 17 or run toolchain setup under ~/.momentum-build/jdk');
  process.exit(1);
}
if (!androidHome) {
  console.error('ANDROID_HOME not found. Install Android SDK or run toolchain under ~/.momentum-build/android-sdk');
  process.exit(1);
}

process.env.JAVA_HOME = javaHome;
process.env.ANDROID_HOME = androidHome;
process.env.ANDROID_SDK_ROOT = androidHome;
process.env.PATH = [
  join(javaHome, 'bin'),
  join(androidHome, 'cmdline-tools', 'latest', 'bin'),
  join(androidHome, 'platform-tools'),
  process.env.PATH ?? '',
].join(':');

console.log(`JAVA_HOME=${javaHome}`);
console.log(`ANDROID_HOME=${androidHome}`);

const androidDir = join(root, 'android');
const needsPrebuild = forcePrebuild || !existsSync(join(androidDir, 'gradlew'));

if (needsPrebuild) {
  if (existsSync(androidDir)) {
    console.log('Cleaning previous android/ prebuild…');
    rmSync(androidDir, { recursive: true, force: true });
  }
  run('npx', ['expo', 'prebuild', '--platform', 'android'], {
    env: { ...process.env, CI: '1' },
  });
} else {
  console.log('Reusing existing android/ (set FORCE_PREBUILD=1 to regenerate)');
}

const gradlew = join(androidDir, 'gradlew');
if (!existsSync(gradlew)) {
  console.error('expo prebuild did not create android/gradlew');
  process.exit(1);
}

// Release embeds index.android.bundle — debug APK expects Metro and fails on device.
console.log(`ABIs: ${abis}`);
run(gradlew, ['assembleRelease', '--no-daemon', `-PreactNativeArchitectures=${abis}`], {
  cwd: androidDir,
});

const apkDir = join(androidDir, 'app', 'build', 'outputs', 'apk', 'release');
const apkName = readdirSync(apkDir).find((name) => name.endsWith('.apk'));
if (!apkName) {
  console.error(`No APK found in ${apkDir}`);
  process.exit(1);
}

const outDir = join(root, 'dist');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'momentum-dogfood.apk');
copyFileSync(join(apkDir, apkName), outPath);
console.log(`\nAPK ready (standalone, no Metro): ${outPath}`);
