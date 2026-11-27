const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { templatePbxproj, pluginManifest, demoModulesMissing } = require('./pbxproj-fixture');

if (demoModulesMissing) {
    test('ios-nse hook', { skip: demoModulesMissing }, () => {});
    return;
}

const xcode = require('xcode');

const HOOK_PATH = require.resolve('../ios-nse');
const NEWDEMO = path.join(__dirname, '..', '..');
const APP_ID = 'org.example.sampleapp';
const PLUGIN_PACKAGE_SWIFT = path.join(NEWDEMO, '..', '..', 'Package.swift');

function configXml(widgetAttributes) {
    return [
        "<?xml version='1.0' encoding='utf-8'?>",
        `<widget ${widgetAttributes} version="1.0.0" xmlns="http://www.w3.org/ns/widgets">`,
        '    <name>newdemo</name>',
        '    <platform name="ios">',
        '        <preference name="deployment-target" value="15.0" />',
        '    </platform>',
        '</widget>',
        ''
    ].join('\n');
}

function loadHook() {
    delete require.cache[HOOK_PATH];
    return require('../ios-nse');
}

function makeProject(t, { widgetAttributes = `id="${APP_ID}"`, manifest = pluginManifest(), withPlatform = true, withPlugin = true } = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ios-nse-hook-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));

    fs.writeFileSync(path.join(root, 'config.xml'), configXml(widgetAttributes));
    if (withPlugin) {
        fs.mkdirSync(path.join(root, 'plugins', 'pushwoosh-cordova-plugin'), { recursive: true });
        fs.writeFileSync(path.join(root, 'plugins', 'pushwoosh-cordova-plugin', 'Package.swift'), manifest);
    }
    fs.cpSync(path.join(NEWDEMO, 'ios-nse'), path.join(root, 'ios-nse'), { recursive: true });

    const iosDir = path.join(root, 'platforms', 'ios');
    const pbxproj = path.join(iosDir, 'App.xcodeproj', 'project.pbxproj');
    if (withPlatform) {
        fs.mkdirSync(path.dirname(pbxproj), { recursive: true });
        fs.writeFileSync(pbxproj, templatePbxproj({ id: APP_ID }));
    }
    return { root, iosDir, pbxproj };
}

function context(root, platforms = ['ios']) {
    return {
        opts: { platforms, projectRoot: root },
        requireCordovaModule: (name) => require(name)
    };
}

function silenceConsole(t) {
    t.mock.method(console, 'log', () => {});
}

function captureConsole(t) {
    const lines = [];
    t.mock.method(console, 'log', (...args) => {
        lines.push(args.join(' '));
    });
    return lines;
}

function appGroupEverywhere(pbxprojPath) {
    const project = xcode.project(pbxprojPath);
    project.parseSync();
    const configurations = project.hash.project.objects.XCBuildConfiguration;
    return Object.keys(configurations)
        .filter((key) => !key.endsWith('_comment'))
        .every((key) => configurations[key].buildSettings.PW_APP_GROUP);
}

function count(text, needle) {
    return text.split(needle).length - 1;
}

function read(file) {
    return fs.readFileSync(file, 'utf8');
}


test('wires the extension and the Pushwoosh package into a fresh platform, without a Podfile', (t) => {
    const log = captureConsole(t);
    const { root, iosDir, pbxproj } = makeProject(t);

    loadHook()(context(root));

    assert.ok(log.some((line) => line === '[NSE] Added target NotificationService to App.xcodeproj'), log.join('\n'));

    const copied = path.join(iosDir, 'NotificationService');
    for (const name of ['NotificationService.swift', 'Info.plist', 'NotificationService.entitlements']) {
        assert.strictEqual(read(path.join(copied, name)), read(path.join(NEWDEMO, 'ios-nse', 'NotificationService', name)));
    }

    const project = read(pbxproj);
    assert.strictEqual(count(project, `PRODUCT_BUNDLE_IDENTIFIER = "${APP_ID}.NotificationService";`), 2);
    assert.ok(project.includes(`PW_APP_GROUP = "group.${APP_ID}";`));
    assert.ok(project.includes('NotificationService.appex'));
    assert.strictEqual(count(project, 'repositoryURL = "https://github.com/Pushwoosh/Pushwoosh-XCFramework.git";'), 1);
    assert.ok(project.includes('version = 7.3.0;'), 'the pin comes from the plugin manifest');
    assert.ok(project.includes('PushwooshFramework in Frameworks'));
    assert.strictEqual(fs.existsSync(path.join(iosDir, 'Podfile')), false);
});

test('a second run changes nothing', (t) => {
    silenceConsole(t);
    const { root, pbxproj } = makeProject(t);
    const hook = loadHook();
    hook(context(root));
    const projectAfterFirst = read(pbxproj);

    const log = captureConsole(t);
    hook(context(root));

    assert.strictEqual(read(pbxproj), projectAfterFirst);
    assert.ok(log.some((line) => line === '[NSE] Target NotificationService already in App.xcodeproj, nothing to do'), log.join('\n'));
    assert.ok(!log.some((line) => line.includes('Added target')), log.join('\n'));
});

test('settings a prepare rewrote are refreshed on the next run without re-adding the target', (t) => {
    silenceConsole(t);
    const { root, pbxproj } = makeProject(t);
    const hook = loadHook();
    hook(context(root));

    // cordova-ios 8 prepare writes TARGETED_DEVICE_FAMILY into every target, the extension's included (lib/prepare.js).
    const project = xcode.project(pbxproj);
    project.parseSync();
    const configurations = project.hash.project.objects.XCBuildConfiguration;
    for (const key of Object.keys(configurations).filter((k) => !k.endsWith('_comment'))) {
        configurations[key].buildSettings.TARGETED_DEVICE_FAMILY = '"1"';
        delete configurations[key].buildSettings.PW_APP_GROUP;
    }
    fs.writeFileSync(pbxproj, project.writeSync(), 'utf8');

    const log = captureConsole(t);
    hook(context(root));

    assert.ok(log.some((line) => line === '[NSE] Target NotificationService already in App.xcodeproj, refreshed build settings'), log.join('\n'));
    const text = read(pbxproj);
    assert.strictEqual(count(text, `PRODUCT_BUNDLE_IDENTIFIER = "${APP_ID}.NotificationService";`), 2, 'still exactly one extension target');
    assert.strictEqual(count(text, 'TARGETED_DEVICE_FAMILY = "1,2";'), 2);
    assert.ok(appGroupEverywhere(pbxproj));
});

test('ios-CFBundleIdentifier wins over id for the bundle id and the group', (t) => {
    silenceConsole(t);
    const { root, pbxproj } = makeProject(t, {
        widgetAttributes: `id="${APP_ID}" ios-CFBundleIdentifier="org.example.ios.demo"`
    });

    loadHook()(context(root));

    const project = read(pbxproj);
    assert.ok(project.includes('PRODUCT_BUNDLE_IDENTIFIER = "org.example.ios.demo.NotificationService";'));
    assert.ok(project.includes('PW_APP_GROUP = "group.org.example.ios.demo";'));
    assert.strictEqual(project.includes(`"${APP_ID}.NotificationService"`), false);
});

test("the pin is read from the plugin's own Package.swift", (t) => {
    silenceConsole(t);
    const manifest = read(PLUGIN_PACKAGE_SWIFT);
    const [, pin] = /Pushwoosh-XCFramework\.git", exact: "([^"]+)"/.exec(manifest);
    const { root, pbxproj } = makeProject(t, { manifest });

    loadHook()(context(root));

    assert.ok(read(pbxproj).includes(`version = ${pin};`));
});

test('the NSE source dir is not literally named "ios" (collides with `cordova platform add ios`)', () => {
    assert.strictEqual(fs.existsSync(path.join(NEWDEMO, 'ios')), false);
    assert.ok(fs.existsSync(path.join(NEWDEMO, 'ios-nse', 'NotificationService', 'NotificationService.swift')));
});

test('does nothing for a prepare without ios', (t) => {
    silenceConsole(t);
    const { root, iosDir, pbxproj } = makeProject(t);
    const projectBefore = read(pbxproj);

    loadHook()(context(root, ['android']));

    assert.strictEqual(read(pbxproj), projectBefore);
    assert.strictEqual(fs.existsSync(path.join(iosDir, 'NotificationService')), false);
});

test('returns quietly when platforms/ios does not exist yet', (t) => {
    const log = captureConsole(t);
    const { root } = makeProject(t, { withPlatform: false });

    assert.doesNotThrow(() => loadHook()(context(root)));
    assert.deepStrictEqual(log, [], 'platform truly absent: nothing can build anyway, so this stays silent');
});

test('warns and returns when the plugin is not installed yet (platform add preps before its own plugin hook runs)', (t) => {
    const log = captureConsole(t);
    const { root, pbxproj } = makeProject(t, { withPlugin: false });
    const projectBefore = read(pbxproj);

    assert.doesNotThrow(() => loadHook()(context(root)));

    assert.strictEqual(read(pbxproj), projectBefore);
    assert.ok(
        log.some((line) => line === '[NSE] plugins/pushwoosh-cordova-plugin/Package.swift not found, skipping: the NotificationService target is added by the next `cordova prepare ios` or `cordova build ios` once the Pushwoosh plugin is installed'),
        log.join('\n')
    );
});

test('a plugin manifest without the exact pin fails loudly before touching the platform', (t) => {
    silenceConsole(t);
    const manifest = pluginManifest().replace(/exact: "7\.3\.0"/, 'from: "7.3.0"');
    const { root, iosDir, pbxproj } = makeProject(t, { manifest });
    const projectBefore = read(pbxproj);

    assert.throws(() => loadHook()(context(root)), /Pushwoosh-XCFramework/);
    assert.strictEqual(read(pbxproj), projectBefore);
    assert.strictEqual(fs.existsSync(path.join(iosDir, 'NotificationService')), false);
});

test('a config.xml with neither ios-CFBundleIdentifier nor id fails loudly before touching the platform', (t) => {
    silenceConsole(t);
    const { root, pbxproj } = makeProject(t, { widgetAttributes: '' });
    const projectBefore = read(pbxproj);

    assert.throws(() => loadHook()(context(root)), /app id/);
    assert.strictEqual(read(pbxproj), projectBefore);
});
