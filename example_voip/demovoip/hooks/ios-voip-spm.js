#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const PLUGIN_ID = 'pushwoosh-cordova-plugin';
const SDK_PACKAGE = 'Pushwoosh-XCFramework';
const SDK_PACKAGE_URL = `https://github.com/Pushwoosh/${SDK_PACKAGE}.git`;
const VOIP_PRODUCT = 'PushwooshVoIP';
const PLUGINS_MANIFEST = path.join('platforms', 'ios', 'packages', 'cordova-ios-plugins', 'Package.swift');
const PLUGIN_MANIFEST = path.join('plugins', PLUGIN_ID, 'Package.swift');

// SwiftPM resolves this package and the plugin's own dependency on it to one copy only while both ask for the same version.
function sdkVersionFromManifest(text) {
    const escaped = SDK_PACKAGE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`\\.package\\(url:\\s*"${escaped}",\\s*exact:\\s*"([^"]+)"`).exec(text);
    return match ? match[1] : null;
}

function voipLines(version) {
    return [
        `package.dependencies.append(.package(url: "${SDK_PACKAGE_URL}", exact: "${version}"))`,
        `package.targets.first?.dependencies.append(.product(name: "${VOIP_PRODUCT}", package: "${SDK_PACKAGE}"))`
    ];
}

// Rebuilt from scratch every time, so a re-run is a no-op and a new pin replaces the old one.
function withVoip(text, version) {
    const ours = (line) => line.includes(SDK_PACKAGE_URL) || line.includes(`.product(name: "${VOIP_PRODUCT}"`);
    const lines = text.split('\n').filter((line) => !ours(line));
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        lines.pop();
    }
    const next = [...lines, ...voipLines(version), ''].join('\n');
    return { text: next, changed: next !== text };
}

// The sample installs the plugin with --link, so cordova-ios 8 builds it from the checkout and the plugin's own
// VoIP hook has no copy under platforms/ios/packages to edit; the shared plugins package links PushwooshVoIP instead.
module.exports = function (context) {
    if ((context.opts.platforms || []).indexOf('ios') === -1) {
        return;
    }

    const projectRoot = context.opts.projectRoot;
    const manifestPath = path.join(projectRoot, PLUGINS_MANIFEST);
    const pluginManifestPath = path.join(projectRoot, PLUGIN_MANIFEST);

    if (!fs.existsSync(manifestPath) || !fs.existsSync(pluginManifestPath)) {
        console.log(`[VoIP] ${PLUGINS_MANIFEST} or ${PLUGIN_MANIFEST} not found yet, skipping: ${VOIP_PRODUCT} is linked by the next \`cordova prepare ios\` or \`cordova build ios\``);
        return;
    }

    const version = sdkVersionFromManifest(fs.readFileSync(pluginManifestPath, 'utf8'));
    if (!version) {
        throw new Error(`[VoIP] No exact ${SDK_PACKAGE} pin in ${PLUGIN_MANIFEST}`);
    }

    const result = withVoip(fs.readFileSync(manifestPath, 'utf8'), version);
    if (!result.changed) {
        console.log(`[VoIP] ${VOIP_PRODUCT} already linked in ${PLUGINS_MANIFEST}`);
        return;
    }

    fs.writeFileSync(manifestPath, result.text, 'utf8');
    console.log(`[VoIP] Linked ${VOIP_PRODUCT} ${version} in ${PLUGINS_MANIFEST}`);
};
