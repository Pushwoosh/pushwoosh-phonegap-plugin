const test = require('node:test');
const assert = require('node:assert');

const MODULE = require.resolve('../../www/PushNotification.js');

// The module caches nothing across loads, but require does — every case needs its own evaluation.
function loadModule() {
    delete require.cache[MODULE];
    return require(MODULE);
}

// The host decides what is in scope while the module is evaluated: no `window` at all in a node
// or SSR graph, a `window` without `cordova` in a browser or jsdom, both on the cordova path.
function host(t, window) {
    const had = Object.prototype.hasOwnProperty.call(globalThis, 'window');
    const previous = globalThis.window;
    t.after(() => {
        if (had) {
            globalThis.window = previous;
        } else {
            delete globalThis.window;
        }
        delete require.cache[MODULE];
    });

    if (window === undefined) {
        delete globalThis.window;
    } else {
        globalThis.window = window;
    }
}

function recorder() {
    const calls = [];
    const exec = function () {
        calls.push(Array.prototype.slice.call(arguments));
        return 'exec-return-value';
    };
    return { calls, exec };
}

function silenceWarnings(t) {
    return t.mock.method(console, 'warn', () => {});
}

test('evaluates in a node/SSR graph, where `window` does not exist at all', (t) => {
    host(t, undefined);

    let pushwoosh;
    assert.doesNotThrow(() => {
        pushwoosh = loadModule();
    });
    assert.strictEqual(typeof pushwoosh, 'object');
    assert.strictEqual(typeof pushwoosh.onDeviceReady, 'function');
});

test('evaluates in a browser/jsdom graph, where `window` exists without cordova', (t) => {
    host(t, {});

    let pushwoosh;
    assert.doesNotThrow(() => {
        pushwoosh = loadModule();
    });
    assert.strictEqual(typeof pushwoosh, 'object');
    assert.strictEqual(typeof pushwoosh.onDeviceReady, 'function');
});

test('a call without a bridge is a warned no-op, not a throw', (t) => {
    host(t, {});
    const warn = silenceWarnings(t);
    const pushwoosh = loadModule();

    assert.strictEqual(pushwoosh.onDeviceReady({ appid: 'XXXXX-XXXXX' }), undefined);

    assert.strictEqual(warn.mock.calls.length, 1);
    assert.match(warn.mock.calls[0].arguments[0], /Pushwoosh.*cordova\.exec/);
    assert.match(warn.mock.calls[0].arguments[0], /onDeviceReady/);
});

// The timeout is the assert: a callback that never arrives must fail the case, not hang the suite.
test('a call without a bridge still reports to the fail callback, out of the caller frame', { timeout: 5000 }, (t) => {
    host(t, {});
    silenceWarnings(t);
    const pushwoosh = loadModule();

    return new Promise((resolve) => {
        let returned = false;

        pushwoosh.registerDevice(
            () => assert.fail('the success callback must not run without a bridge'),
            (error) => {
                assert.strictEqual(returned, true, 'the fail callback ran inside the caller frame');
                assert.match(error, /Pushwoosh.*registerDevice/);
                resolve();
            }
        );

        returned = true;
    });
});

test('a call without a bridge survives a fail argument that is not a function', (t) => {
    host(t, {});
    silenceWarnings(t);
    const pushwoosh = loadModule();

    assert.doesNotThrow(() => pushwoosh.registerDevice(null, null));
});

test('a call is a no-op when cordova is present but carries no exec', (t) => {
    host(t, { cordova: {} });
    const warn = silenceWarnings(t);
    const pushwoosh = loadModule();

    assert.strictEqual(pushwoosh.setApiToken('token'), undefined);
    assert.strictEqual(warn.mock.calls.length, 1);
});

test('forwards the plugin call to cordova.exec unchanged', (t) => {
    const bridge = recorder();
    host(t, { cordova: { exec: bridge.exec } });
    const config = { appid: 'XXXXX-XXXXX' };

    loadModule().onDeviceReady(config);

    assert.strictEqual(bridge.calls.length, 1);
    assert.deepStrictEqual(bridge.calls[0], [null, null, 'PushNotification', 'onDeviceReady', [config]]);
});

test('returns what cordova.exec returned', (t) => {
    const bridge = recorder();
    host(t, { cordova: { exec: bridge.exec } });

    assert.strictEqual(loadModule().isCommunicationEnabled(() => {}), 'exec-return-value');
});

test('uses a bridge that cordova.js installed after the module was evaluated', (t) => {
    host(t, {});
    const pushwoosh = loadModule();
    const bridge = recorder();

    globalThis.window.cordova = { exec: bridge.exec };
    pushwoosh.setApiToken('token');

    assert.strictEqual(bridge.calls.length, 1);
    assert.deepStrictEqual(bridge.calls[0], [null, null, 'PushNotification', 'setApiToken', ['token']]);
});
