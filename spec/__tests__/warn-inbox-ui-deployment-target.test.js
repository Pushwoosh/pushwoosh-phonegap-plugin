const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const {
    PODFILE,
    SPM_PODFILE,
    project,
    stubXcodeVersion,
    stubWarn,
    context,
    loadHook
} = require('./helpers');

const HOOK = 'spec/warn-inbox-ui-deployment-target.js';
const BUILD_FLAG = 'cordova build ios --buildFlag="IPHONEOS_DEPLOYMENT_TARGET=15.0"';
const BUILD_JSON_FLAG = '"buildFlag": ["IPHONEOS_DEPLOYMENT_TARGET=15.0"]';

function warnInboxUi() {
    return loadHook('warn-inbox-ui-deployment-target');
}

for (const version of ['Xcode 27.0\nBuild version 27A266a\n', 'Xcode 28.1\nBuild version 28B5\n']) {
    test(`warns once on the CocoaPods path with ${version.split('\n')[0]}`, (t) => {
        const warn = stubWarn(t);
        stubXcodeVersion(t, version);
        const root = project(t, { podfile: PODFILE });

        warnInboxUi()(context(root));

        assert.strictEqual(warn.mock.calls.length, 1);
        const [message] = warn.mock.calls[0].arguments;
        assert.match(message, /^\[pushwoosh-cordova-plugin\] /);
        assert.ok(message.includes('PushwooshInboxUIXCFramework'), message);
        assert.ok(message.includes('13.0'), message);
        assert.ok(message.includes('Xcode 27'), message);
        assert.ok(message.includes(BUILD_FLAG), message);
        assert.ok(message.includes(BUILD_JSON_FLAG), message);
        assert.ok(message.includes("or to the app's deployment target if it is higher"), message);
    });
}

for (const version of ['Xcode 26.4.1\nBuild version 17E202\n', 'Xcode 15.4\nBuild version 15F31d\n']) {
    test(`stays silent on the CocoaPods path with ${version.split('\n')[0]}`, (t) => {
        const warn = stubWarn(t);
        stubXcodeVersion(t, version);
        const root = project(t, { podfile: PODFILE });

        warnInboxUi()(context(root));

        assert.strictEqual(warn.mock.calls.length, 0);
    });
}

test('asks xcodebuild for its version', (t) => {
    stubWarn(t);
    const execFileSync = stubXcodeVersion(t, 'Xcode 27.0\nBuild version 27A266a\n');
    const root = project(t, { podfile: PODFILE });

    warnInboxUi()(context(root));

    assert.strictEqual(execFileSync.mock.calls.length, 1);
    const [command, args] = execFileSync.mock.calls[0].arguments;
    assert.strictEqual(command, 'xcodebuild');
    assert.deepStrictEqual(args, ['-version']);
});

for (const [name, output] of [['xcodebuild fails', null], ['xcodebuild prints no version', 'xcode-select: note: no developer tools were found\n']]) {
    test(`warns once on the CocoaPods path when ${name}`, (t) => {
        const warn = stubWarn(t);
        stubXcodeVersion(t, output);
        const root = project(t, { podfile: PODFILE });

        assert.doesNotThrow(() => warnInboxUi()(context(root)));

        assert.strictEqual(warn.mock.calls.length, 1);
        assert.ok(warn.mock.calls[0].arguments[0].includes(BUILD_FLAG));
    });
}

test('stays silent on the CocoaPods path without the InboxUI pod', (t) => {
    const warn = stubWarn(t);
    stubXcodeVersion(t, 'Xcode 27.0\nBuild version 27A266a\n');
    const root = project(t, { podfile: PODFILE.replace("\tpod 'PushwooshInboxUIXCFramework', '7.0.3'\n", '') });

    warnInboxUi()(context(root));

    assert.strictEqual(warn.mock.calls.length, 0);
});

test('stays silent on the Swift Package Manager path', (t) => {
    const warn = stubWarn(t);
    const execFileSync = stubXcodeVersion(t, 'Xcode 27.0\nBuild version 27A266a\n');
    const root = project(t, { podfile: SPM_PODFILE, spm: {} });

    warnInboxUi()(context(root));

    assert.strictEqual(warn.mock.calls.length, 0);
    assert.strictEqual(execFileSync.mock.calls.length, 0);
});

// Leftover pods on cordova-ios 8 get their own warning at install: rebuilding the platform fixes them, a build flag does not
test('stays silent on the Swift Package Manager path even with a leftover InboxUI pod', (t) => {
    const warn = stubWarn(t);
    stubXcodeVersion(t, 'Xcode 27.0\nBuild version 27A266a\n');
    const root = project(t, { podfile: PODFILE, spm: {} });

    warnInboxUi()(context(root));

    assert.strictEqual(warn.mock.calls.length, 0);
});

test('stays silent and does not throw without an ios platform', (t) => {
    const warn = stubWarn(t);
    stubXcodeVersion(t, 'Xcode 27.0\nBuild version 27A266a\n');
    const root = project(t);

    assert.doesNotThrow(() => warnInboxUi()(context(root)));

    assert.strictEqual(warn.mock.calls.length, 0);
});

test('plugin.xml runs the hook after prepare on ios', () => {
    const pluginXml = fs.readFileSync(path.join(__dirname, '..', '..', 'plugin.xml'), 'utf8');
    const ios = pluginXml.match(/<platform name="ios"[^>]*>[\s\S]*?<\/platform>/);

    assert.ok(ios, 'no ios platform in plugin.xml');
    assert.ok(ios[0].includes(`<hook type="after_prepare" src="${HOOK}" />`), 'hook is not registered for ios');
});
