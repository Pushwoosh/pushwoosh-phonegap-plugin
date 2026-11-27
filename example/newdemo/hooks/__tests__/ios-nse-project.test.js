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
const { ensureExtensionTarget, findTarget, targetBuildConfigurations, FRAMEWORK } = require('../ios-nse-project');

const APP_ID = 'org.example.sampleapp';
const OPTIONS = {
    name: 'NotificationService',
    bundleId: `${APP_ID}.NotificationService`,
    appGroup: `group.${APP_ID}`,
    deploymentTarget: '15.0',
    sourceFile: 'NotificationService.swift',
    sdkPackage: {
        url: 'https://github.com/Pushwoosh/Pushwoosh-XCFramework.git',
        version: '7.3.0',
        products: ['PushwooshFramework', 'PushwooshCore', 'PushwooshBridge']
    }
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
    // 2, not 1: the template's own "Embed Frameworks" phase plus the extension's embed phase.
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

function packageReferences(project) {
    return objects(project, 'XCRemoteSwiftPackageReference');
}

function linkedProducts(project, targetUuid) {
    const target = project.hash.project.objects.PBXNativeTarget[targetUuid];
    const dependencies = project.hash.project.objects.XCSwiftPackageProductDependency;
    return (target.packageProductDependencies || []).map(({ value }) => dependencies[value]);
}

test('the extension links the Pushwoosh products from one exact-pinned package reference', (t) => {
    const { project } = loadProject(t, templatePbxproj({ id: APP_ID }));
    ensureExtensionTarget(project, OPTIONS);
    const reloaded = reload(t, project);

    const references = packageReferences(reloaded);
    assert.strictEqual(references.length, 1);
    const [reference] = references;
    assert.strictEqual(reference.object.repositoryURL, `"${OPTIONS.sdkPackage.url}"`);
    assert.deepStrictEqual({ ...reference.object.requirement }, { kind: 'exactVersion', version: '7.3.0' });
    const root = reloaded.getFirstProject().firstProject;
    assert.ok(root.packageReferences.some(({ value }) => value === reference.uuid), 'the project lists the reference');

    const extension = findTarget(reloaded, 'NotificationService');
    const products = linkedProducts(reloaded, extension.uuid);
    assert.deepStrictEqual(products.map((product) => product.productName), OPTIONS.sdkPackage.products);
    assert.ok(products.every((product) => product.package === reference.uuid));

    const [frameworks] = phasesOf(reloaded, extension.uuid, 'PBXFrameworksBuildPhase');
    const buildFiles = reloaded.hash.project.objects.PBXBuildFile;
    const productRefs = frameworks.files.map(({ value }) => buildFiles[value].productRef).filter(Boolean);
    assert.strictEqual(productRefs.length, OPTIONS.sdkPackage.products.length);
});

test('the app target keeps only the packages cordova-ios gave it', (t) => {
    const { project } = loadProject(t, templatePbxproj({ id: APP_ID }));
    const appUuid = project.getFirstTarget().uuid;
    const before = linkedProducts(project, appUuid).map((product) => product.productName);

    ensureExtensionTarget(project, OPTIONS);

    assert.deepStrictEqual(linkedProducts(project, appUuid).map((product) => product.productName), before);
});

test('a drifted pin is rewritten in place, without a second reference or product', (t) => {
    const { project } = loadProject(t, templatePbxproj({ id: APP_ID }));
    ensureExtensionTarget(project, OPTIONS);
    const reloaded = reload(t, project);

    const result = ensureExtensionTarget(reloaded, { ...OPTIONS, sdkPackage: { ...OPTIONS.sdkPackage, version: '7.4.0' } });

    assert.strictEqual(result.changed, true);
    assert.strictEqual(result.added, false);
    const references = packageReferences(reloaded);
    assert.strictEqual(references.length, 1);
    assert.strictEqual(references[0].object.requirement.version, '7.4.0');
    const extension = findTarget(reloaded, 'NotificationService');
    assert.strictEqual(linkedProducts(reloaded, extension.uuid).length, OPTIONS.sdkPackage.products.length);
});

test('an existing target without the products gets them on the next run', (t) => {
    const { project } = loadProject(t, templatePbxproj({ id: APP_ID }));
    ensureExtensionTarget(project, { ...OPTIONS, sdkPackage: { ...OPTIONS.sdkPackage, products: [] } });
    const reloaded = reload(t, project);

    const result = ensureExtensionTarget(reloaded, OPTIONS);

    assert.strictEqual(result.changed, true);
    assert.strictEqual(result.added, false);
    const extension = findTarget(reloaded, 'NotificationService');
    assert.deepStrictEqual(linkedProducts(reloaded, extension.uuid).map((product) => product.productName), OPTIONS.sdkPackage.products);
    assert.strictEqual(targetsNamed(reloaded, 'NotificationService').length, 1);
});
