const test = require('node:test');
const assert = require('node:assert');
const childProcess = require('node:child_process');
const fs = require('node:fs');

const HOOK_PATH = require.resolve('../install-plugin');
const PROJECT_ROOT = '/project';

const BASE_VARIABLES = [
    '--variable', 'LOG_LEVEL=DEBUG',
    '--variable', 'IOS_FOREGROUND_ALERT_TYPE=ALERT',
    '--variable', 'ANDROID_FOREGROUND_PUSH=true'
];

// Both variables on every install regardless of platform - reason at install-plugin.js's VOIP_VARIABLES.
const PLUGIN_ADD_ARGS = [
    'plugin', 'add', '../../', '--link', '--nosave',
    ...BASE_VARIABLES,
    '--variable', 'PW_VOIP_ANDROID_ENABLED=true',
    '--variable', 'PW_VOIP_IOS_ENABLED=true'
];

const SECOND_WEBVIEW_ARGS = ['plugin', 'add', './second-webview-plugin', '--link', '--nosave'];
const RELINK_ARGS = ['install', '../../', './second-webview-plugin', '--no-save'];

function loadHook() {
    delete require.cache[HOOK_PATH];
    return require('../install-plugin');
}

function context(platforms) {
    return { opts: { platforms, projectRoot: PROJECT_ROOT } };
}

function silenceConsole(t) {
    t.mock.method(console, 'log', () => {});
    t.mock.method(console, 'warn', () => {});
    t.mock.method(console, 'error', () => {});
}

// Each answer serves one execFile call, in order; the last one repeats.
function stubExecFile(t, answers) {
    let call = 0;
    return t.mock.method(childProcess, 'execFile', (file, args, opts, cb) => {
        const answer = answers[Math.min(call++, answers.length - 1)];
        cb(answer.error || null, answer.stdout || '', answer.stderr || '');
    });
}

// Controls what pluginResolves() sees; defaults both plugins to "resolved".
function stubResolves(t, { pushwoosh = true, secondWebview = true } = {}) {
    t.mock.method(fs, 'existsSync', (checkedPath) => {
        if (checkedPath.includes('pushwoosh-cordova-plugin') && checkedPath.endsWith('plugin.xml')) return pushwoosh;
        if (checkedPath.includes('second-webview-plugin') && checkedPath.endsWith('plugin.xml')) return secondWebview;
        return false;
    });
}

function enoent() {
    return Object.assign(new Error('spawn cordova ENOENT'), { code: 'ENOENT' });
}

test('passes the link flags and every plugin variable to cordova', async (t) => {
    silenceConsole(t);
    stubResolves(t);
    const execFile = stubExecFile(t, [{ stdout: 'installed' }]);

    await loadHook()(context(['android']));

    const [file, args, opts] = execFile.mock.calls[0].arguments;
    assert.match(file, /^cordova(\.cmd)?$/);
    assert.deepStrictEqual(args, PLUGIN_ADD_ARGS);
    assert.strictEqual(opts.cwd, PROJECT_ROOT);
});

test('forwards both VoIP variables regardless of which platform is being added', async (t) => {
    silenceConsole(t);
    stubResolves(t);

    for (const platform of ['android', 'ios']) {
        const execFile = stubExecFile(t, [{ stdout: 'installed' }]);

        await loadHook()(context([platform]));

        assert.deepStrictEqual(execFile.mock.calls[0].arguments[1], PLUGIN_ADD_ARGS);
        execFile.mock.restore();
    }
});

test('every cordova plugin install carries --nosave, the final npm relink carries --no-save', async (t) => {
    silenceConsole(t);
    stubResolves(t);
    const execFile = stubExecFile(t, [{ stdout: 'installed' }]);

    await loadHook()(context(['android']));

    for (const call of execFile.mock.calls) {
        const [file, args] = call.arguments;
        const flag = file === 'npm' || file === 'npm.cmd' ? '--no-save' : '--nosave';
        assert.ok(args.includes(flag), `missing ${flag} in: ${args.join(' ')}`);
    }
});

test('installs second-webview-plugin after the pushwoosh plugin, then relinks both together', async (t) => {
    silenceConsole(t);
    stubResolves(t);
    const execFile = stubExecFile(t, [{ stdout: 'installed' }]);

    await loadHook()(context(['android']));

    assert.strictEqual(execFile.mock.calls.length, 3);
    assert.deepStrictEqual(execFile.mock.calls[1].arguments[1], SECOND_WEBVIEW_ARGS);

    const [relinkFile, relinkArgs] = execFile.mock.calls[2].arguments;
    assert.match(relinkFile, /^npm(\.cmd)?$/);
    assert.deepStrictEqual(relinkArgs, RELINK_ARGS);
});

test('retries through npx when cordova is not on PATH', async (t) => {
    silenceConsole(t);
    stubResolves(t);
    const execFile = stubExecFile(t, [{ error: enoent() }, { stdout: 'installed' }]);

    await loadHook()(context(['android']));

    const [file, args] = execFile.mock.calls[1].arguments;
    assert.match(file, /^npx(\.cmd)?$/);
    assert.deepStrictEqual(args, ['--yes', 'cordova', ...PLUGIN_ADD_ARGS]);
});

test('throws with the recovery commands, naming the platform that is half-ready', async (t) => {
    silenceConsole(t);
    stubResolves(t);
    stubExecFile(t, [{ error: new Error('cordova exploded'), stderr: 'boom' }]);

    await assert.rejects(loadHook()(context(['android'])), (e) => {
        assert.match(e.message, /cordova platform rm android/);
        assert.match(e.message, /cordova platform add android/);
        return true;
    });
});

test('a failed first install is not masked by anything after it, including the relink', async (t) => {
    silenceConsole(t);
    stubResolves(t);
    const execFile = stubExecFile(t, [
        { error: new Error('cordova exploded'), stderr: 'boom' },
        { stdout: 'second-webview-plugin installed' }
    ]);

    await assert.rejects(loadHook()(context(['android'])));
    assert.strictEqual(execFile.mock.calls.length, 1);
});

test('an already installed plugin is not a failure', async (t) => {
    silenceConsole(t);
    stubResolves(t);
    stubExecFile(t, [{
        error: new Error('exit 1'),
        stdout: 'Plugin "pushwoosh-cordova-plugin" already installed on android.'
    }]);

    await assert.doesNotReject(loadHook()(context(['android'])));
});

test('a failing second-webview-plugin install does not sink the run, and the relink still runs', async (t) => {
    silenceConsole(t);
    stubResolves(t);
    const execFile = stubExecFile(t, [
        { stdout: 'installed' },
        { error: new Error('second exploded'), stderr: 'boom' }
    ]);

    await assert.doesNotReject(loadHook()(context(['android'])));
    assert.strictEqual(execFile.mock.calls.length, 3);
    assert.match(execFile.mock.calls[2].arguments[0], /^npm(\.cmd)?$/);
});

test('a relink that leaves pushwoosh-cordova-plugin unresolved is fatal, with the recovery text', async (t) => {
    silenceConsole(t);
    stubResolves(t, { pushwoosh: false, secondWebview: true });
    stubExecFile(t, [
        { stdout: 'installed' },
        { stdout: 'installed' },
        { error: new Error('relink exploded'), stderr: 'ECONNREFUSED' }
    ]);

    await assert.rejects(loadHook()(context(['android'])), (e) => {
        assert.match(e.message, /cordova platform rm android/);
        assert.match(e.message, /cordova platform add android/);
        return true;
    });
});

test('a relink that leaves second-webview-plugin unresolved stays a warning', async (t) => {
    silenceConsole(t);
    stubResolves(t, { pushwoosh: true, secondWebview: false });
    stubExecFile(t, [{ stdout: 'installed' }]);

    await assert.doesNotReject(loadHook()(context(['android'])));
});

test('a relink that reports success but leaves pushwoosh-cordova-plugin unresolved is still fatal', async (t) => {
    silenceConsole(t);
    stubResolves(t, { pushwoosh: false });
    stubExecFile(t, [{ stdout: 'installed' }]);

    await assert.rejects(loadHook()(context(['android'])), (e) => {
        assert.match(e.message, /does not resolve after the npm relink/);
        assert.match(e.message, /cordova platform rm android/);
        return true;
    });
});
