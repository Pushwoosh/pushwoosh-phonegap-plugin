#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const xcode = require('xcode');

const { ensureExtensionTarget } = require('./ios-nse-project');

const TARGET_NAME = 'NotificationService';
const SOURCE_FILE = 'NotificationService.swift';
// Not literally 'ios': a top-level dir named after a platform makes `cordova platform add ios` treat it as a local path spec.
const SOURCE_DIR = path.join('ios-nse', TARGET_NAME);
const PLUGIN_MANIFEST = path.join('plugins', 'pushwoosh-cordova-plugin', 'Package.swift');
const SDK_PACKAGE_URL = 'https://github.com/Pushwoosh/Pushwoosh-XCFramework.git';
// The products the plugin itself links; the extension's code needs PushwooshFramework, the other two are what it loads.
const SDK_PRODUCTS = ['PushwooshFramework', 'PushwooshCore', 'PushwooshBridge'];

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

// The extension has to ask for exactly the version the plugin's manifest pins, or Swift Package Manager cannot resolve the two.
function sdkVersionFromManifest(text) {
    const escaped = SDK_PACKAGE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`\\.package\\(url:\\s*"${escaped}",\\s*exact:\\s*"([^"]+)"`).exec(text);
    return match ? match[1] : null;
}

function readSdkVersion(projectRoot) {
    const version = sdkVersionFromManifest(fs.readFileSync(path.join(projectRoot, PLUGIN_MANIFEST), 'utf8'));
    if (!version) {
        throw new Error(`[NSE] No exact Pushwoosh-XCFramework pin in ${PLUGIN_MANIFEST}`);
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

module.exports = function (context) {
    const iosDir = iosPlatformDir(context);
    if (!iosDir) {
        return;
    }

    const projectRoot = context.opts.projectRoot;

    if (!fs.existsSync(path.join(projectRoot, PLUGIN_MANIFEST))) {
        // Must not throw here: it would abort the benign `cordova platform add ios` race this handles.
        console.log(`[NSE] ${PLUGIN_MANIFEST} not found, skipping: the ${TARGET_NAME} target is added by the next \`cordova prepare ios\` or \`cordova build ios\` once the Pushwoosh plugin is installed`);
        return;
    }

    const { appId, deploymentTarget } = readConfig(context, projectRoot);
    const version = readSdkVersion(projectRoot);
    const projectName = xcodeprojName(iosDir);
    if (!projectName) {
        throw new Error(`[NSE] No .xcodeproj in ${iosDir}`);
    }

    copySources(projectRoot, iosDir);
    updateProject(iosDir, projectName, {
        name: TARGET_NAME,
        bundleId: `${appId}.${TARGET_NAME}`,
        appGroup: `group.${appId}`,
        deploymentTarget,
        sourceFile: SOURCE_FILE,
        sdkPackage: { url: SDK_PACKAGE_URL, version, products: SDK_PRODUCTS }
    });
};
