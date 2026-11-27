#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const PLUGIN_ID = 'pushwoosh-cordova-plugin';
const SDK_PACKAGE = 'Pushwoosh-XCFramework';
const SDK_PACKAGE_URL = `https://github.com/Pushwoosh/${SDK_PACKAGE}.git`;
// PushwooshInApp shows native in-apps from the server; PushwooshCordovaInbox is the plugin's InboxKit screen.
const PRODUCTS = [
    `.product(name: "PushwooshInApp", package: "${SDK_PACKAGE}")`,
    `.product(name: "PushwooshCordovaInbox", package: "${PLUGIN_ID}")`
];
const PLUGINS_MANIFEST = path.join('platforms', 'ios', 'packages', 'cordova-ios-plugins', 'Package.swift');
const PLUGIN_MANIFEST = path.join('plugins', PLUGIN_ID, 'Package.swift');

// SwiftPM resolves this package and the plugin's own dependency on it to one copy only while both ask for the same version.
function sdkVersionFromManifest(text) {
    const escaped = SDK_PACKAGE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`\\.package\\(url:\\s*"${escaped}",\\s*exact:\\s*"([^"]+)"`).exec(text);
    return match ? match[1] : null;
}

// Rebuilt from scratch every time, so a re-run is a no-op and a new pin replaces the old one.
function withModules(text, version) {
    const ours = (line) => line.includes(SDK_PACKAGE_URL) || PRODUCTS.some((product) => line.includes(product));
    const lines = text.split('\n').filter((line) => !ours(line));
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        lines.pop();
    }
    const next = [
        ...lines,
        `package.dependencies.append(.package(url: "${SDK_PACKAGE_URL}", exact: "${version}"))`,
        ...PRODUCTS.map((product) => `package.targets.first?.dependencies.append(${product})`),
        ''
    ].join('\n');
    return { text: next, changed: next !== text };
}

// The sample installs the plugin with --link, so cordova-ios 8 builds it from the checkout and the plugin's own install
// hook has no copy under platforms/ios/packages to edit: the shared plugins package links what PW_INAPP_IOS_ENABLED
// and PW_INBOX_IOS_ENABLED would link for an app that installs the plugin from npm.
module.exports = function (context) {
    if ((context.opts.platforms || []).indexOf('ios') === -1) {
        return;
    }

    const projectRoot = context.opts.projectRoot;
    const manifestPath = path.join(projectRoot, PLUGINS_MANIFEST);
    const pluginManifestPath = path.join(projectRoot, PLUGIN_MANIFEST);

    if (!fs.existsSync(manifestPath) || !fs.existsSync(pluginManifestPath)) {
        console.log(`[Modules] ${PLUGINS_MANIFEST} or ${PLUGIN_MANIFEST} not found yet, skipping: In-App and Inbox are linked by the next \`cordova prepare ios\` or \`cordova build ios\``);
        return;
    }

    const version = sdkVersionFromManifest(fs.readFileSync(pluginManifestPath, 'utf8'));
    if (!version) {
        throw new Error(`[Modules] No exact ${SDK_PACKAGE} pin in ${PLUGIN_MANIFEST}`);
    }

    const result = withModules(fs.readFileSync(manifestPath, 'utf8'), version);
    if (!result.changed) {
        console.log(`[Modules] In-App and Inbox already linked in ${PLUGINS_MANIFEST}`);
        return;
    }

    fs.writeFileSync(manifestPath, result.text, 'utf8');
    console.log(`[Modules] Linked PushwooshInApp ${version} and PushwooshCordovaInbox in ${PLUGINS_MANIFEST}`);
};
