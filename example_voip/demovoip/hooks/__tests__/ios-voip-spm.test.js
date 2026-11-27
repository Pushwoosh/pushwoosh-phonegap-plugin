const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const HOOK_PATH = require.resolve('../ios-voip-spm');
const PLUGIN_PACKAGE_SWIFT = path.join(__dirname, '..', '..', '..', '..', 'Package.swift');
const MANIFEST = path.join('platforms', 'ios', 'packages', 'cordova-ios-plugins', 'Package.swift');
const SDK_URL = 'https://github.com/Pushwoosh/Pushwoosh-XCFramework.git';

// What cordova-ios 8 leaves after `plugin add ../../ --link` (packages/cordova-ios-plugins/Package.swift, license header cut).
const PLUGINS_MANIFEST = [
    '// swift-tools-version:5.9',
    'import PackageDescription',
    '',
    'let package = Package(',
    '    name: "CordovaPlugins",',
    '    products: [',
    '        .library(name: "CordovaPlugins", targets: ["CordovaPlugins"])',
    '    ],',
    '    targets: [',
    '        .target(name: "CordovaPlugins")',
    '    ]',
    ')',
    '',
    '',
    'package.dependencies.append(.package(name: "pushwoosh-cordova-plugin", path: "../../../../../.."))',
    'package.targets.first?.dependencies.append(.product(name: "pushwoosh-cordova-plugin", package: "pushwoosh-cordova-plugin"))',
    ''
].join('\n');

function pluginManifest(version) {
    return `        .package(url: "${SDK_URL}", exact: "${version}"),\n`;
}

function loadHook() {
    delete require.cache[HOOK_PATH];
    return require('../ios-voip-spm');
}

function makeProject(t, { pin = '7.3.0', withPlatform = true, withPlugin = true, plugin } = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ios-voip-spm-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    if (withPlatform) {
        fs.mkdirSync(path.dirname(path.join(root, MANIFEST)), { recursive: true });
        fs.writeFileSync(path.join(root, MANIFEST), PLUGINS_MANIFEST);
    }
    if (withPlugin) {
        fs.mkdirSync(path.join(root, 'plugins', 'pushwoosh-cordova-plugin'), { recursive: true });
        fs.writeFileSync(path.join(root, 'plugins', 'pushwoosh-cordova-plugin', 'Package.swift'), plugin || pluginManifest(pin));
    }
    return { root, manifest: path.join(root, MANIFEST) };
}

function context(root, platforms = ['ios']) {
    return { opts: { platforms, projectRoot: root } };
}

function captureConsole(t) {
    const lines = [];
    t.mock.method(console, 'log', (...args) => lines.push(args.join(' ')));
    return lines;
}

function read(file) {
    return fs.readFileSync(file, 'utf8');
}

function count(text, needle) {
    return text.split(needle).length - 1;
}

test('links PushwooshVoIP into the plugins package at the plugin pin', (t) => {
    const log = captureConsole(t);
    const { root, manifest } = makeProject(t);

    loadHook()(context(root));

    const text = read(manifest);
    assert.ok(text.startsWith(PLUGINS_MANIFEST.trimEnd()), 'what cordova-ios wrote stays as is');
    assert.strictEqual(count(text, `package.dependencies.append(.package(url: "${SDK_URL}", exact: "7.3.0"))`), 1);
    assert.strictEqual(count(text, 'package.targets.first?.dependencies.append(.product(name: "PushwooshVoIP", package: "Pushwoosh-XCFramework"))'), 1);
    assert.ok(log.includes(`[VoIP] Linked PushwooshVoIP 7.3.0 in ${MANIFEST}`), log.join('\n'));
});

test('a second run changes nothing', (t) => {
    captureConsole(t);
    const { root, manifest } = makeProject(t);
    const hook = loadHook();
    hook(context(root));
    const first = read(manifest);

    const log = captureConsole(t);
    hook(context(root));

    assert.strictEqual(read(manifest), first);
    assert.ok(log.includes(`[VoIP] PushwooshVoIP already linked in ${MANIFEST}`), log.join('\n'));
});

test('a new plugin pin replaces the old lines instead of adding a second package', (t) => {
    captureConsole(t);
    const { root, manifest } = makeProject(t);
    loadHook()(context(root));
    fs.writeFileSync(path.join(root, 'plugins', 'pushwoosh-cordova-plugin', 'Package.swift'), pluginManifest('7.4.0'));

    loadHook()(context(root));

    const text = read(manifest);
    assert.strictEqual(count(text, SDK_URL), 1);
    assert.ok(text.includes('exact: "7.4.0"'));
    assert.strictEqual(count(text, '.product(name: "PushwooshVoIP"'), 1);
});

test("the pin is read from the plugin's own Package.swift", (t) => {
    captureConsole(t);
    const plugin = read(PLUGIN_PACKAGE_SWIFT);
    const [, pin] = /Pushwoosh-XCFramework\.git", exact: "([^"]+)"/.exec(plugin);
    const { root, manifest } = makeProject(t, { plugin });

    loadHook()(context(root));

    assert.ok(read(manifest).includes(`exact: "${pin}"`));
});

test('skips quietly until the platform and the plugin are there', (t) => {
    for (const options of [{ withPlatform: false }, { withPlugin: false }]) {
        const log = captureConsole(t);
        const { root, manifest } = makeProject(t, options);

        assert.doesNotThrow(() => loadHook()(context(root)));

        assert.ok(log.some((line) => line.includes('skipping')), log.join('\n'));
        if (options.withPlugin === false) {
            assert.strictEqual(read(manifest), PLUGINS_MANIFEST);
        }
    }
});

test('does nothing for a prepare without ios', (t) => {
    const log = captureConsole(t);
    const { root, manifest } = makeProject(t);

    loadHook()(context(root, ['android']));

    assert.strictEqual(read(manifest), PLUGINS_MANIFEST);
    assert.deepStrictEqual(log, []);
});

test('a plugin manifest without the exact pin fails loudly and leaves the plugins package alone', (t) => {
    captureConsole(t);
    const { root, manifest } = makeProject(t, { plugin: `        .package(url: "${SDK_URL}", from: "7.3.0"),\n` });

    assert.throws(() => loadHook()(context(root)), /Pushwoosh-XCFramework/);
    assert.strictEqual(read(manifest), PLUGINS_MANIFEST);
});
