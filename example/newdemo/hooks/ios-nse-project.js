'use strict';

const crypto = require('crypto');

const COMMENT_KEY = /_comment$/;
const SWIFT_VERSION = '5.0';
const FRAMEWORK = 'UserNotifications.framework';
const APP_GROUP_SETTING = 'PW_APP_GROUP';

function unquote(value) {
    return typeof value === 'string' ? value.replace(/^"(.*)"$/, '$1') : value;
}

function quote(value) {
    return `"${value}"`;
}

function entries(section) {
    return Object.keys(section || {})
        .filter((key) => !COMMENT_KEY.test(key))
        .map((key) => ({ uuid: key, object: section[key] }));
}

function findTarget(project, name) {
    return entries(project.pbxNativeTargetSection())
        .find(({ object }) => unquote(object.name) === name) || null;
}

function targetBuildConfigurations(project, targetUuid) {
    const target = project.pbxNativeTargetSection()[targetUuid];
    const list = project.pbxXCConfigurationList()[target.buildConfigurationList];
    const configurations = project.pbxXCBuildConfigurationSection();
    return list.buildConfigurations.map((item) => configurations[item.value]);
}

function setEverywhere(project, prop, value) {
    let changed = false;
    for (const { object } of entries(project.pbxXCBuildConfigurationSection())) {
        if (object.buildSettings[prop] !== value) {
            object.buildSettings[prop] = value;
            changed = true;
        }
    }
    return changed;
}

// Every configuration carries it, the app's own included: the extension and the host app must agree on
// the group they share, and `pod install` wipes it out of configurations it regenerates.
function setAppGroup(project, appGroup) {
    return setEverywhere(project, APP_GROUP_SETTING, quote(appGroup));
}

// Identity settings owned by the extension target, kept apart from PW_APP_GROUP (which setAppGroup
// also writes into the app's own configurations).
function extensionBuildSettings({ name, bundleId, deploymentTarget }) {
    return {
        PRODUCT_BUNDLE_IDENTIFIER: quote(bundleId),
        INFOPLIST_FILE: quote(`${name}/Info.plist`),
        CODE_SIGN_ENTITLEMENTS: quote(`${name}/${name}.entitlements`),
        SWIFT_VERSION,
        // cordova/build.xcconfig hands every target the app's Bridging-Header.h, which imports Cordova.h the extension never builds.
        SWIFT_OBJC_BRIDGING_HEADER: quote(''),
        IPHONEOS_DEPLOYMENT_TARGET: deploymentTarget,
        TARGETED_DEVICE_FAMILY: quote('1,2')
    };
}

function applySettings(configurations, settings) {
    let changed = false;
    for (const configuration of configurations) {
        for (const key of Object.keys(settings)) {
            if (configuration.buildSettings[key] !== settings[key]) {
                configuration.buildSettings[key] = settings[key];
                changed = true;
            }
        }
    }
    return changed;
}

// pod install and Xcode write XCBuildConfiguration sorted by UUID, and cordova-ios takes the app's Info.plist from the first entry
// that has one: fixed F-prefixed UUIDs keep the extension behind the template's app configurations (1D605894...), whatever xcode drew.
function configurationUuid(targetName, configurationName) {
    const digest = crypto.createHash('sha1').update(`${targetName}/${configurationName}`).digest('hex');
    return `F${digest.slice(0, 23).toUpperCase()}`;
}

function pinConfigurationUuids(project, targetUuid, targetName) {
    const target = project.pbxNativeTargetSection()[targetUuid];
    const list = project.pbxXCConfigurationList()[target.buildConfigurationList];
    const section = project.pbxXCBuildConfigurationSection();
    let changed = false;
    for (const item of list.buildConfigurations) {
        const uuid = configurationUuid(targetName, unquote(section[item.value].name));
        if (item.value === uuid) {
            continue;
        }
        section[uuid] = section[item.value];
        section[`${uuid}_comment`] = section[`${item.value}_comment`];
        delete section[item.value];
        delete section[`${item.value}_comment`];
        item.value = uuid;
        changed = true;
    }
    return changed;
}

function addExtensionTarget(project, options) {
    const { name, bundleId, sourceFile } = options;
    const target = project.addTarget(name, 'app_extension', name, bundleId);

    // Must run before addPbxGroup, or the source's build file comment comes out quote-corrupted.
    project.addBuildPhase([sourceFile], 'PBXSourcesBuildPhase', 'Sources', target.uuid);
    const group = project.addPbxGroup([sourceFile], name, name);
    project.addToPbxGroup(group.uuid, project.getFirstProject().firstProject.mainGroup);

    project.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', target.uuid);
    project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);
    project.addFramework(FRAMEWORK, { target: target.uuid });

    // Written straight into the configurations: updateBuildProperty(..., targetName) misses the still-quoted name here.
    applySettings(targetBuildConfigurations(project, target.uuid), extensionBuildSettings(options));
    return target;
}

function ensureExtensionTarget(project, options) {
    let changed = false;
    let added = false;
    let target = findTarget(project, options.name);

    if (!target) {
        target = addExtensionTarget(project, options);
        changed = true;
        added = true;
    } else if (applySettings(targetBuildConfigurations(project, target.uuid), extensionBuildSettings(options))) {
        // Convergence, not one-shot creation: a config.xml edit (bundle id, app id) must reach an already-created target.
        changed = true;
    }
    // Existing targets too: one created before the pin still carries whatever UUIDs xcode drew.
    if (pinConfigurationUuids(project, target.uuid, options.name)) {
        changed = true;
    }
    if (setAppGroup(project, options.appGroup)) {
        changed = true;
    }
    return { changed, added };
}

// cordova-ios resolves the app's own Info.plist as the first XCBuildConfiguration carrying one;
// `pod install` re-serializes the file and can put the extension's configuration first, breaking every prepare after.
function reorderInfoPlistConfigurations(project, targetName) {
    const section = project.pbxXCBuildConfigurationSection();
    const keys = Object.keys(section).filter((key) => !COMMENT_KEY.test(key));
    const prefix = `${targetName}/`;
    const ownsInfoplist = (key) => unquote((section[key].buildSettings || {}).INFOPLIST_FILE || '').startsWith(prefix);
    const firstWithInfoplist = keys.find((key) => (section[key].buildSettings || {}).INFOPLIST_FILE);

    if (!firstWithInfoplist || !ownsInfoplist(firstWithInfoplist)) {
        return false;
    }

    const ordered = {};
    for (const key of [...keys.filter((key) => !ownsInfoplist(key)), ...keys.filter(ownsInfoplist)]) {
        ordered[key] = section[key];
        if (section[`${key}_comment`] !== undefined) {
            ordered[`${key}_comment`] = section[`${key}_comment`];
        }
    }
    project.hash.project.objects.XCBuildConfiguration = ordered;
    return true;
}

module.exports = { ensureExtensionTarget, reorderInfoPlistConfigurations, setAppGroup, findTarget, targetBuildConfigurations, FRAMEWORK, APP_GROUP_SETTING };
