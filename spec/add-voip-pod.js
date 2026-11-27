#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const PLUGIN_ID = 'pushwoosh-cordova-plugin';
const SUBSPEC = 'PushwooshXCFramework/PushwooshVoIP';

// Optional native modules linked on cordova-ios 8, each after its anchor line in the plugin Package.swift.
// Only VoIP has a CocoaPods counterpart; the others are Swift Package Manager only.
const SPM_MODULES = [
  {
    variable: 'PW_VOIP_IOS_ENABLED',
    name: 'PushwooshVoIP',
    anchor: 'pushwoosh-voip-anchor',
    dependency: '.product(name: "PushwooshVoIP", package: "Pushwoosh-XCFramework")'
  },
  {
    variable: 'PW_INAPP_IOS_ENABLED',
    name: 'PushwooshInApp',
    anchor: 'pushwoosh-inapp-anchor',
    dependency: '.product(name: "PushwooshInApp", package: "Pushwoosh-XCFramework")'
  },
  {
    // The plugin's own Swift target: it brings the PushwooshInboxKit product along
    variable: 'PW_INBOX_IOS_ENABLED',
    name: 'PushwooshInboxKit',
    anchor: 'pushwoosh-inbox-anchor',
    dependency: '.target(name: "PushwooshCordovaInbox")'
  }
];

/**
 * after_plugin_install (ios): links the optional modules whose variables are true. cordova-ios 8 gets the SPM
 * dependencies added to the plugin copy under platforms/ios/packages, older cordova-ios gets the VoIP Podfile subspec.
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

  const enabled = variable => String(vars[variable] || 'false').toLowerCase() === 'true';

  if (swiftPackage) {
    SPM_MODULES.filter(module => enabled(module.variable)).forEach(module => linkSwiftPackageModule(iosPlatformPath, module));
    return;
  }

  const spmOnly = SPM_MODULES.filter(module => module.variable !== 'PW_VOIP_IOS_ENABLED' && enabled(module.variable));
  if (spmOnly.length) {
    console.warn(`[${PLUGIN_ID}] ${spmOnly.map(module => module.variable).join(', ')} only work on cordova-ios 8 and later, where the plugin gets the native SDK through Swift Package Manager. This platform uses CocoaPods, so the plugin does not link ${spmOnly.map(module => module.name).join(' or ')}.`);
  }

  if (!enabled('PW_VOIP_IOS_ENABLED')) return;

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

function linkSwiftPackageModule(iosPlatformPath, module) {
  const packagesPath = path.join(iosPlatformPath, 'packages');

  // With --link cordova-ios references the plugin sources in place instead of copying them:
  // editing that Package.swift would modify the plugin checkout, so leave it to the developer.
  const copyPath = path.join(packagesPath, PLUGIN_ID, 'Package.swift');
  if (!fs.existsSync(copyPath)) {
    console.warn(`[${PLUGIN_ID}] ${module.name} was not linked: the plugin is installed with --link, so there is no copy under platforms/ios/packages to edit. Add ${module.dependency} to the plugin target dependencies in its Package.swift.`);
    return;
  }

  const lines = fs.readFileSync(copyPath, 'utf8').split('\n');
  if (lines.some(line => line.includes(module.dependency))) return;

  const index = lines.findIndex(line => line.includes(module.anchor));
  if (index === -1) {
    console.warn(`[${PLUGIN_ID}] ${module.name} was not linked: anchor "${module.anchor}" is missing in ${copyPath}. Add ${module.dependency} to the plugin target dependencies there.`);
    return;
  }

  const indent = lines[index].match(/^\s*/)[0];
  lines.splice(index + 1, 0, `${indent}${module.dependency},`);
  fs.writeFileSync(copyPath, lines.join('\n'), 'utf8');
  console.log(`[${PLUGIN_ID}] Added ${module.name} to platforms/ios/packages/${PLUGIN_ID}/Package.swift`);
}
