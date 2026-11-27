'use strict';

const path = require('path');

const COMMENT_KEY = /_comment$/;
const SWIFT_VERSION = '5.0';
const FRAMEWORK = 'UserNotifications.framework';
const APP_GROUP_SETTING = 'PW_APP_GROUP';
const PACKAGE_REFERENCE = 'XCRemoteSwiftPackageReference';
const PRODUCT_DEPENDENCY = 'XCSwiftPackageProductDependency';

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

// Every configuration carries it, the app's own included: the extension and the host app must agree on the group they share.
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

function packageName(url) {
    return path.basename(url, '.git');
}

function section(project, name) {
    const objects = project.hash.project.objects;
    objects[name] = objects[name] || {};
    return objects[name];
}

function addObject(project, sectionName, object, comment) {
    const uuid = project.generateUuid();
    const target = section(project, sectionName);
    target[uuid] = object;
    target[`${uuid}_comment`] = comment;
    return uuid;
}

// One reference per URL: the plugin's own Package.swift asks for the same package, and Xcode resolves both to one copy
// only while the requirement matches, so a drifted pin is rewritten rather than left to fail the package resolution.
function ensurePackageReference(project, { url, version }) {
    const requirement = { kind: 'exactVersion', version };
    const existing = entries(section(project, PACKAGE_REFERENCE)).find(({ object }) => unquote(object.repositoryURL) === url);

    if (existing) {
        const current = existing.object.requirement || {};
        if (current.kind === requirement.kind && unquote(current.version) === version) {
            return { uuid: existing.uuid, changed: false };
        }
        existing.object.requirement = requirement;
        return { uuid: existing.uuid, changed: true };
    }

    const comment = `${PACKAGE_REFERENCE} "${packageName(url)}"`;
    const uuid = addObject(project, PACKAGE_REFERENCE, { isa: PACKAGE_REFERENCE, repositoryURL: quote(url), requirement }, comment);
    const root = project.getFirstProject().firstProject;
    root.packageReferences = [...(root.packageReferences || []), { value: uuid, comment }];
    return { uuid, changed: true };
}

function linksProduct(project, target, referenceUuid, product) {
    const dependencies = section(project, PRODUCT_DEPENDENCY);
    return (target.packageProductDependencies || []).some(({ value }) => {
        const dependency = dependencies[value];
        return Boolean(dependency) && dependency.package === referenceUuid && unquote(dependency.productName) === product;
    });
}

function linkProduct(project, targetUuid, referenceUuid, product) {
    const target = project.pbxNativeTargetSection()[targetUuid];
    const dependencyUuid = addObject(project, PRODUCT_DEPENDENCY, {
        isa: PRODUCT_DEPENDENCY,
        package: referenceUuid,
        package_comment: section(project, PACKAGE_REFERENCE)[`${referenceUuid}_comment`],
        productName: product
    }, product);
    target.packageProductDependencies = [...(target.packageProductDependencies || []), { value: dependencyUuid, comment: product }];

    const fileComment = `${product} in Frameworks`;
    const fileUuid = addObject(project, 'PBXBuildFile', {
        isa: 'PBXBuildFile',
        productRef: dependencyUuid,
        productRef_comment: product
    }, fileComment);
    project.pbxFrameworksBuildPhaseObj(targetUuid).files.push({ value: fileUuid, comment: fileComment });
}

// cordova-ios 8 links plugins through Swift packages, and CocoaPods cannot host an extension next to an app target
// that has no pods: the extension takes the Pushwoosh frameworks from the same package the plugin resolves.
function ensurePackageProducts(project, targetUuid, { url, version, products }) {
    const reference = ensurePackageReference(project, { url, version });
    const target = project.pbxNativeTargetSection()[targetUuid];
    let changed = reference.changed;

    for (const product of products) {
        if (!linksProduct(project, target, reference.uuid, product)) {
            linkProduct(project, targetUuid, reference.uuid, product);
            changed = true;
        }
    }
    return changed;
}

function addExtensionTarget(project, options) {
    const { name, bundleId, sourceFile } = options;
    // The cordova-ios 8 template has no target dependencies, and without these sections addTarget silently skips the app's one.
    section(project, 'PBXTargetDependency');
    section(project, 'PBXContainerItemProxy');
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
    if (ensurePackageProducts(project, target.uuid, options.sdkPackage)) {
        changed = true;
    }
    if (setAppGroup(project, options.appGroup)) {
        changed = true;
    }
    return { changed, added };
}

module.exports = { ensureExtensionTarget, setAppGroup, findTarget, targetBuildConfigurations, FRAMEWORK, APP_GROUP_SETTING };
