const test = require('node:test');
const assert = require('node:assert');
const childProcess = require('node:child_process');

const HOOK_PATH = require.resolve('../install-plugin');
const PROJECT_ROOT = '/project';

const EXPECTED_ARGS = [
    'plugin', 'add', '../../', '--link', '--nosave',
    '--variable', 'LOG_LEVEL=DEBUG',
    '--variable', 'IOS_FOREGROUND_ALERT_TYPE=NONE',
    '--variable', 'ANDROID_FOREGROUND_PUSH=false'
];

function loadHook() {
    delete require.cache[HOOK_PATH];
    return require('../install-plugin');
}

function context(platforms) {
    return { opts: { platforms, projectRoot: PROJECT_ROOT } };
}

function silenceConsole(t) {
    t.mock.method(console, 'log', () => {});
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

function enoent() {
    return Object.assign(new Error('spawn cordova ENOENT'), { code: 'ENOENT' });
}

test('passes the link flags and every plugin variable to cordova', async (t) => {
    silenceConsole(t);
    const execFile = stubExecFile(t, [{ stdout: 'installed' }]);

    await loadHook()(context(['android']));

    assert.strictEqual(execFile.mock.calls.length, 1);
    const [file, args, opts] = execFile.mock.calls[0].arguments;
    assert.match(file, /^cordova(\.cmd)?$/);
    assert.deepStrictEqual(args, EXPECTED_ARGS);
    assert.strictEqual(opts.cwd, PROJECT_ROOT);
});

test('forwards no VoIP variable: the plugin default (off) is what this sample wants', async (t) => {
    silenceConsole(t);
    const execFile = stubExecFile(t, [{ stdout: 'installed' }]);

    await loadHook()(context(['android']));

    const args = execFile.mock.calls[0].arguments[1].join(' ');
    assert.strictEqual(args.includes('PW_VOIP'), false);
});

test('retries through npx when cordova is not on PATH', async (t) => {
    silenceConsole(t);
    const execFile = stubExecFile(t, [{ error: enoent() }, { stdout: 'installed' }]);

    await loadHook()(context(['android']));

    assert.strictEqual(execFile.mock.calls.length, 2);
    const [file, args] = execFile.mock.calls[1].arguments;
    assert.match(file, /^npx(\.cmd)?$/);
    assert.deepStrictEqual(args, ['--yes', 'cordova', ...EXPECTED_ARGS]);
});

test('throws with the recovery commands, naming the platform that is half-ready', async (t) => {
    silenceConsole(t);
    stubExecFile(t, [{ error: new Error('cordova exploded'), stderr: 'boom' }]);

    await assert.rejects(loadHook()(context(['android'])), (e) => {
        assert.match(e.message, /cordova platform rm android/);
        assert.match(e.message, /cordova platform add android/);
        return true;
    });
});

test('an already installed plugin is not a failure', async (t) => {
    silenceConsole(t);
    stubExecFile(t, [{
        error: new Error('exit 1'),
        stdout: 'Plugin "pushwoosh-cordova-plugin" already installed on android.'
    }]);

    await assert.doesNotReject(loadHook()(context(['android'])));
});
