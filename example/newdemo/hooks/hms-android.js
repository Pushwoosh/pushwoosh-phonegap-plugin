#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const { addHuaweiRepository, addAgconnectClasspath } = require('./hms-gradle');

// Own file rather than build-extras.gradle: that one is the app's, and anything else may write it.
const HMS_GRADLE_FILE = 'pushwoosh-hms.gradle';
const BUILD_EXTRAS_FILE = 'build-extras.gradle';
const APPLY_LINE = `apply from: '${HMS_GRADLE_FILE}'`;

const COPIES = [
    ['google-services.json', 'google-services.json'],
    ['agconnect-services.json', 'agconnect-services.json'],
    [path.join('hms', HMS_GRADLE_FILE), HMS_GRADLE_FILE]
];

const PATCHES = [
    ['repositories.gradle', addHuaweiRepository],
    ['build.gradle', addAgconnectClasspath]
];

function copyInto(projectRoot, appDir, source, target, failures) {
    const from = path.join(projectRoot, source);
    const to = path.join(appDir, target);

    if (!fs.existsSync(from)) {
        failures.push(`${source} not found in the project root`);
        return;
    }

    fs.copyFileSync(from, to);
    console.log(`[HMS] Copied ${source} -> platforms/android/app/${target}`);
}

function applyPatch(appDir, fileName, patch, failures) {
    const filePath = path.join(appDir, fileName);

    if (!fs.existsSync(filePath)) {
        failures.push(`${filePath} does not exist`);
        return;
    }

    const result = patch(fs.readFileSync(filePath, 'utf8'));

    if (result.missingAnchor) {
        failures.push(`anchor "${result.missingAnchor}" not found in ${filePath}`);
        return;
    }

    if (!result.changed) {
        console.log(`[HMS] ${fileName} already patched`);
        return;
    }

    fs.writeFileSync(filePath, result.text, 'utf8');
    console.log(`[HMS] Patched platforms/android/app/${fileName}`);
}

function ensureApplyLine(appDir) {
    const filePath = path.join(appDir, BUILD_EXTRAS_FILE);
    const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';

    if (current.split('\n').some((line) => line.trim() === APPLY_LINE)) {
        console.log(`[HMS] ${BUILD_EXTRAS_FILE} already applies ${HMS_GRADLE_FILE}`);
        return;
    }

    const prefix = current && !current.endsWith('\n') ? `${current}\n` : current;
    fs.writeFileSync(filePath, `${prefix}${APPLY_LINE}\n`, 'utf8');
    console.log(`[HMS] Added "${APPLY_LINE}" to platforms/android/app/${BUILD_EXTRAS_FILE}`);
}

module.exports = function (context) {
    const platforms = context.opts.platforms || [];
    if (platforms.indexOf('android') === -1) {
        return;
    }

    const projectRoot = context.opts.projectRoot;
    const appDir = path.join(projectRoot, 'platforms', 'android', 'app');

    if (!fs.existsSync(appDir)) {
        // Platform not prepared yet on this run — nothing to wire, nothing wrong.
        return;
    }

    const failures = [];

    for (const [source, target] of COPIES) {
        copyInto(projectRoot, appDir, source, target, failures);
    }

    // Both patches run even after a failure, so one bad anchor can't hide another.
    for (const [fileName, patch] of PATCHES) {
        applyPatch(appDir, fileName, patch, failures);
    }

    ensureApplyLine(appDir);

    if (failures.length > 0) {
        throw new Error(
            `[HMS] Huawei Push Kit wiring failed — Huawei delivery will silently fall back to FCM:\n${failures
                .map((f) => `  - ${f}`)
                .join('\n')}`
        );
    }
};
