const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const {
    PODFILE,
    VOIP_LINE,
    podfileWith,
    project,
    readPodfile,
    stubExecSync,
    silenceConsole,
    context,
    loadHook,
    SPM_PODFILE,
    VOIP_ANCHOR,
    VOIP_PRODUCT_LINE,
    pluginPackageSwift,
    packageSwiftWith,
    packageSwiftWithoutAnchor,
    readPluginPackage,
    readLinkedPackage,
    stubWarn,
    LEGACY_PODS_JSON,
    SPM_PODS_JSON,
    readPodsJson
} = require('./helpers');

function addVoipPod() {
    return loadHook('add-voip-pod');
}

test('inserts the VoIP subspec after the base pod, reusing its version', (t) => {
    silenceConsole(t);
    stubExecSync(t);
    const root = project(t, { variables: { PW_VOIP_IOS_ENABLED: 'true' }, podfile: PODFILE });

    addVoipPod()(context(root));

    assert.strictEqual(readPodfile(root), podfileWith(VOIP_LINE));
});

test('runs pod install in the ios platform dir', (t) => {
    silenceConsole(t);
    const execSync = stubExecSync(t);
    const root = project(t, { variables: { PW_VOIP_IOS_ENABLED: 'true' }, podfile: PODFILE });

    addVoipPod()(context(root));

    assert.strictEqual(execSync.mock.calls.length, 1);
    const [command, opts] = execSync.mock.calls[0].arguments;
    assert.strictEqual(command, 'pod install');
    assert.strictEqual(opts.cwd, path.join(root, 'platforms', 'ios'));
});

test('a failing pod install is not fatal', (t) => {
    silenceConsole(t);
    t.mock.method(require('node:child_process'), 'execSync', () => {
        throw new Error('pod: command not found');
    });
    const root = project(t, { variables: { PW_VOIP_IOS_ENABLED: 'true' }, podfile: PODFILE });

    assert.doesNotThrow(() => addVoipPod()(context(root)));
    assert.strictEqual(readPodfile(root), podfileWith(VOIP_LINE));
});

for (const value of ['True', 'TRUE']) {
    test(`accepts the variable spelled ${value}, like the android hook does`, (t) => {
        silenceConsole(t);
        stubExecSync(t);
        const root = project(t, { variables: { PW_VOIP_IOS_ENABLED: value }, podfile: PODFILE });

        addVoipPod()(context(root));

        assert.strictEqual(readPodfile(root), podfileWith(VOIP_LINE));
    });
}

for (const value of ['False', 'yes', '']) {
    test(`treats the variable spelled ${JSON.stringify(value)} as off`, (t) => {
        silenceConsole(t);
        const execSync = stubExecSync(t);
        const root = project(t, { variables: { PW_VOIP_IOS_ENABLED: value }, podfile: PODFILE });

        addVoipPod()(context(root));

        assert.strictEqual(readPodfile(root), PODFILE);
        assert.strictEqual(execSync.mock.calls.length, 0);
    });
}

test('leaves the Podfile alone when the variable was never passed', (t) => {
    silenceConsole(t);
    const execSync = stubExecSync(t);
    const root = project(t, { variables: {}, podfile: PODFILE });

    addVoipPod()(context(root));

    assert.strictEqual(readPodfile(root), PODFILE);
    assert.strictEqual(execSync.mock.calls.length, 0);
});

test('leaves the Podfile alone when the variable is false', (t) => {
    silenceConsole(t);
    const execSync = stubExecSync(t);
    const root = project(t, { variables: { PW_VOIP_IOS_ENABLED: 'false' }, podfile: PODFILE });

    addVoipPod()(context(root));

    assert.strictEqual(readPodfile(root), PODFILE);
    assert.strictEqual(execSync.mock.calls.length, 0);
});

test('is idempotent: a Podfile that already has the subspec is untouched', (t) => {
    silenceConsole(t);
    const execSync = stubExecSync(t);
    const already = podfileWith(VOIP_LINE);
    const root = project(t, { variables: { PW_VOIP_IOS_ENABLED: 'true' }, podfile: already });

    addVoipPod()(context(root));

    assert.strictEqual(readPodfile(root), already);
    assert.strictEqual(execSync.mock.calls.length, 0);
});

test('does nothing without fetch.json', (t) => {
    silenceConsole(t);
    const execSync = stubExecSync(t);
    const root = project(t, { podfile: PODFILE });

    assert.doesNotThrow(() => addVoipPod()(context(root)));
    assert.strictEqual(readPodfile(root), PODFILE);
    assert.strictEqual(execSync.mock.calls.length, 0);
});

test('does nothing when the ios platform has no Podfile', (t) => {
    silenceConsole(t);
    const execSync = stubExecSync(t);
    const root = project(t, { variables: { PW_VOIP_IOS_ENABLED: 'true' } });

    assert.doesNotThrow(() => addVoipPod()(context(root)));
    assert.strictEqual(execSync.mock.calls.length, 0);
});

test('does nothing when the base PushwooshXCFramework pod is absent', (t) => {
    silenceConsole(t);
    const execSync = stubExecSync(t);
    const podfile = PODFILE.replace("\tpod 'PushwooshXCFramework', '7.2.4'\n", '');
    const root = project(t, { variables: { PW_VOIP_IOS_ENABLED: 'true' }, podfile });

    addVoipPod()(context(root));

    assert.strictEqual(readPodfile(root), podfile);
    assert.strictEqual(execSync.mock.calls.length, 0);
});

test('inserts the subspec without a version when the base pod is unversioned', (t) => {
    silenceConsole(t);
    stubExecSync(t);
    const podfile = PODFILE.replace(
        "\tpod 'PushwooshXCFramework', '7.2.4'",
        "\tpod 'PushwooshXCFramework'"
    );
    const root = project(t, { variables: { PW_VOIP_IOS_ENABLED: 'true' }, podfile });

    addVoipPod()(context(root));

    const expected = podfile.replace(
        "\tpod 'PushwooshXCFramework'\n",
        "\tpod 'PushwooshXCFramework'\n\tpod 'PushwooshXCFramework/PushwooshVoIP'\n"
    );
    assert.strictEqual(readPodfile(root), expected);
});

test('ignores the variable set on package.json instead of fetch.json', (t) => {
    silenceConsole(t);
    const execSync = stubExecSync(t);
    const root = project(t, { variables: {}, podfile: PODFILE });
    require('node:fs').writeFileSync(
        path.join(root, 'package.json'),
        JSON.stringify({
            cordova: { plugins: { 'pushwoosh-cordova-plugin': { PW_VOIP_IOS_ENABLED: 'true' } } }
        })
    );

    addVoipPod()(context(root));

    assert.strictEqual(readPodfile(root), PODFILE);
    assert.strictEqual(execSync.mock.calls.length, 0);
});

// cordova-ios 8 (SPM mode): the hook edits the plugin copy under platforms/ios/packages instead of the Podfile

function voipProductCount(manifest) {
    return manifest.split('\n').filter((line) => line.includes('.product(name: "PushwooshVoIP"')).length;
}

test('SPM: links PushwooshVoIP after the anchor of the copied Package.swift and leaves the Podfile alone', (t) => {
    silenceConsole(t);
    const execSync = stubExecSync(t);
    const root = project(t, { variables: { PW_VOIP_IOS_ENABLED: 'true' }, podfile: SPM_PODFILE, spm: {} });

    addVoipPod()(context(root));

    assert.strictEqual(readPluginPackage(root), packageSwiftWith(VOIP_PRODUCT_LINE));
    assert.strictEqual(readPodfile(root), SPM_PODFILE);
    assert.strictEqual(execSync.mock.calls.length, 0);
});

test('SPM: is idempotent across repeated installs', (t) => {
    silenceConsole(t);
    stubExecSync(t);
    const root = project(t, { variables: { PW_VOIP_IOS_ENABLED: 'true' }, podfile: SPM_PODFILE, spm: {} });

    addVoipPod()(context(root));
    addVoipPod()(context(root));

    assert.strictEqual(voipProductCount(readPluginPackage(root)), 1);
    assert.strictEqual(readPluginPackage(root), packageSwiftWith(VOIP_PRODUCT_LINE));
});

for (const value of ['false', undefined]) {
    test(`SPM: leaves the copied Package.swift alone when the variable is ${value}`, (t) => {
        silenceConsole(t);
        const execSync = stubExecSync(t);
        const variables = value === undefined ? {} : { PW_VOIP_IOS_ENABLED: value };
        const root = project(t, { variables, podfile: SPM_PODFILE, spm: {} });

        addVoipPod()(context(root));

        assert.strictEqual(readPluginPackage(root), pluginPackageSwift());
        assert.strictEqual(readPodfile(root), SPM_PODFILE);
        assert.strictEqual(execSync.mock.calls.length, 0);
    });
}

test('SPM: warns and touches nothing when the plugin was installed with --link', (t) => {
    silenceConsole(t);
    const warn = stubWarn(t);
    const execSync = stubExecSync(t);
    const root = project(t, { variables: { PW_VOIP_IOS_ENABLED: 'true' }, podfile: SPM_PODFILE, spm: { linked: true } });

    assert.doesNotThrow(() => addVoipPod()(context(root)));

    assert.strictEqual(warn.mock.calls.length, 1);
    assert.match(warn.mock.calls[0].arguments[0], /--link/);
    assert.match(warn.mock.calls[0].arguments[0], /PushwooshVoIP/);
    assert.strictEqual(readLinkedPackage(root), pluginPackageSwift());
    assert.strictEqual(readPodfile(root), SPM_PODFILE);
    assert.strictEqual(execSync.mock.calls.length, 0);
});

test('SPM: warns and touches nothing when the anchor is missing from the copied Package.swift', (t) => {
    silenceConsole(t);
    const warn = stubWarn(t);
    stubExecSync(t);
    const withoutAnchor = packageSwiftWithoutAnchor();
    const root = project(t, {
        variables: { PW_VOIP_IOS_ENABLED: 'true' },
        podfile: SPM_PODFILE,
        spm: { packageSwift: withoutAnchor }
    });

    assert.doesNotThrow(() => addVoipPod()(context(root)));

    assert.strictEqual(warn.mock.calls.length, 1);
    assert.match(warn.mock.calls[0].arguments[0], new RegExp(VOIP_ANCHOR));
    assert.strictEqual(readPluginPackage(root), withoutAnchor);
});

test('falls back to the Podfile when the SPM manifest does not list the plugin', (t) => {
    silenceConsole(t);
    stubExecSync(t);
    const root = project(t, { variables: { PW_VOIP_IOS_ENABLED: 'true' }, podfile: PODFILE, spm: { listed: false } });

    addVoipPod()(context(root));

    assert.strictEqual(readPodfile(root), podfileWith(VOIP_LINE));
});

test('the repo Package.swift carries the anchor and the native package the hook relies on', () => {
    const manifest = pluginPackageSwift();
    const anchorIndex = manifest.split('\n').findIndex((line) => line.includes(VOIP_ANCHOR));

    assert.notStrictEqual(anchorIndex, -1);
    assert.match(manifest, /\.product\(name: "PushwooshFramework", package: "Pushwoosh-XCFramework"\)/);
    assert.strictEqual(voipProductCount(manifest), 0);
});

// cordova-ios 8 restore over a platform that got the pods from 8.3.76 or older: cordova-ios keeps them (Api.js:491 skips nospm pods
// on uninstall too), and the app then embeds PushwooshFramework twice

const RECREATE_PLATFORM = 'cordova platform rm ios && cordova platform add ios';

test('SPM: warns with the platform recreate recipe when pods.json still lists Pushwoosh pods, and leaves them in place', (t) => {
    silenceConsole(t);
    const warn = stubWarn(t);
    const execSync = stubExecSync(t);
    const root = project(t, { variables: {}, podfile: PODFILE, podsJson: LEGACY_PODS_JSON, spm: {} });

    addVoipPod()(context(root));

    assert.strictEqual(warn.mock.calls.length, 1);
    const message = warn.mock.calls[0].arguments[0];
    assert.ok(message.includes(RECREATE_PLATFORM), message);
    assert.match(message, /PushwooshXCFramework/);
    assert.match(message, /PushwooshInboxUIXCFramework/);
    assert.match(message, /Multiple commands produce/);
    assert.strictEqual(readPodsJson(root), LEGACY_PODS_JSON);
    assert.strictEqual(readPodfile(root), PODFILE);
    assert.strictEqual(readPluginPackage(root), pluginPackageSwift());
    assert.strictEqual(execSync.mock.calls.length, 0);
});

test('SPM: warns when only pods.json still lists Pushwoosh pods', (t) => {
    silenceConsole(t);
    const warn = stubWarn(t);
    stubExecSync(t);
    const root = project(t, { variables: {}, podfile: SPM_PODFILE, podsJson: LEGACY_PODS_JSON, spm: {} });

    addVoipPod()(context(root));

    assert.strictEqual(warn.mock.calls.length, 1);
    assert.ok(warn.mock.calls[0].arguments[0].includes(RECREATE_PLATFORM));
    assert.strictEqual(readPodsJson(root), LEGACY_PODS_JSON);
});

test('SPM: warns when only the Podfile still has Pushwoosh pods', (t) => {
    silenceConsole(t);
    const warn = stubWarn(t);
    stubExecSync(t);
    const root = project(t, { variables: {}, podfile: PODFILE, podsJson: SPM_PODS_JSON, spm: {} });

    addVoipPod()(context(root));

    assert.strictEqual(warn.mock.calls.length, 1);
    assert.ok(warn.mock.calls[0].arguments[0].includes(RECREATE_PLATFORM));
    assert.strictEqual(readPodfile(root), PODFILE);
});

test('SPM: warns about leftover pods even without fetch.json', (t) => {
    silenceConsole(t);
    const warn = stubWarn(t);
    stubExecSync(t);
    const root = project(t, { podfile: PODFILE, podsJson: LEGACY_PODS_JSON, spm: {} });

    addVoipPod()(context(root));

    assert.strictEqual(warn.mock.calls.length, 1);
    assert.ok(warn.mock.calls[0].arguments[0].includes(RECREATE_PLATFORM));
});

test('SPM: still links PushwooshVoIP next to the leftover pods warning', (t) => {
    silenceConsole(t);
    const warn = stubWarn(t);
    stubExecSync(t);
    const root = project(t, { variables: { PW_VOIP_IOS_ENABLED: 'true' }, podfile: PODFILE, podsJson: LEGACY_PODS_JSON, spm: {} });

    addVoipPod()(context(root));

    assert.strictEqual(warn.mock.calls.length, 1);
    assert.ok(warn.mock.calls[0].arguments[0].includes(RECREATE_PLATFORM));
    assert.strictEqual(readPluginPackage(root), packageSwiftWith(VOIP_PRODUCT_LINE));
    assert.strictEqual(readPodfile(root), PODFILE);
});

test('SPM: no warning on a platform without Pushwoosh pods', (t) => {
    silenceConsole(t);
    const warn = stubWarn(t);
    stubExecSync(t);
    const root = project(t, { variables: {}, podfile: SPM_PODFILE, podsJson: SPM_PODS_JSON, spm: {} });

    addVoipPod()(context(root));

    assert.strictEqual(warn.mock.calls.length, 0);
});

test('CocoaPods path: Pushwoosh pods are expected there, no warning', (t) => {
    silenceConsole(t);
    const warn = stubWarn(t);
    stubExecSync(t);
    const root = project(t, { variables: {}, podfile: PODFILE, podsJson: LEGACY_PODS_JSON });

    addVoipPod()(context(root));

    assert.strictEqual(warn.mock.calls.length, 0);
    assert.strictEqual(readPodfile(root), PODFILE);
});

test('SPM: an unreadable pods.json does not break the install', (t) => {
    silenceConsole(t);
    const warn = stubWarn(t);
    stubExecSync(t);
    const root = project(t, { variables: {}, podfile: SPM_PODFILE, podsJson: '{ not json', spm: {} });

    assert.doesNotThrow(() => addVoipPod()(context(root)));
    assert.strictEqual(warn.mock.calls.length, 0);
});
