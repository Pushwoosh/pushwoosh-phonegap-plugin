const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { templatePbxproj, demoModulesMissing } = require('./pbxproj-fixture');

if (demoModulesMissing) {
    test('ios-nse-before-prepare hook', { skip: demoModulesMissing }, () => {});
    return;
}

const xcode = require('xcode');

const { ensureExtensionTarget } = require('../ios-nse-project');

const HOOK_PATH = require.resolve('../ios-nse-before-prepare');
const APP_ID = 'org.example.sampleapp';
const OPTIONS = {
    name: 'NotificationService',
    bundleId: `${APP_ID}.NotificationService`,
    appGroup: `group.${APP_ID}`,
    deploymentTarget: '15.0',
    sourceFile: 'NotificationService.swift'
};
const COMMENT_KEY = /_comment$/;

function loadHook() {
    delete require.cache[HOOK_PATH];
    return require('../ios-nse-before-prepare');
}

function makeRoot(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ios-nse-before-prepare-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    return root;
}

function context(root, platforms = ['ios']) {
    return { opts: { platforms, projectRoot: root } };
}

function captureConsole(t) {
    const lines = [];
    t.mock.method(console, 'log', (...args) => {
        lines.push(args.join(' '));
    });
    return lines;
}

function read(file) {
    return fs.readFileSync(file, 'utf8');
}

function shufflePbxprojExtensionFirst(pbxprojPath) {
    const project = xcode.project(pbxprojPath);
    project.parseSync();
    ensureExtensionTarget(project, OPTIONS);

    const section = project.hash.project.objects.XCBuildConfiguration;
    const keys = Object.keys(section).filter((key) => !COMMENT_KEY.test(key));
    const [extensionKey, ...appKeys] = keys.sort((a, b) => {
        const infoplistA = section[a].buildSettings.INFOPLIST_FILE || '';
        return infoplistA.includes('NotificationService/') ? -1 : 1;
    });
    const shuffled = {};
    for (const key of [extensionKey, ...appKeys]) {
        shuffled[key] = section[key];
        if (section[`${key}_comment`] !== undefined) {
            shuffled[`${key}_comment`] = section[`${key}_comment`];
        }
    }
    project.hash.project.objects.XCBuildConfiguration = shuffled;
    fs.writeFileSync(pbxprojPath, project.writeSync(), 'utf8');
}

test('does nothing for a prepare without ios', (t) => {
    const log = captureConsole(t);
    const root = makeRoot(t);

    assert.doesNotThrow(() => loadHook()(context(root, ['android'])));
    assert.deepStrictEqual(log, []);
});

test('returns quietly when platforms/ios does not exist yet', (t) => {
    const log = captureConsole(t);
    const root = makeRoot(t);

    assert.doesNotThrow(() => loadHook()(context(root)));
    assert.deepStrictEqual(log, []);
});

test('returns quietly when platforms/ios exists but has no .xcodeproj yet', (t) => {
    const log = captureConsole(t);
    const root = makeRoot(t);
    fs.mkdirSync(path.join(root, 'platforms', 'ios'), { recursive: true });

    assert.doesNotThrow(() => loadHook()(context(root)));
    assert.deepStrictEqual(log, []);
});

test('reorders the pbxproj before cordova-ios would parse it, when a prior tool left the extension config first', (t) => {
    const log = captureConsole(t);
    const root = makeRoot(t);
    const iosDir = path.join(root, 'platforms', 'ios');
    const pbxprojPath = path.join(iosDir, 'newdemo.xcodeproj', 'project.pbxproj');
    fs.mkdirSync(path.dirname(pbxprojPath), { recursive: true });
    fs.writeFileSync(pbxprojPath, templatePbxproj({ id: APP_ID }));
    shufflePbxprojExtensionFirst(pbxprojPath);

    loadHook()(context(root));

    assert.ok(
        log.some((line) => line === "[NSE] before_prepare reordered newdemo.xcodeproj; restored the app's Info.plist as the first entry"),
        log.join('\n')
    );
    const project = xcode.project(pbxprojPath);
    project.parseSync();
    const section = project.hash.project.objects.XCBuildConfiguration;
    const keys = Object.keys(section).filter((key) => !COMMENT_KEY.test(key));
    const firstWithInfoplist = keys.find((key) => section[key].buildSettings.INFOPLIST_FILE);
    assert.ok(!section[firstWithInfoplist].buildSettings.INFOPLIST_FILE.includes('NotificationService/'));
});

test('is a silent no-op when the app is already first', (t) => {
    const log = captureConsole(t);
    const root = makeRoot(t);
    const iosDir = path.join(root, 'platforms', 'ios');
    const pbxprojPath = path.join(iosDir, 'newdemo.xcodeproj', 'project.pbxproj');
    fs.mkdirSync(path.dirname(pbxprojPath), { recursive: true });
    fs.writeFileSync(pbxprojPath, templatePbxproj({ id: APP_ID }));
    const before = read(pbxprojPath);

    loadHook()(context(root));

    assert.strictEqual(read(pbxprojPath), before);
    assert.deepStrictEqual(log, []);
});
