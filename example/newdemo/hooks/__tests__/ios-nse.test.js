const test = require('node:test');
const assert = require('node:assert');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { templatePbxproj, PODFILE, demoModulesMissing } = require('./pbxproj-fixture');

if (demoModulesMissing) {
    test('ios-nse hook', { skip: demoModulesMissing }, () => {});
    return;
}

const xcode = require('xcode');

const HOOK_PATH = require.resolve('../ios-nse');
const NEWDEMO = path.join(__dirname, '..', '..');
const APP_ID = 'org.example.sampleapp';
const PLUGIN_XML = '<plugin>\n  <pod name="PushwooshXCFramework" spec="7.2.8" nospm="true" />\n</plugin>\n';

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

function makeProject(t, { widgetAttributes = `id="${APP_ID}"`, pluginXml = PLUGIN_XML, withPlatform = true, withPlugin = true } = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ios-nse-hook-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));

    fs.writeFileSync(path.join(root, 'config.xml'), configXml(widgetAttributes));
    if (withPlugin) {
        fs.mkdirSync(path.join(root, 'plugins', 'pushwoosh-cordova-plugin'), { recursive: true });
        fs.writeFileSync(path.join(root, 'plugins', 'pushwoosh-cordova-plugin', 'plugin.xml'), pluginXml);
    }
    fs.cpSync(path.join(NEWDEMO, 'ios-nse'), path.join(root, 'ios-nse'), { recursive: true });

    const iosDir = path.join(root, 'platforms', 'ios');
    const pbxproj = path.join(iosDir, 'newdemo.xcodeproj', 'project.pbxproj');
    const podfile = path.join(iosDir, 'Podfile');
    if (withPlatform) {
        fs.mkdirSync(path.dirname(pbxproj), { recursive: true });
        fs.writeFileSync(pbxproj, templatePbxproj({ id: APP_ID }));
        fs.writeFileSync(podfile, PODFILE);
    }
    return { root, iosDir, pbxproj, podfile };
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

// `pod install` integrates a target by generating its aggregate support files; the hook reads that
// directory to tell a finished install from a Podfile edit, so the stub has to produce it.
function podsSupportDir(iosDir) {
    return path.join(iosDir, 'Pods', 'Target Support Files', 'Pods-NotificationService');
}

function installPods(file, args, options) {
    fs.mkdirSync(podsSupportDir(options.cwd), { recursive: true });
    return Buffer.from('');
}

function stubPod(t, impl = installPods) {
    return t.mock.method(childProcess, 'execFileSync', impl);
}

function dropAppGroup(pbxprojPath) {
    const project = xcode.project(pbxprojPath);
    project.parseSync();
    const configurations = project.hash.project.objects.XCBuildConfiguration;
    for (const key of Object.keys(configurations).filter((k) => !k.endsWith('_comment'))) {
        delete configurations[key].buildSettings.PW_APP_GROUP;
    }
    fs.writeFileSync(pbxprojPath, project.writeSync(), 'utf8');
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

test('wires the extension into a fresh platform and runs pod install once', (t) => {
    const log = captureConsole(t);
    const pod = stubPod(t);
    const { root, iosDir, pbxproj, podfile } = makeProject(t);

    loadHook()(context(root));

    assert.ok(log.some((line) => line === '[NSE] Added target NotificationService to newdemo.xcodeproj'), log.join('\n'));

    const copied = path.join(iosDir, 'NotificationService');
    for (const name of ['NotificationService.swift', 'Info.plist', 'NotificationService.entitlements']) {
        assert.strictEqual(read(path.join(copied, name)), read(path.join(NEWDEMO, 'ios-nse', 'NotificationService', name)));
    }

    const project = read(pbxproj);
    assert.strictEqual(count(project, `PRODUCT_BUNDLE_IDENTIFIER = "${APP_ID}.NotificationService";`), 2);
    assert.ok(project.includes(`PW_APP_GROUP = "group.${APP_ID}";`));
    assert.ok(project.includes('NotificationService.appex'));

    const pods = read(podfile);
    assert.strictEqual(count(pods, "target 'NotificationService' do"), 1);
    assert.strictEqual(count(pods, "\tpod 'PushwooshXCFramework', '7.2.8'"), 2);

    assert.strictEqual(pod.mock.calls.length, 1);
    const [file, args, options] = pod.mock.calls[0].arguments;
    assert.strictEqual(file, 'pod');
    assert.deepStrictEqual(args, ['install']);
    assert.strictEqual(options.cwd, iosDir);
});

test('a second run changes nothing and skips pod install', (t) => {
    silenceConsole(t);
    const pod = stubPod(t);
    const { root, pbxproj, podfile } = makeProject(t);
    const hook = loadHook();
    hook(context(root));
    const projectAfterFirst = read(pbxproj);
    const podsAfterFirst = read(podfile);
    const callsAfterFirst = pod.mock.calls.length;

    const log = captureConsole(t);
    hook(context(root));

    assert.strictEqual(read(pbxproj), projectAfterFirst);
    assert.strictEqual(read(podfile), podsAfterFirst);
    assert.strictEqual(pod.mock.calls.length, callsAfterFirst);
    assert.ok(log.some((line) => line === '[NSE] Target NotificationService already in newdemo.xcodeproj, nothing to do'), log.join('\n'));
    assert.ok(!log.some((line) => line.includes('Added target')), log.join('\n'));
});

test('when pod install re-serializes the project and drops PW_APP_GROUP, the next run refreshes settings without re-adding the target', (t) => {
    silenceConsole(t);
    stubPod(t);
    const { root, pbxproj } = makeProject(t);
    const hook = loadHook();
    hook(context(root));

    // Simulate what `pod install` does in practice: a fresh Pods configuration with no PW_APP_GROUP.
    const project = xcode.project(pbxproj);
    project.parseSync();
    const configurations = project.hash.project.objects.XCBuildConfiguration;
    const [firstKey] = Object.keys(configurations).filter((key) => !key.endsWith('_comment'));
    delete configurations[firstKey].buildSettings.PW_APP_GROUP;
    fs.writeFileSync(pbxproj, project.writeSync(), 'utf8');

    const log = captureConsole(t);
    hook(context(root));

    assert.ok(log.some((line) => line === '[NSE] Target NotificationService already in newdemo.xcodeproj, refreshed build settings'), log.join('\n'));
    assert.ok(!log.some((line) => line.includes('Added target')), log.join('\n'));
    assert.strictEqual(count(read(pbxproj), `PRODUCT_BUNDLE_IDENTIFIER = "${APP_ID}.NotificationService";`), 2, 'still exactly one extension target, not a duplicate');

    const reloaded = xcode.project(pbxproj);
    reloaded.parseSync();
    const refreshedConfigurations = reloaded.hash.project.objects.XCBuildConfiguration;
    for (const key of Object.keys(refreshedConfigurations).filter((k) => !k.endsWith('_comment'))) {
        assert.ok(refreshedConfigurations[key].buildSettings.PW_APP_GROUP, `configuration ${key} missing PW_APP_GROUP`);
    }
});

test('after cordova rewrites the Podfile the block comes back and pod install runs again', (t) => {
    silenceConsole(t);
    const pod = stubPod(t);
    const { root, podfile } = makeProject(t);
    const hook = loadHook();
    hook(context(root));
    fs.writeFileSync(podfile, PODFILE);
    const callsBefore = pod.mock.calls.length;

    hook(context(root));

    assert.strictEqual(count(read(podfile), "target 'NotificationService' do"), 1);
    assert.strictEqual(pod.mock.calls.length, callsBefore + 1);
});

test('ios-CFBundleIdentifier wins over id for the bundle id and the group', (t) => {
    silenceConsole(t);
    stubPod(t);
    const { root, pbxproj } = makeProject(t, {
        widgetAttributes: `id="${APP_ID}" ios-CFBundleIdentifier="org.example.ios.demo"`
    });

    loadHook()(context(root));

    const project = read(pbxproj);
    assert.ok(project.includes('PRODUCT_BUNDLE_IDENTIFIER = "org.example.ios.demo.NotificationService";'));
    assert.ok(project.includes('PW_APP_GROUP = "group.org.example.ios.demo";'));
    assert.strictEqual(project.includes(`"${APP_ID}.NotificationService"`), false);
});

test('the NSE source dir is not literally named "ios" (collides with `cordova platform add ios`)', () => {
    assert.strictEqual(fs.existsSync(path.join(NEWDEMO, 'ios')), false);
    assert.ok(fs.existsSync(path.join(NEWDEMO, 'ios-nse', 'NotificationService', 'NotificationService.swift')));
});

test('does nothing for a prepare without ios', (t) => {
    silenceConsole(t);
    const pod = stubPod(t);
    const { root, iosDir, podfile } = makeProject(t);

    loadHook()(context(root, ['android']));

    assert.strictEqual(read(podfile), PODFILE);
    assert.strictEqual(fs.existsSync(path.join(iosDir, 'NotificationService')), false);
    assert.strictEqual(pod.mock.calls.length, 0);
});

test('returns quietly when platforms/ios does not exist yet', (t) => {
    const log = captureConsole(t);
    const pod = stubPod(t);
    const { root } = makeProject(t, { withPlatform: false });

    assert.doesNotThrow(() => loadHook()(context(root)));
    assert.strictEqual(pod.mock.calls.length, 0);
    assert.deepStrictEqual(log, [], 'platform truly absent: nothing can build anyway, so this stays silent');
});

test('warns and returns when the plugin is not installed yet (platform add preps before its own plugin hook runs)', (t) => {
    const log = captureConsole(t);
    const pod = stubPod(t);
    const { root, pbxproj, podfile } = makeProject(t, { withPlugin: false });
    const projectBefore = read(pbxproj);
    const podfileBefore = read(podfile);

    assert.doesNotThrow(() => loadHook()(context(root)));

    assert.strictEqual(read(pbxproj), projectBefore);
    assert.strictEqual(read(podfile), podfileBefore);
    assert.strictEqual(pod.mock.calls.length, 0);
    assert.ok(
        log.some((line) => line === '[NSE] plugins/pushwoosh-cordova-plugin/plugin.xml not found, skipping: the NotificationService target is added by the next `cordova prepare ios` or `cordova build ios` once the Pushwoosh plugin is installed'),
        log.join('\n')
    );
});

test('a plugin.xml without the pod pin fails loudly before touching the platform', (t) => {
    silenceConsole(t);
    const pod = stubPod(t);
    const { root, podfile, pbxproj } = makeProject(t, { pluginXml: '<plugin></plugin>\n' });
    const projectBefore = read(pbxproj);

    assert.throws(() => loadHook()(context(root)), /PushwooshXCFramework/);
    assert.strictEqual(read(podfile), PODFILE);
    assert.strictEqual(read(pbxproj), projectBefore);
    assert.strictEqual(pod.mock.calls.length, 0);
});

test('a config.xml with neither ios-CFBundleIdentifier nor id fails loudly before touching the platform', (t) => {
    silenceConsole(t);
    const pod = stubPod(t);
    const { root, podfile, pbxproj } = makeProject(t, { widgetAttributes: '' });
    const projectBefore = read(pbxproj);

    assert.throws(() => loadHook()(context(root)), /app id/);
    assert.strictEqual(read(podfile), PODFILE);
    assert.strictEqual(read(pbxproj), projectBefore);
    assert.strictEqual(pod.mock.calls.length, 0);
});

test('a missing pod binary is reported as CocoaPods', (t) => {
    silenceConsole(t);
    stubPod(t, () => {
        throw Object.assign(new Error('spawn pod ENOENT'), { code: 'ENOENT' });
    });
    const { root } = makeProject(t);

    assert.throws(() => loadHook()(context(root)), /CocoaPods/);
});

test('a Podfile block left behind by a failed pod install still gets pod install on the next run', (t) => {
    silenceConsole(t);
    const failing = stubPod(t, () => {
        throw new Error('pod install blew up');
    });
    const { root, iosDir, podfile } = makeProject(t);

    assert.throws(() => loadHook()(context(root)), /pod install blew up/);
    assert.strictEqual(count(read(podfile), "target 'NotificationService' do"), 1, 'the Podfile edit survived the failure');
    assert.strictEqual(fs.existsSync(podsSupportDir(iosDir)), false, 'nothing was integrated');
    failing.mock.restore();

    const pod = stubPod(t);
    loadHook()(context(root));

    assert.strictEqual(pod.mock.calls.length, 1, 'an unchanged Podfile is not proof the pods are installed');
    assert.ok(fs.existsSync(podsSupportDir(iosDir)));
});

test('an integrated run does not shell out to pod install again', (t) => {
    silenceConsole(t);
    const pod = stubPod(t);
    const { root } = makeProject(t);
    const hook = loadHook();
    hook(context(root));

    hook(context(root));

    assert.strictEqual(pod.mock.calls.length, 1);
});

test('PW_APP_GROUP dropped by pod install is restored in the same run', (t) => {
    const log = captureConsole(t);
    stubPod(t, (file, args, options) => {
        installPods(file, args, options);
        dropAppGroup(path.join(options.cwd, 'newdemo.xcodeproj', 'project.pbxproj'));
        return Buffer.from('');
    });
    const { root, pbxproj } = makeProject(t);

    loadHook()(context(root));

    assert.ok(appGroupEverywhere(pbxproj), 'the extension must not build without its App Group until the next prepare');
    assert.ok(log.some((line) => line.includes('PW_APP_GROUP')), log.join('\n'));
});
