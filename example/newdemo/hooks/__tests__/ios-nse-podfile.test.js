const test = require('node:test');
const assert = require('node:assert');

const { PODFILE } = require('./pbxproj-fixture');
const { POD_NAME, podVersionFromPluginXml, addExtensionTarget } = require('../ios-nse-podfile');

const PLUGIN_XML = [
    '<podspec>',
    '    <pods use-frameworks="true">',
    '        <pod name="PushwooshXCFramework" spec="7.2.8" nospm="true" />',
    '        <pod name="PushwooshInboxUIXCFramework" spec="7.0.42" nospm="true" />',
    '    </pods>',
    '</podspec>'
].join('\n');

const OPTIONS = { target: 'NotificationService', project: 'newdemo', version: '7.2.8' };

const BLOCK = [
    "target 'NotificationService' do",
    "\tproject 'newdemo.xcodeproj'",
    "\tpod 'PushwooshXCFramework', '7.2.8'",
    'end',
    ''
].join('\n');

function count(text, needle) {
    return text.split(needle).length - 1;
}

test('podVersionFromPluginXml reads the PushwooshXCFramework pin, not the InboxUI one', () => {
    assert.strictEqual(podVersionFromPluginXml(PLUGIN_XML), '7.2.8');
});

test('podVersionFromPluginXml returns null when the pin is absent', () => {
    assert.strictEqual(podVersionFromPluginXml('<plugin></plugin>'), null);
});

test('appends the extension block after the app target with the plugin pin', () => {
    const result = addExtensionTarget(PODFILE, OPTIONS);
    assert.strictEqual(result.changed, true);
    assert.strictEqual(result.text, `${PODFILE}${BLOCK}`);
});

test('the extension pod line is byte-identical to the app target pod line', () => {
    // cordova-ios folds pod lines by name on rewrite; an identical line folds into the existing entry.
    const result = addExtensionTarget(PODFILE, OPTIONS);
    assert.strictEqual(count(result.text, `\tpod '${POD_NAME}', '7.2.8'`), 2);
});

test('is idempotent', () => {
    const once = addExtensionTarget(PODFILE, OPTIONS);
    const twice = addExtensionTarget(once.text, OPTIONS);
    assert.strictEqual(twice.changed, false);
    assert.strictEqual(twice.text, once.text);
});

test('replaces a block carrying a stale pin', () => {
    const stale = addExtensionTarget(PODFILE, { ...OPTIONS, version: '7.2.7' }).text;
    const result = addExtensionTarget(stale, OPTIONS);
    assert.strictEqual(result.changed, true);
    assert.strictEqual(count(result.text, "target 'NotificationService' do"), 1);
    assert.strictEqual(count(result.text, "'7.2.7'"), 0);
    assert.strictEqual(result.text, `${PODFILE}${BLOCK}`);
});

test('a Podfile without a trailing newline still gets the block on its own line', () => {
    const result = addExtensionTarget(PODFILE.trimEnd(), OPTIONS);
    assert.strictEqual(result.text, `${PODFILE}${BLOCK}`);
});

test('leaves the app target block untouched', () => {
    const result = addExtensionTarget(PODFILE, OPTIONS);
    assert.strictEqual(result.text.startsWith(PODFILE), true);
});
