#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const PLUGIN_ID = 'pushwoosh-cordova-plugin';
const FIRST_FAILING_XCODE = 27;

// after_prepare (ios): on the CocoaPods path, warns that the PushwooshInboxUIXCFramework pod targets iOS 13.0,
// which Xcode 27 and later refuse to build, and prints the build flag that works around it.
module.exports = function (ctx) {
  const iosPlatformPath = path.join(ctx.opts.projectRoot, 'platforms', 'ios');
  if (!listsInboxUiPod(iosPlatformPath) || runsAsSwiftPackage(iosPlatformPath)) return;

  const xcode = xcodeMajorVersion();
  if (xcode !== null && xcode < FIRST_FAILING_XCODE) return;

  console.warn(`[${PLUGIN_ID}] The PushwooshInboxUIXCFramework pod targets iOS 13.0, and Xcode ${FIRST_FAILING_XCODE} and later fail to build it: "deployment target 'IPHONEOS_DEPLOYMENT_TARGET' is set to 13.0, but the range of supported deployment target versions is 15.0 to 27.0". Raise the deployment target for the build: cordova build ios --buildFlag="IPHONEOS_DEPLOYMENT_TARGET=15.0", or the same in build.json: "buildFlag": ["IPHONEOS_DEPLOYMENT_TARGET=15.0"] under ios.debug and ios.release. The flag applies to every target, the app included, so set it to 15.0 or to the app's deployment target if it is higher`);
};

function listsInboxUiPod(iosPlatformPath) {
  const podfilePath = path.join(iosPlatformPath, 'Podfile');
  if (!fs.existsSync(podfilePath)) return false;
  return fs.readFileSync(podfilePath, 'utf8').split('\n').some(line => /^\s*pod\s+'PushwooshInboxUIXCFramework'/.test(line));
}

// cordova-ios 8 lists a Swift package plugin in packages/cordova-ios-plugins/Package.swift
function runsAsSwiftPackage(iosPlatformPath) {
  const manifestPath = path.join(iosPlatformPath, 'packages', 'cordova-ios-plugins', 'Package.swift');
  return fs.existsSync(manifestPath) && fs.readFileSync(manifestPath, 'utf8').includes(PLUGIN_ID);
}

// null when Xcode is missing, only the command line tools are selected or the output is unexpected
function xcodeMajorVersion() {
  try {
    const output = childProcess.execFileSync('xcodebuild', ['-version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const match = output.match(/^Xcode (\d+)/m);
    return match ? Number(match[1]) : null;
  } catch (_) {
    return null;
  }
}
