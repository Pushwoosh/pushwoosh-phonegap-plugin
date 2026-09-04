const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const hmsGradleLib = require('../hms-gradle');

const HOOK_PATH = require.resolve('../hms-android');
const PROJECT_ROOT = '/project';

// require() itself relies on the real fs internally, so the hook must be (re)required
// with the real fs still in place; only then is fs.* safe to mock for the call itself.
function loadHook() {
    delete require.cache[HOOK_PATH];
    return require('../hms-android');
}

function context(platforms) {
    return { opts: { platforms, projectRoot: PROJECT_ROOT } };
}

function stubFsAllGood(t) {
    t.mock.method(fs, 'existsSync', () => true);
    t.mock.method(fs, 'copyFileSync', () => {});
    t.mock.method(fs, 'readFileSync', () => '');
    t.mock.method(fs, 'writeFileSync', () => {});
}

test('returns without touching fs when android is not among the prepared platforms', (t) => {
    const hook = loadHook();

    t.mock.method(fs, 'existsSync', () => {
        throw new Error('existsSync should not be called for a non-android prepare');
    });

    assert.doesNotThrow(() => hook(context(['ios'])));
});

test('returns quietly when platforms/android/app does not exist yet', (t) => {
    const hook = loadHook();

    t.mock.method(fs, 'existsSync', () => false);
    const copyFileSync = t.mock.method(fs, 'copyFileSync', () => {});
    const writeFileSync = t.mock.method(fs, 'writeFileSync', () => {});

    assert.doesNotThrow(() => hook(context(['android'])));
    assert.strictEqual(copyFileSync.mock.calls.length, 0);
    assert.strictEqual(writeFileSync.mock.calls.length, 0);
});

test('throws naming the missing source file when a tracked source is absent', (t) => {
    t.mock.method(hmsGradleLib, 'addHuaweiRepository', () => ({ text: '', changed: false, missingAnchor: null }));
    t.mock.method(hmsGradleLib, 'addAgconnectClasspath', () => ({ text: '', changed: false, missingAnchor: null }));

    const hook = loadHook();

    const googleServices = path.join(PROJECT_ROOT, 'google-services.json');
    t.mock.method(fs, 'existsSync', (p) => p !== googleServices);
    t.mock.method(fs, 'copyFileSync', () => {});
    t.mock.method(fs, 'readFileSync', () => '');
    t.mock.method(fs, 'writeFileSync', () => {});

    assert.throws(() => hook(context(['android'])), /google-services\.json/);
});

test('a missing anchor in one patch still lets the other patch be attempted, then throws', (t) => {
    const repoPatch = t.mock.method(hmsGradleLib, 'addHuaweiRepository', () => ({
        text: '',
        changed: false,
        missingAnchor: 'mavenCentral()'
    }));
    const classpathPatch = t.mock.method(hmsGradleLib, 'addAgconnectClasspath', () => ({
        text: 'patched-build-gradle',
        changed: true,
        missingAnchor: null
    }));

    const hook = loadHook();

    stubFsAllGood(t);
    const writeFileSync = fs.writeFileSync;

    assert.throws(() => hook(context(['android'])), /mavenCentral\(\)/);
    // The failing repositories.gradle patch must not have short-circuited build.gradle's.
    assert.strictEqual(repoPatch.mock.calls.length, 1);
    assert.strictEqual(classpathPatch.mock.calls.length, 1);
    assert.strictEqual(writeFileSync.mock.calls.length, 2);
    assert.strictEqual(writeFileSync.mock.calls[0].arguments[1], 'patched-build-gradle');
});

test('the all-good path applies both patches and does not throw', (t) => {
    t.mock.method(hmsGradleLib, 'addHuaweiRepository', () => ({
        text: 'patched-repositories',
        changed: true,
        missingAnchor: null
    }));
    t.mock.method(hmsGradleLib, 'addAgconnectClasspath', () => ({
        text: 'patched-build-gradle',
        changed: true,
        missingAnchor: null
    }));

    const hook = loadHook();

    stubFsAllGood(t);
    const copyFileSync = fs.copyFileSync;
    const writeFileSync = fs.writeFileSync;

    assert.doesNotThrow(() => hook(context(['android'])));
    assert.strictEqual(copyFileSync.mock.calls.length, 3);
    assert.strictEqual(writeFileSync.mock.calls.length, 3);
    const applyWrite = writeFileSync.mock.calls[2].arguments;
    assert.match(String(applyWrite[0]), /build-extras\.gradle$/);
    assert.match(String(applyWrite[1]), /apply from: 'pushwoosh-hms\.gradle'/);
});

test('build-extras.gradle keeps its own content and is applied only once', (t) => {
    t.mock.method(hmsGradleLib, 'addHuaweiRepository', () => ({ text: 'r', changed: true, missingAnchor: null }));
    t.mock.method(hmsGradleLib, 'addAgconnectClasspath', () => ({ text: 'b', changed: true, missingAnchor: null }));

    const hook = loadHook();

    t.mock.method(fs, 'existsSync', () => true);
    t.mock.method(fs, 'copyFileSync', () => {});
    t.mock.method(fs, 'readFileSync', (p) => (String(p).endsWith('build-extras.gradle')
        ? "apply plugin: 'com.example.mine'\napply from: 'pushwoosh-hms.gradle'\n"
        : ''));
    const writeFileSync = t.mock.method(fs, 'writeFileSync', () => {});

    assert.doesNotThrow(() => hook(context(['android'])));
    assert.strictEqual(writeFileSync.mock.calls.length, 2);
});
