const test = require('node:test');
const assert = require('node:assert');

const {
    HUAWEI_REPO_LINE,
    AGCP_CLASSPATH_LINE,
    addHuaweiRepository,
    addAgconnectClasspath
} = require('../hms-gradle');

const REPOSITORIES_GRADLE = [
    '/*',
    '    Licensed to the Apache Software Foundation (ASF) under one',
    '*/',
    '',
    'ext.repos = {',
    '    google()',
    '    mavenCentral()',
    '}',
    ''
].join('\n');

const BUILD_GRADLE = [
    "apply plugin: 'com.android.application'",
    '',
    'buildscript {',
    "    apply from: '../CordovaLib/cordova.gradle'",
    '',
    "    apply from: 'repositories.gradle'",
    '    repositories repos',
    '',
    '    dependencies {',
    '        classpath "com.android.tools.build:gradle:${cordovaConfig.AGP_VERSION}"',
    '',
    '        if (cordovaConfig.IS_GRADLE_PLUGIN_KOTLIN_ENABLED) {',
    '            classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:${cordovaConfig.KOTLIN_VERSION}"',
    '        }',
    '    }',
    '}',
    ''
].join('\n');

test('HUAWEI_REPO_LINE and AGCP_CLASSPATH_LINE carry the verified coordinates', () => {
    assert.strictEqual(HUAWEI_REPO_LINE.includes("https://developer.huawei.com/repo/"), true);
    assert.strictEqual(AGCP_CLASSPATH_LINE.includes('com.huawei.agconnect:agcp:1.9.1.301'), true);
});

test('addHuaweiRepository inserts the maven block right after mavenCentral()', () => {
    const result = addHuaweiRepository(REPOSITORIES_GRADLE);
    assert.strictEqual(result.changed, true);
    assert.strictEqual(result.missingAnchor, null);

    const lines = result.text.split('\n');
    const centralIndex = lines.findIndex((l) => l.includes('mavenCentral()'));
    assert.strictEqual(lines[centralIndex + 1], HUAWEI_REPO_LINE);
});

test('addHuaweiRepository is idempotent', () => {
    const once = addHuaweiRepository(REPOSITORIES_GRADLE);
    const twice = addHuaweiRepository(once.text);
    assert.strictEqual(twice.changed, false);
    assert.strictEqual(twice.missingAnchor, null);
    assert.strictEqual(twice.text, once.text);
});

test('addHuaweiRepository reports a missing anchor instead of guessing', () => {
    const result = addHuaweiRepository('ext.repos = {\n    google()\n}\n');
    assert.strictEqual(result.changed, false);
    assert.strictEqual(result.missingAnchor, 'mavenCentral()');
    assert.strictEqual(result.text, 'ext.repos = {\n    google()\n}\n');
});

test('addAgconnectClasspath inserts the classpath right after the AGP classpath', () => {
    const result = addAgconnectClasspath(BUILD_GRADLE);
    assert.strictEqual(result.changed, true);
    assert.strictEqual(result.missingAnchor, null);

    const lines = result.text.split('\n');
    const agpIndex = lines.findIndex((l) => l.includes('com.android.tools.build:gradle:'));
    assert.strictEqual(lines[agpIndex + 1], AGCP_CLASSPATH_LINE);
});

test('addAgconnectClasspath is idempotent', () => {
    const once = addAgconnectClasspath(BUILD_GRADLE);
    const twice = addAgconnectClasspath(once.text);
    assert.strictEqual(twice.changed, false);
    assert.strictEqual(twice.missingAnchor, null);
    assert.strictEqual(twice.text, once.text);
});

test('addAgconnectClasspath reports a missing anchor instead of guessing', () => {
    const result = addAgconnectClasspath('buildscript {\n    dependencies {\n    }\n}\n');
    assert.strictEqual(result.changed, false);
    assert.strictEqual(result.missingAnchor, 'classpath "com.android.tools.build:gradle:');
});

test('addHuaweiRepository replaces stale Huawei maven repository version', () => {
    const staleRepos = [
        'ext.repos = {',
        '    google()',
        '    mavenCentral()',
        "    maven { url 'http://developer.huawei.com/repo/' }",
        '}'
    ].join('\n');
    const result = addHuaweiRepository(staleRepos);
    assert.strictEqual(result.changed, true);
    assert.strictEqual(result.missingAnchor, null);
    const lines = result.text.split('\n');
    const centralIndex = lines.findIndex((l) => l.includes('mavenCentral()'));
    assert.strictEqual(lines[centralIndex + 1], HUAWEI_REPO_LINE);
});

test('addHuaweiRepository ignores URL in comments', () => {
    const withComment = [
        'ext.repos = {',
        '    google()',
        '    mavenCentral()',
        '    // TODO: add mirror of developer.huawei.com',
        '}'
    ].join('\n');
    const result = addHuaweiRepository(withComment);
    assert.strictEqual(result.changed, true);
    assert.strictEqual(result.missingAnchor, null);
    const lines = result.text.split('\n');
    const centralIndex = lines.findIndex((l) => l.includes('mavenCentral()'));
    assert.strictEqual(lines[centralIndex + 1], HUAWEI_REPO_LINE);
});

test('addAgconnectClasspath replaces stale HMS agconnect version', () => {
    const staleBuild = [
        'buildscript {',
        '    dependencies {',
        '        classpath "com.android.tools.build:gradle:${cordovaConfig.AGP_VERSION}"',
        '        classpath "com.huawei.agconnect:agcp:1.9.0.301"',
        '    }',
        '}'
    ].join('\n');
    const result = addAgconnectClasspath(staleBuild);
    assert.strictEqual(result.changed, true);
    assert.strictEqual(result.missingAnchor, null);
    const lines = result.text.split('\n');
    const agpIndex = lines.findIndex((l) => l.includes('com.android.tools.build:gradle:'));
    assert.strictEqual(lines[agpIndex + 1], AGCP_CLASSPATH_LINE);
});

test('addAgconnectClasspath ignores version in comments', () => {
    const withComment = [
        'buildscript {',
        '    dependencies {',
        '        classpath "com.android.tools.build:gradle:${cordovaConfig.AGP_VERSION}"',
        '        // classpath "com.huawei.agconnect:agcp:1.8.0.300"',
        '    }',
        '}'
    ].join('\n');
    const result = addAgconnectClasspath(withComment);
    assert.strictEqual(result.changed, true);
    assert.strictEqual(result.missingAnchor, null);
    const lines = result.text.split('\n');
    const agpIndex = lines.findIndex((l) => l.includes('com.android.tools.build:gradle:'));
    assert.strictEqual(lines[agpIndex + 1], AGCP_CLASSPATH_LINE);
});
