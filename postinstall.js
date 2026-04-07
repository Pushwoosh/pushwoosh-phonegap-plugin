#!/usr/bin/env node
/**
 * postinstall.js — Conditional VoIP support for Capacitor projects.
 *
 * Cordova hooks (spec/add-voip-pod.js, spec/set-voip-gradle-prop.js) do NOT
 * run in Capacitor.  This script patches plugin.xml at npm-install time so
 * that `npx cap sync` picks up the VoIP pod when the consuming app opts in.
 *
 * Config (in the consuming app's package.json):
 *   "pushwoosh-cordova-plugin": { "PW_VOIP_IOS_ENABLED": true }
 *
 * Android VoIP is already conditional via add-android-voip.gradle reading
 * PW_VOIP_ANDROID_ENABLED from gradle.properties — no patching needed here.
 */
const fs = require('fs');
const path = require('path');

// ── helpers ──────────────────────────────────────────────────────────

function findProjectRoot() {
  // Walk up from node_modules/pushwoosh-cordova-plugin/ to the project root
  let dir = path.resolve(__dirname, '..', '..');
  // Verify it looks like a project root
  if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
  // Fallback: traverse up until we find a package.json outside node_modules
  dir = __dirname;
  while (dir !== path.dirname(dir)) {
    dir = path.dirname(dir);
    if (!dir.includes('node_modules') && fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
  }
  return null;
}

function isCapacitorProject(root) {
  return ['capacitor.config.ts', 'capacitor.config.json', 'capacitor.config.js']
    .some(f => fs.existsSync(path.join(root, f)));
}

function readVoipIosEnabled(root) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

    // Capacitor convention: top-level key matching the plugin name
    const capConfig = pkg['pushwoosh-cordova-plugin'] || {};
    if (String(capConfig.PW_VOIP_IOS_ENABLED).toLowerCase() === 'true') return true;

    // Cordova convention: cordova.plugins section
    const cordovaConfig = pkg?.cordova?.plugins?.['pushwoosh-cordova-plugin'] || {};
    if (String(cordovaConfig.PW_VOIP_IOS_ENABLED).toLowerCase() === 'true') return true;
  } catch (_) {}
  return false;
}

// ── main ─────────────────────────────────────────────────────────────

const projectRoot = findProjectRoot();
if (!projectRoot) process.exit(0);
if (!isCapacitorProject(projectRoot)) process.exit(0);

const voipEnabled = readVoipIosEnabled(projectRoot);
if (!voipEnabled) {
  console.log('[pushwoosh-cordova-plugin] PW_VOIP_IOS_ENABLED not set — VoIP pod skipped');
  process.exit(0);
}

const pluginXmlPath = path.join(__dirname, 'plugin.xml');
if (!fs.existsSync(pluginXmlPath)) process.exit(0);

let content = fs.readFileSync(pluginXmlPath, 'utf8');

if (content.includes('PushwooshVoIP')) {
  console.log('[pushwoosh-cordova-plugin] PushwooshVoIP pod already present');
  process.exit(0);
}

// Insert VoIP pod right after the main PushwooshXCFramework pod line
const pattern = /(<pod name="PushwooshXCFramework" spec="([^"]*)" \/>)/;
const match = content.match(pattern);
if (match) {
  const spec = match[2]; // reuse the same version
  const voipLine = `<pod name="PushwooshXCFramework/PushwooshVoIP" spec="${spec}" />`;
  content = content.replace(pattern, `$1\n                ${voipLine}`);
  fs.writeFileSync(pluginXmlPath, content, 'utf8');
  console.log(`[pushwoosh-cordova-plugin] Added PushwooshVoIP pod (spec ${spec}) to plugin.xml`);
} else {
  console.warn('[pushwoosh-cordova-plugin] Could not find PushwooshXCFramework pod in plugin.xml');
}
