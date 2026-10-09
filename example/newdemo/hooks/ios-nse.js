#!/usr/bin/env node

'use strict';

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const xcode = require('xcode');

const { ensureExtensionTarget, APP_GROUP_SETTING } = require('./ios-nse-project');
const { addExtensionTarget, podVersionFromPluginXml } = require('./ios-nse-podfile');
const { TARGET_NAME, iosPlatformDir, xcodeprojName, repairProject } = require('./ios-nse-reorder');

const SOURCE_FILE = 'NotificationService.swift';
// Not literally 'ios': a top-level dir named after a platform makes `cordova platform add ios` treat it as a local path spec.
const SOURCE_DIR = path.join('ios-nse', TARGET_NAME);
const PLUGIN_XML = path.join('plugins', 'pushwoosh-cordova-plugin', 'plugin.xml');
const PODS_SUPPORT_DIR = path.join('Pods', 'Target Support Files');

function readConfig(context, projectRoot) {
    const { ConfigParser } = context.requireCordovaModule('cordova-common');
    const config = new ConfigParser(path.join(projectRoot, 'config.xml'));
    const appId = config.ios_CFBundleIdentifier() || config.packageName();
    const deploymentTarget = config.getPreference('deployment-target', 'ios');

    if (!appId) {
        throw new Error('[NSE] config.xml has neither ios-CFBundleIdentifier nor a widget id; the extension target needs an app id');
    }
    if (!deploymentTarget) {
        throw new Error('[NSE] config.xml has no ios deployment-target preference; the extension target needs one');
    }
    return { appId, deploymentTarget };
}

function readPodVersion(projectRoot) {
    const file = path.join(projectRoot, PLUGIN_XML);
    const version = podVersionFromPluginXml(fs.readFileSync(file, 'utf8'));

    if (!version) {
        throw new Error(`[NSE] No PushwooshXCFramework pin in ${PLUGIN_XML}`);
    }
    return version;
}

function copySources(projectRoot, iosDir) {
    fs.cpSync(path.join(projectRoot, SOURCE_DIR), path.join(iosDir, TARGET_NAME), { recursive: true });
    console.log(`[NSE] Copied ${SOURCE_DIR} -> platforms/ios/${TARGET_NAME}`);
}

function updateProject(iosDir, projectName, options) {
    const pbxprojPath = path.join(iosDir, `${projectName}.xcodeproj`, 'project.pbxproj');
    const project = xcode.project(pbxprojPath);
    project.parseSync();

    const { changed, added } = ensureExtensionTarget(project, options);

    if (!changed) {
        console.log(`[NSE] Target ${options.name} already in ${projectName}.xcodeproj, nothing to do`);
        return;
    }

    fs.writeFileSync(pbxprojPath, project.writeSync(), 'utf8');
    if (added) {
        console.log(`[NSE] Added target ${options.name} to ${projectName}.xcodeproj`);
    } else {
        console.log(`[NSE] Target ${options.name} already in ${projectName}.xcodeproj, refreshed build settings`);
    }
}

function podInstall(iosDir) {
    try {
        childProcess.execFileSync('pod', ['install'], { cwd: iosDir, stdio: 'inherit' });
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error('[NSE] `pod` not found: install CocoaPods (https://cocoapods.org) and build again');
        }
        throw error;
    }
}

// The installed state has to be read off the Pods, not off the Podfile: writing the block and
// integrating it are two operations, and a pod install that died in between leaves the first done.
function podsIntegrated(iosDir) {
    return fs.existsSync(path.join(iosDir, PODS_SUPPORT_DIR, `Pods-${TARGET_NAME}`));
}

function updatePodfile(iosDir, projectName, version) {
    const podfilePath = path.join(iosDir, 'Podfile');

    if (!fs.existsSync(podfilePath)) {
        // The plugin presence check above already ran: a missing Podfile here means cordova-ios hasn't generated one for this platform yet.
        throw new Error('[NSE] platforms/ios/Podfile not found: cordova-ios has not generated one for this platform yet');
    }

    const result = addExtensionTarget(fs.readFileSync(podfilePath, 'utf8'), {
        target: TARGET_NAME,
        project: projectName,
        version
    });

    if (result.changed) {
        fs.writeFileSync(podfilePath, result.text, 'utf8');
        console.log(`[NSE] Added target ${TARGET_NAME} to Podfile, running pod install`);
    } else if (podsIntegrated(iosDir)) {
        console.log(`[NSE] Podfile and Pods already have target ${TARGET_NAME}`);
        return;
    } else {
        console.log(`[NSE] Podfile has target ${TARGET_NAME} but ${PODS_SUPPORT_DIR}/Pods-${TARGET_NAME} is missing, running pod install`);
    }

    podInstall(iosDir);
}

module.exports = function (context) {
    const iosDir = iosPlatformDir(context);
    if (!iosDir) {
        return;
    }

    const projectRoot = context.opts.projectRoot;

    if (!fs.existsSync(path.join(projectRoot, PLUGIN_XML))) {
        // Must not throw here: it would abort the benign `cordova platform add ios` race this handles.
        console.log(`[NSE] ${PLUGIN_XML} not found, skipping: the ${TARGET_NAME} target is added by the next \`cordova prepare ios\` or \`cordova build ios\` once the Pushwoosh plugin is installed`);
        return;
    }

    const { appId, deploymentTarget } = readConfig(context, projectRoot);
    const version = readPodVersion(projectRoot);
    const projectName = xcodeprojName(iosDir);
    if (!projectName) {
        throw new Error(`[NSE] No .xcodeproj in ${iosDir}`);
    }

    const appGroup = `group.${appId}`;

    copySources(projectRoot, iosDir);
    updateProject(iosDir, projectName, {
        name: TARGET_NAME,
        bundleId: `${appId}.${TARGET_NAME}`,
        appGroup,
        deploymentTarget,
        sourceFile: SOURCE_FILE
    });
    // The pbxproj goes first: pod install integrates the extension target it finds there.
    updatePodfile(iosDir, projectName, version);

    const repaired = repairProject(iosDir, projectName, { targetName: TARGET_NAME, appGroup });
    if (repaired.reordered) {
        console.log(`[NSE] pod install reordered ${projectName}.xcodeproj; restored the app's Info.plist as the first entry`);
    }
    if (repaired.appGroupRestored) {
        console.log(`[NSE] pod install dropped ${APP_GROUP_SETTING} from ${projectName}.xcodeproj; restored it`);
    }
};
