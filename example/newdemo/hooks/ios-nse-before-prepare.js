#!/usr/bin/env node

'use strict';

const { TARGET_NAME, iosPlatformDir, xcodeprojName, restoreInfoPlistOrder } = require('./ios-nse-reorder');

// Fixes the Info.plist order of a pbxproj shuffled between prepares (an Xcode save, a hand-run `pod install`) before
// cordova-ios parses it and throws "Could not find *-Info.plist file"; target and Podfile work stays in ios-nse.js.
module.exports = function (context) {
    const iosDir = iosPlatformDir(context);
    if (!iosDir) {
        return;
    }

    const projectName = xcodeprojName(iosDir);
    if (!projectName) {
        return;
    }

    if (restoreInfoPlistOrder(iosDir, projectName, TARGET_NAME)) {
        console.log(`[NSE] before_prepare reordered ${projectName}.xcodeproj; restored the app's Info.plist as the first entry`);
    }
};
