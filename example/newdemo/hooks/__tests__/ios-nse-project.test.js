const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { templatePbxproj, demoModulesMissing } = require('./pbxproj-fixture');

if (demoModulesMissing) {
    test('ios-nse-project helpers', { skip: demoModulesMissing }, () => {});
    return;
}

const xcode = require('xcode');
const projectFile = require('cordova-ios/lib/projectFile');

const { ensureExtensionTarget, reorderInfoPlistConfigurations, findTarget, targetBuildConfigurations, FRAMEWORK } = require('../ios-nse-project');

const APP_ID = 'org.example.sampleapp';
const OPTIONS = {
    name: 'NotificationService',
    bundleId: `${APP_ID}.NotificationService`,
    appGroup: `group.${APP_ID}`,
    deploymentTarget: '15.0',
    sourceFile: 'NotificationService.swift'
};
const COMMENT_KEY = /_comment$/;

function objects(project, section) {
    const all = project.hash.project.objects[section] || {};
    return Object.keys(all).filter((key) => !COMMENT_KEY.test(key)).map((key) => ({ uuid: key, object: all[key] }));
}

function loadProject(t, text) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ios-nse-project-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const file = path.join(dir, 'project.pbxproj');
    fs.writeFileSync(file, text);
    const project = xcode.project(file);
    project.parseSync();
    return { project, file };
}

function reload(t, project) {
    return loadProject(t, project.writeSync()).project;
}

function targetsNamed(project, name) {
    return objects(project, 'PBXNativeTarget').filter(({ object }) => object.name.replace(/"/g, '') === name);
}

function phasesOf(project, targetUuid, section) {
    const target = project.hash.project.objects.PBXNativeTarget[targetUuid];
    const uuids = target.buildPhases.map((phase) => phase.value);
    return objects(project, section).filter(({ uuid }) => uuids.includes(uuid)).map(({ object }) => object);
}

// The unlucky draw: every UUID the xcode module hands out sorts before the template's app configurations (1D605894...).
function lowUuids(project) {
    let next = 0;
    project.generateUuid = () => (++next).toString(16).toUpperCase().padStart(24, '0');
}

// What `pod install` and an Xcode save do to the file: XCBuildConfiguration written sorted by UUID.
function sortConfigurationsByUuid(project) {
    const section = project.hash.project.objects.XCBuildConfiguration;
    const sorted = {};
    for (const key of Object.keys(section).filter((key) => !COMMENT_KEY.test(key)).sort()) {
        sorted[key] = section[key];
        sorted[`${key}_comment`] = section[`${key}_comment`];
    }
    project.hash.project.objects.XCBuildConfiguration = sorted;
}

// Lays the project out as platforms/ios and lets cordova-ios itself pick the app's Info.plist, as every prepare does.
function parseWithCordovaIos(t, project) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ios-nse-platform-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const pbxproj = path.join(root, 'newdemo.xcodeproj', 'project.pbxproj');
    for (const file of [pbxproj, path.join(root, 'newdemo', 'newdemo-Info.plist'), path.join(root, 'newdemo', 'config.xml'), path.join(root, 'NotificationService', 'Info.plist')]) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, '');
    }
    fs.writeFileSync(pbxproj, project.writeSync());
    return projectFile.parse({ root, pbxproj });
}

test('adds an app extension target embedded into the app target', (t) => {
    const { project } = loadProject(t, templatePbxproj({ id: APP_ID }));

    const result = ensureExtensionTarget(project, OPTIONS);

    assert.strictEqual(result.changed, true);
    assert.strictEqual(result.added, true);
    const extension = findTarget(project, 'NotificationService');
    assert.ok(extension, 'extension target exists');
    assert.strictEqual(extension.object.productType.replace(/"/g, ''), 'com.apple.product-type.app-extension');

    const app = project.getFirstTarget();
    assert.ok(app.firstTarget.dependencies.length >= 1, 'app depends on the extension');
    // Only the dstSubfolderSpec 13 (PlugIns) phase is the extension's embed phase; the template ships another one.
    const copyPhases = phasesOf(project, app.uuid, 'PBXCopyFilesBuildPhase');
    const embedPhases = copyPhases.filter((phase) => String(phase.dstSubfolderSpec) === '13');
    assert.strictEqual(embedPhases.length, 1);
    assert.ok(embedPhases[0].files.some((file) => String(file.comment).startsWith('NotificationService.appex')));

    const sources = phasesOf(project, extension.uuid, 'PBXSourcesBuildPhase');
    assert.strictEqual(sources.length, 1);
    assert.ok(sources[0].files.some((file) => String(file.comment).startsWith('NotificationService.swift')));

    const frameworks = phasesOf(project, extension.uuid, 'PBXFrameworksBuildPhase');
    assert.strictEqual(frameworks.length, 1);
    assert.ok(frameworks[0].files.some((file) => String(file.comment).startsWith(FRAMEWORK)));
});

test('the extension configurations carry the build settings the build needs', (t) => {
    const { project } = loadProject(t, templatePbxproj({ id: APP_ID }));
    ensureExtensionTarget(project, OPTIONS);

    const extension = findTarget(project, 'NotificationService');
    const configurations = targetBuildConfigurations(project, extension.uuid);
    assert.strictEqual(configurations.length, 2);
    for (const configuration of configurations) {
        const settings = configuration.buildSettings;
        assert.strictEqual(settings.PRODUCT_BUNDLE_IDENTIFIER, `"${APP_ID}.NotificationService"`);
        assert.strictEqual(settings.INFOPLIST_FILE, '"NotificationService/Info.plist"');
        assert.strictEqual(settings.CODE_SIGN_ENTITLEMENTS, '"NotificationService/NotificationService.entitlements"');
        assert.strictEqual(settings.SWIFT_VERSION, '5.0');
        assert.strictEqual(settings.IPHONEOS_DEPLOYMENT_TARGET, '15.0');
        assert.strictEqual(settings.TARGETED_DEVICE_FAMILY, '"1,2"');
        assert.strictEqual(settings.PW_APP_GROUP, `"group.${APP_ID}"`);
    }
});

test("the extension does not inherit the app's bridging header, which imports Cordova.h the extension cannot see", (t) => {
    const { project } = loadProject(t, templatePbxproj({ id: APP_ID }));
    ensureExtensionTarget(project, OPTIONS);

    const extension = findTarget(project, 'NotificationService');
    for (const configuration of targetBuildConfigurations(project, extension.uuid)) {
        assert.strictEqual(configuration.buildSettings.SWIFT_OBJC_BRIDGING_HEADER, '""');
    }
});

test('an extension target created without the bridging header override gets it on the next run', (t) => {
    const { project } = loadProject(t, templatePbxproj({ id: APP_ID }));
    ensureExtensionTarget(project, OPTIONS);
    const reloaded = reload(t, project);
    const extension = findTarget(reloaded, 'NotificationService');
    for (const configuration of targetBuildConfigurations(reloaded, extension.uuid)) {
        delete configuration.buildSettings.SWIFT_OBJC_BRIDGING_HEADER;
    }

    const result = ensureExtensionTarget(reloaded, OPTIONS);

    assert.strictEqual(result.changed, true);
    for (const configuration of targetBuildConfigurations(reloaded, extension.uuid)) {
        assert.strictEqual(configuration.buildSettings.SWIFT_OBJC_BRIDGING_HEADER, '""');
    }
});

test('cordova-ios still finds the app Info.plist after pod install sorts the configurations, whatever UUIDs the xcode module drew', (t) => {
    const { project } = loadProject(t, templatePbxproj({ id: APP_ID }));
    lowUuids(project);
    ensureExtensionTarget(project, OPTIONS);
    const reloaded = reload(t, project);

    sortConfigurationsByUuid(reloaded);

    assert.strictEqual(path.basename(parseWithCordovaIos(t, reloaded).xcode_path), 'newdemo');
});

test('an extension target left with low configuration UUIDs by an earlier run is fixed on the next run', (t) => {
    const { project } = loadProject(t, templatePbxproj({ id: APP_ID }));
    ensureExtensionTarget(project, OPTIONS);
    const reloaded = reload(t, project);
    const extension = findTarget(reloaded, 'NotificationService');
    const list = reloaded.pbxXCConfigurationList()[extension.object.buildConfigurationList];
    const section = reloaded.pbxXCBuildConfigurationSection();
    list.buildConfigurations.forEach((item, index) => {
        const low = `00000000000000000000000${index + 1}`;
        section[low] = section[item.value];
        section[`${low}_comment`] = section[`${item.value}_comment`];
        delete section[item.value];
        delete section[`${item.value}_comment`];
        item.value = low;
    });

    const result = ensureExtensionTarget(reloaded, OPTIONS);
    const again = reload(t, reloaded);
    sortConfigurationsByUuid(again);

    assert.strictEqual(result.changed, true);
    assert.strictEqual(path.basename(parseWithCordovaIos(t, again).xcode_path), 'newdemo');
    assert.strictEqual(targetsNamed(again, 'NotificationService').length, 1);
});

test('PW_APP_GROUP lands in every build configuration, the app ones included', (t) => {
    const { project } = loadProject(t, templatePbxproj({ id: APP_ID }));
    ensureExtensionTarget(project, OPTIONS);

    const configurations = objects(project, 'XCBuildConfiguration');
    assert.ok(configurations.length >= 6, 'project, app and extension configurations');
    for (const { object } of configurations) {
        assert.strictEqual(object.buildSettings.PW_APP_GROUP, `"group.${APP_ID}"`);
    }
});

test('the extension sources live in a NotificationService group under the main group', (t) => {
    const { project } = loadProject(t, templatePbxproj({ id: APP_ID }));
    ensureExtensionTarget(project, OPTIONS);

    const group = objects(project, 'PBXGroup').find(({ object }) => object.name === 'NotificationService');
    assert.ok(group, 'group exists');
    assert.strictEqual(group.object.path, 'NotificationService');
    const mainGroupKey = project.getFirstProject().firstProject.mainGroup;
    const mainGroup = project.hash.project.objects.PBXGroup[mainGroupKey];
    assert.ok(mainGroup.children.some((child) => child.value === group.uuid));
});

test('a second pass over the written project changes nothing', (t) => {
    const { project } = loadProject(t, templatePbxproj({ id: APP_ID }));
    ensureExtensionTarget(project, OPTIONS);
    const reloaded = reload(t, project);

    const result = ensureExtensionTarget(reloaded, OPTIONS);

    assert.strictEqual(result.changed, false);
    assert.strictEqual(result.added, false);
    assert.strictEqual(targetsNamed(reloaded, 'NotificationService').length, 1);
    // 2, not 1: the template's own "Copy Staging Resources" phase plus the extension's embed phase.
    assert.strictEqual(objects(reloaded, 'PBXCopyFilesBuildPhase').length, 2);
    assert.strictEqual(reloaded.writeSync(), project.writeSync());
});

test('a drifted PW_APP_GROUP is restored without a second target', (t) => {
    const { project } = loadProject(t, templatePbxproj({ id: APP_ID }));
    ensureExtensionTarget(project, OPTIONS);
    const reloaded = reload(t, project);
    const [first] = objects(reloaded, 'XCBuildConfiguration');
    first.object.buildSettings.PW_APP_GROUP = '"group.somebody.else"';

    const result = ensureExtensionTarget(reloaded, OPTIONS);

    assert.strictEqual(result.changed, true);
    assert.strictEqual(result.added, false, 'the target already existed; only settings were refreshed');
    assert.strictEqual(first.object.buildSettings.PW_APP_GROUP, `"group.${APP_ID}"`);
    assert.strictEqual(targetsNamed(reloaded, 'NotificationService').length, 1);
});

test('a drifted PRODUCT_BUNDLE_IDENTIFIER on an existing target is restored, without creating a second target', (t) => {
    const { project } = loadProject(t, templatePbxproj({ id: APP_ID }));
    ensureExtensionTarget(project, OPTIONS);
    const reloaded = reload(t, project);
    const extension = findTarget(reloaded, 'NotificationService');
    for (const configuration of targetBuildConfigurations(reloaded, extension.uuid)) {
        configuration.buildSettings.PRODUCT_BUNDLE_IDENTIFIER = '"somebody.else.NotificationService"';
    }

    const result = ensureExtensionTarget(reloaded, OPTIONS);

    assert.strictEqual(result.changed, true);
    assert.strictEqual(result.added, false, 'the target already existed; only settings were refreshed');
    for (const configuration of targetBuildConfigurations(reloaded, extension.uuid)) {
        assert.strictEqual(configuration.buildSettings.PRODUCT_BUNDLE_IDENTIFIER, `"${APP_ID}.NotificationService"`);
    }
    assert.strictEqual(targetsNamed(reloaded, 'NotificationService').length, 1);
});

test('the deployment target comes from the options, not a literal', (t) => {
    const { project } = loadProject(t, templatePbxproj({ id: APP_ID }));
    ensureExtensionTarget(project, { ...OPTIONS, deploymentTarget: '16.0' });

    const extension = findTarget(project, 'NotificationService');
    for (const configuration of targetBuildConfigurations(project, extension.uuid)) {
        assert.strictEqual(configuration.buildSettings.IPHONEOS_DEPLOYMENT_TARGET, '16.0');
    }
});

test('reorderInfoPlistConfigurations moves the extension entries after the app, when pod install put them first', (t) => {
    const { project } = loadProject(t, templatePbxproj({ id: APP_ID }));
    ensureExtensionTarget(project, OPTIONS);
    const reloaded = reload(t, project);
    const section = reloaded.hash.project.objects.XCBuildConfiguration;
    const keys = Object.keys(section).filter((key) => !COMMENT_KEY.test(key));
    const [extensionKey, ...appKeys] = keys.sort((a, b) => {
        const infoplistA = section[a].buildSettings.INFOPLIST_FILE || '';
        return infoplistA.includes('NotificationService/') ? -1 : 1;
    });
    // Simulate what `pod install` did in practice: re-serialize with the extension's configuration first.
    const shuffled = {};
    for (const key of [extensionKey, ...appKeys]) {
        shuffled[key] = section[key];
        if (section[`${key}_comment`] !== undefined) shuffled[`${key}_comment`] = section[`${key}_comment`];
    }
    reloaded.hash.project.objects.XCBuildConfiguration = shuffled;

    const changed = reorderInfoPlistConfigurations(reloaded, 'NotificationService');

    assert.strictEqual(changed, true);
    const fixed = Object.keys(reloaded.hash.project.objects.XCBuildConfiguration).filter((key) => !COMMENT_KEY.test(key));
    const firstWithInfoplist = fixed.find((key) => reloaded.hash.project.objects.XCBuildConfiguration[key].buildSettings.INFOPLIST_FILE);
    assert.ok(!reloaded.hash.project.objects.XCBuildConfiguration[firstWithInfoplist].buildSettings.INFOPLIST_FILE.includes('NotificationService/'));
});

test('reorderInfoPlistConfigurations is a no-op when the app is already first', (t) => {
    const { project } = loadProject(t, templatePbxproj({ id: APP_ID }));
    ensureExtensionTarget(project, OPTIONS);
    const before = project.writeSync();

    const changed = reorderInfoPlistConfigurations(project, 'NotificationService');

    assert.strictEqual(changed, false);
    assert.strictEqual(project.writeSync(), before);
});
