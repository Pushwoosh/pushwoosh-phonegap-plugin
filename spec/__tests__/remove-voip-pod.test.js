const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

const {
    PODFILE,
    VOIP_LINE,
    podfileWith,
    project,
    readPodfile,
    stubExecSync,
    silenceConsole,
    context,
    loadHook
} = require('./helpers');

function removeVoipPod() {
    return loadHook('remove-voip-pod');
}

test('drops the VoIP subspec and keeps the base pod for cordova to remove', (t) => {
    silenceConsole(t);
    stubExecSync(t);
    const root = project(t, { podfile: podfileWith(VOIP_LINE) });

    removeVoipPod()(context(root));

    const podfile = readPodfile(root);
    assert.strictEqual(podfile, PODFILE);
    assert.ok(podfile.includes("pod 'PushwooshXCFramework', '7.2.4'"));
});

test('leaves the ios Podfile alone when another platform is being uninstalled', (t) => {
    silenceConsole(t);
    stubExecSync(t);
    const withVoip = podfileWith(VOIP_LINE);
    const root = project(t, { podfile: withVoip });
    const write = t.mock.method(fs, 'writeFileSync');

    removeVoipPod()({ opts: { projectRoot: root, platforms: ['android'] } });

    assert.strictEqual(readPodfile(root), withVoip);
    assert.strictEqual(write.mock.calls.length, 0);
});

test('drops the subspec when ios is one of several platforms being uninstalled', (t) => {
    silenceConsole(t);
    stubExecSync(t);
    const root = project(t, { podfile: podfileWith(VOIP_LINE) });

    removeVoipPod()({ opts: { projectRoot: root, platforms: ['android', 'ios'] } });

    assert.strictEqual(readPodfile(root), PODFILE);
});

test('never runs pod install: cordova does that after removing the base pod', (t) => {
    silenceConsole(t);
    const execSync = stubExecSync(t);
    const root = project(t, { podfile: podfileWith(VOIP_LINE) });

    removeVoipPod()(context(root));

    assert.strictEqual(execSync.mock.calls.length, 0);
});

test('leaves a Podfile without the subspec byte-identical and unwritten', (t) => {
    silenceConsole(t);
    stubExecSync(t);
    const root = project(t, { podfile: PODFILE });
    const write = t.mock.method(fs, 'writeFileSync');

    removeVoipPod()(context(root));

    assert.strictEqual(readPodfile(root), PODFILE);
    assert.strictEqual(write.mock.calls.length, 0);
});

test('does not throw when there is no Podfile', (t) => {
    silenceConsole(t);
    const execSync = stubExecSync(t);
    const root = project(t, {});

    assert.doesNotThrow(() => removeVoipPod()(context(root)));
    assert.strictEqual(execSync.mock.calls.length, 0);
});

test('does not throw when the uninstall options carry no platform list', (t) => {
    silenceConsole(t);
    stubExecSync(t);
    const root = project(t, { podfile: podfileWith(VOIP_LINE) });

    assert.doesNotThrow(() => removeVoipPod()({ opts: { projectRoot: root } }));
    assert.strictEqual(readPodfile(root), PODFILE);
});

test('removes the subspec when it is the only pod in the target', (t) => {
    silenceConsole(t);
    stubExecSync(t);
    const podfile = [
        "target 'HelloCordova' do",
        VOIP_LINE,
        'end',
        ''
    ].join('\n');
    const root = project(t, { podfile });

    removeVoipPod()(context(root));

    assert.strictEqual(readPodfile(root), "target 'HelloCordova' do\nend\n");
});
