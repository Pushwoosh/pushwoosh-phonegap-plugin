const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const {
    PLUGIN_ID,
    PODFILE,
    VOIP_LINE,
    SPM_PODFILE,
    VOIP_ANCHOR,
    VOIP_PRODUCT_LINE,
    INAPP_ANCHOR,
    INAPP_PRODUCT_LINE,
    INBOX_ANCHOR,
    INBOX_TARGET_LINE,
    podfileWith,
    pluginPackageSwift,
    packageSwiftWithDependencies,
    project,
    readPodfile,
    pluginPackagePath,
    readPluginPackage,
    readLinkedPackage,
    stubExecSync,
    stubWarn,
    silenceConsole,
    context,
    loadHook
} = require('./helpers');

// Optional modules that only Swift Package Manager links (cordova-ios 8): the hook puts each after its own anchor.
const MODULES = [
    { variable: 'PW_INAPP_IOS_ENABLED', name: 'PushwooshInApp', anchor: INAPP_ANCHOR, line: INAPP_PRODUCT_LINE },
    { variable: 'PW_INBOX_IOS_ENABLED', name: 'PushwooshInboxKit', anchor: INBOX_ANCHOR, line: INBOX_TARGET_LINE }
];

function addHook() {
    return loadHook('add-voip-pod');
}

function removeHook() {
    return loadHook('remove-voip-pod');
}

function count(manifest, line) {
    return manifest.split('\n').filter((candidate) => candidate === line).length;
}

for (const module of MODULES) {
    test(`SPM: ${module.variable}=true links ${module.name} after its anchor and leaves the Podfile alone`, (t) => {
        silenceConsole(t);
        const execSync = stubExecSync(t);
        const root = project(t, { variables: { [module.variable]: 'true' }, podfile: SPM_PODFILE, spm: {} });

        addHook()(context(root));

        assert.strictEqual(readPluginPackage(root), packageSwiftWithDependencies([[module.anchor, module.line]]));
        assert.strictEqual(readPodfile(root), SPM_PODFILE);
        assert.strictEqual(execSync.mock.calls.length, 0);
    });

    for (const value of ['false', '', undefined]) {
        test(`SPM: ${module.variable}=${JSON.stringify(value)} keeps ${module.name} out of the copied Package.swift`, (t) => {
            silenceConsole(t);
            stubExecSync(t);
            const variables = value === undefined ? {} : { [module.variable]: value };
            const root = project(t, { variables, podfile: SPM_PODFILE, spm: {} });

            addHook()(context(root));

            assert.strictEqual(readPluginPackage(root), pluginPackageSwift());
        });
    }

    test(`SPM: ${module.name} is linked once across repeated installs`, (t) => {
        silenceConsole(t);
        stubExecSync(t);
        const root = project(t, { variables: { [module.variable]: 'True' }, podfile: SPM_PODFILE, spm: {} });

        addHook()(context(root));
        addHook()(context(root));

        assert.strictEqual(count(readPluginPackage(root), module.line), 1);
    });

    test(`SPM: ${module.name} comes and goes with the variable across plugin rm and plugin add`, (t) => {
        silenceConsole(t);
        stubExecSync(t);
        const root = project(t, { variables: { [module.variable]: 'true' }, podfile: SPM_PODFILE, spm: {} });
        addHook()(context(root));
        assert.strictEqual(count(readPluginPackage(root), module.line), 1);

        // plugin rm: the hook runs, then cordova-ios deletes packages/<id> (SwiftPackage.js:96-101) and fetch.json loses the entry
        removeHook()(context(root));
        fs.rmSync(path.dirname(pluginPackagePath(root)), { recursive: true });
        fs.writeFileSync(path.join(root, 'plugins', 'fetch.json'), '{}');
        assert.strictEqual(readPodfile(root), SPM_PODFILE);

        // plugin add without the variable: cordova-ios copies the repo manifest again
        fs.mkdirSync(path.dirname(pluginPackagePath(root)), { recursive: true });
        fs.writeFileSync(pluginPackagePath(root), pluginPackageSwift());
        fs.writeFileSync(path.join(root, 'plugins', 'fetch.json'), JSON.stringify({ [PLUGIN_ID]: { variables: {} } }));
        addHook()(context(root));
        assert.strictEqual(count(readPluginPackage(root), module.line), 0);

        // plugin add with the variable again
        fs.writeFileSync(path.join(root, 'plugins', 'fetch.json'), JSON.stringify({ [PLUGIN_ID]: { variables: { [module.variable]: 'true' } } }));
        addHook()(context(root));
        assert.strictEqual(count(readPluginPackage(root), module.line), 1);
    });

    test(`SPM: ${module.name} is not linked with --link, the warning names the dependency to add`, (t) => {
        silenceConsole(t);
        const warn = stubWarn(t);
        stubExecSync(t);
        const root = project(t, { variables: { [module.variable]: 'true' }, podfile: SPM_PODFILE, spm: { linked: true } });

        addHook()(context(root));

        assert.strictEqual(warn.mock.calls.length, 1);
        assert.match(warn.mock.calls[0].arguments[0], /--link/);
        assert.ok(warn.mock.calls[0].arguments[0].includes(module.line.trim().replace(/,$/, '')));
        assert.strictEqual(readLinkedPackage(root), pluginPackageSwift());
    });

    test(`CocoaPods: ${module.variable}=true leaves the Podfile alone, runs no pod install and says it needs cordova-ios 8`, (t) => {
        silenceConsole(t);
        const warn = stubWarn(t);
        const execSync = stubExecSync(t);
        const root = project(t, { variables: { [module.variable]: 'true' }, podfile: PODFILE });

        addHook()(context(root));

        assert.strictEqual(readPodfile(root), PODFILE);
        assert.strictEqual(execSync.mock.calls.length, 0);
        assert.strictEqual(warn.mock.calls.length, 1);
        assert.match(warn.mock.calls[0].arguments[0], new RegExp(module.variable));
        assert.match(warn.mock.calls[0].arguments[0], /cordova-ios 8/);
    });

    test(`CocoaPods: ${module.variable}=true next to PW_VOIP_IOS_ENABLED=true adds only the VoIP subspec`, (t) => {
        silenceConsole(t);
        stubWarn(t);
        stubExecSync(t);
        const root = project(t, { variables: { [module.variable]: 'true', PW_VOIP_IOS_ENABLED: 'true' }, podfile: PODFILE });

        addHook()(context(root));

        assert.strictEqual(readPodfile(root), podfileWith(VOIP_LINE));
    });

    test(`CocoaPods: uninstall leaves the Podfile of a ${module.variable} install alone`, (t) => {
        silenceConsole(t);
        const root = project(t, { variables: { [module.variable]: 'true' }, podfile: PODFILE });
        const write = t.mock.method(fs, 'writeFileSync');

        removeHook()(context(root));

        assert.strictEqual(readPodfile(root), PODFILE);
        assert.strictEqual(write.mock.calls.length, 0);
    });

    test(`the repo Package.swift keeps ${module.name} out of the plugin target and carries its anchor there`, () => {
        const lines = pluginPackageSwift().split('\n');
        const targetIndex = lines.findIndex((line, index) => line.includes('.target(') && lines[index + 1].includes('name: "pushwoosh-cordova-plugin"'));
        const pathIndex = lines.findIndex((line) => line.includes('path: "src/ios"'));
        const pluginTarget = lines.slice(targetIndex, pathIndex);

        assert.ok(targetIndex !== -1 && pathIndex > targetIndex);
        assert.strictEqual(lines.filter((line) => line.includes(module.anchor)).length, 1, 'the hook takes the first line with the anchor');
        assert.ok(pluginTarget.some((line) => line.includes(module.anchor)), 'anchor must sit in the dependencies of the plugin target');
        assert.ok(!pluginTarget.some((line) => line.includes(module.line.trim().replace(/,$/, ''))));
    });
}

test('SPM: every enabled module is linked after its own anchor, VoIP included', (t) => {
    silenceConsole(t);
    stubExecSync(t);
    const variables = { PW_VOIP_IOS_ENABLED: 'true' };
    MODULES.forEach((module) => { variables[module.variable] = 'true'; });
    const root = project(t, { variables, podfile: SPM_PODFILE, spm: {} });

    addHook()(context(root));

    const expected = packageSwiftWithDependencies([
        [VOIP_ANCHOR, VOIP_PRODUCT_LINE],
        ...MODULES.map((module) => [module.anchor, module.line])
    ]);
    assert.strictEqual(readPluginPackage(root), expected);
});

test('SPM: VoIP alone does not drag the other modules in', (t) => {
    silenceConsole(t);
    stubExecSync(t);
    const root = project(t, { variables: { PW_VOIP_IOS_ENABLED: 'true' }, podfile: SPM_PODFILE, spm: {} });

    addHook()(context(root));

    const manifest = readPluginPackage(root);
    MODULES.forEach((module) => assert.strictEqual(count(manifest, module.line), 0));
    assert.strictEqual(count(manifest, VOIP_PRODUCT_LINE), 1);
});
