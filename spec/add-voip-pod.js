#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const PLUGIN_ID = 'pushwoosh-cordova-plugin';
const SUBSPEC = 'PushwooshXCFramework/PushwooshVoIP';
const SPM_ANCHOR = 'pushwoosh-voip-anchor';
const SPM_PRODUCT = '.product(name: "PushwooshVoIP", package: "Pushwoosh-XCFramework")';

/**
 * after_plugin_install (ios): links PushwooshVoIP when PW_VOIP_IOS_ENABLED=true. cordova-ios 8 gets the SPM
 * product added to the plugin copy under platforms/ios/packages, older cordova-ios gets the Podfile subspec.
 */
module.exports = function (ctx) {
  const projectRoot = ctx.opts.projectRoot;
  const iosPlatformPath = path.join(projectRoot, 'platforms', 'ios');
  const swiftPackage = runsAsSwiftPackage(iosPlatformPath);
  if (swiftPackage) warnAboutLeftoverPods(iosPlatformPath);

  // Cordova tracks plugin vars in plugins/fetch.json — the only source populated this early
  const fetchPath = path.join(projectRoot, 'plugins', 'fetch.json');
  if (!fs.existsSync(fetchPath)) return;

  let vars;
  try {
    const fetched = JSON.parse(fs.readFileSync(fetchPath, 'utf8'));
    const entry = fetched[PLUGIN_ID];
    vars = (entry && entry.variables) || {};
  } catch (_) {
    return;
  }

  if (String(vars.PW_VOIP_IOS_ENABLED || 'false').toLowerCase() !== 'true') return;

  if (swiftPackage) {
    linkSwiftPackageProduct(iosPlatformPath);
    return;
  }

  const podfilePath = path.join(iosPlatformPath, 'Podfile');
  if (!fs.existsSync(podfilePath)) return;

  const lines = fs.readFileSync(podfilePath, 'utf8').split('\n');
  if (lines.some(line => line.includes(SUBSPEC))) return;

  const index = lines.findIndex(line =>
    line.trim().startsWith(`pod 'PushwooshXCFramework'`) && !line.includes('/')
  );
  if (index === -1) return;

  const versionMatch = lines[index].match(/'PushwooshXCFramework',\s*'([^']+)'/);
  const voipPodLine = versionMatch
    ? `\tpod '${SUBSPEC}', '${versionMatch[1]}'`
    : `\tpod '${SUBSPEC}'`;

  lines.splice(index + 1, 0, voipPodLine);
  fs.writeFileSync(podfilePath, lines.join('\n'), 'utf8');
  console.log(`[${PLUGIN_ID}] Added ${SUBSPEC} to platforms/ios/Podfile`);

  try {
    childProcess.execSync('pod install', { cwd: iosPlatformPath, stdio: 'inherit' });
  } catch (_) {}
};

// cordova-ios 8 lists a Swift package plugin in packages/cordova-ios-plugins/Package.swift
function runsAsSwiftPackage(iosPlatformPath) {
  const manifestPath = path.join(iosPlatformPath, 'packages', 'cordova-ios-plugins', 'Package.swift');
  return fs.existsSync(manifestPath) && fs.readFileSync(manifestPath, 'utf8').includes(PLUGIN_ID);
}

// Pods left by plugin 8.3.76 and older survive a restore over an existing platform, and cordova-ios 8
// does not remove nospm pods on uninstall either (Api.js:491): only a fresh platform gets rid of them.
function warnAboutLeftoverPods(iosPlatformPath) {
  const pods = new Set();

  try {
    const podsJson = JSON.parse(fs.readFileSync(path.join(iosPlatformPath, 'pods.json'), 'utf8'));
    Object.keys(podsJson.libraries || {}).filter(name => name.startsWith('Pushwoosh')).forEach(name => pods.add(name));
  } catch (_) {}

  const podfilePath = path.join(iosPlatformPath, 'Podfile');
  if (fs.existsSync(podfilePath)) {
    for (const line of fs.readFileSync(podfilePath, 'utf8').split('\n')) {
      const match = line.match(/^\s*pod\s+'(Pushwoosh[^'\/]*)/);
      if (match) pods.add(match[1]);
    }
  }

  if (!pods.size) return;
  console.warn(`[${PLUGIN_ID}] platforms/ios still has the CocoaPods ${[...pods].join(', ')} from an earlier plugin version, while this version gets the native SDK through Swift Package Manager. The build will fail with "Multiple commands produce ... PushwooshFramework.framework". Recreate the iOS platform: cordova platform rm ios && cordova platform add ios`);
}

function linkSwiftPackageProduct(iosPlatformPath) {
  const packagesPath = path.join(iosPlatformPath, 'packages');

  // With --link cordova-ios references the plugin sources in place instead of copying them:
  // editing that Package.swift would modify the plugin checkout, so leave it to the developer.
  const copyPath = path.join(packagesPath, PLUGIN_ID, 'Package.swift');
  if (!fs.existsSync(copyPath)) {
    console.warn(`[${PLUGIN_ID}] PushwooshVoIP was not linked: the plugin is installed with --link, so there is no copy under platforms/ios/packages to edit. Add ${SPM_PRODUCT} to the plugin target dependencies in its Package.swift.`);
    return;
  }

  const lines = fs.readFileSync(copyPath, 'utf8').split('\n');
  if (lines.some(line => line.includes(SPM_PRODUCT))) return;

  const index = lines.findIndex(line => line.includes(SPM_ANCHOR));
  if (index === -1) {
    console.warn(`[${PLUGIN_ID}] PushwooshVoIP was not linked: anchor "${SPM_ANCHOR}" is missing in ${copyPath}. Add ${SPM_PRODUCT} to the plugin target dependencies there.`);
    return;
  }

  const indent = lines[index].match(/^\s*/)[0];
  lines.splice(index + 1, 0, `${indent}${SPM_PRODUCT},`);
  fs.writeFileSync(copyPath, lines.join('\n'), 'utf8');
  console.log(`[${PLUGIN_ID}] Added PushwooshVoIP to platforms/ios/packages/${PLUGIN_ID}/Package.swift`);
}
