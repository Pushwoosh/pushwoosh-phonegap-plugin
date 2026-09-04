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
    loadHook
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
