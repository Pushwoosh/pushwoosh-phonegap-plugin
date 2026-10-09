'use strict';

const fs = require('fs');
const path = require('path');

const xcode = require('xcode');

const { reorderInfoPlistConfigurations, setAppGroup } = require('./ios-nse-project');

const TARGET_NAME = 'NotificationService';

// platforms/ios on an iOS run that already has it, otherwise null: nothing to wire, nothing wrong.
function iosPlatformDir(context) {
    const platforms = context.opts.platforms || [];
    if (platforms.indexOf('ios') === -1) {
        return null;
    }
    const iosDir = path.join(context.opts.projectRoot, 'platforms', 'ios');
    return fs.existsSync(iosDir) ? iosDir : null;
}

function xcodeprojName(iosDir) {
    const found = fs.readdirSync(iosDir).find((entry) => entry.endsWith('.xcodeproj'));
    return found ? path.basename(found, '.xcodeproj') : null;
}

// Undoes what `pod install` does to the pbxproj (reshuffled XCBuildConfiguration, dropped PW_APP_GROUP), writing only on change.
// appGroup only after a pod install: before_prepare runs before the app id is resolved and repairs the order alone.
function repairProject(iosDir, projectName, { targetName, appGroup = null }) {
    const pbxprojPath = path.join(iosDir, `${projectName}.xcodeproj`, 'project.pbxproj');
    const project = xcode.project(pbxprojPath);
    project.parseSync();

    const reordered = reorderInfoPlistConfigurations(project, targetName);
    const appGroupRestored = appGroup !== null && setAppGroup(project, appGroup);

    if (reordered || appGroupRestored) {
        fs.writeFileSync(pbxprojPath, project.writeSync(), 'utf8');
    }
    return { reordered, appGroupRestored };
}

function restoreInfoPlistOrder(iosDir, projectName, targetName) {
    return repairProject(iosDir, projectName, { targetName }).reordered;
}

module.exports = { TARGET_NAME, iosPlatformDir, xcodeprojName, repairProject, restoreInfoPlistOrder };
