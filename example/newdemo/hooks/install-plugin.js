#!/usr/bin/env node

'use strict';

const { execFile } = require('child_process');

// VoIP belongs to the voip sample; here both platforms take the plugin default (off).
const PLUGIN_VARIABLES = [
    'LOG_LEVEL=DEBUG',
    'IOS_FOREGROUND_ALERT_TYPE=NONE',
    'ANDROID_FOREGROUND_PUSH=false'
];

// --link keeps the plugin a symlink: the sample lives inside the plugin it installs.
const PLUGIN_ADD_ARGS = [
    'plugin', 'add', '../../', '--link', '--nosave',
    ...PLUGIN_VARIABLES.flatMap((variable) => ['--variable', variable])
];

// execFile bypasses the shell, and on Windows the cordova/npx entry points are .cmd files.
const CORDOVA_BIN = process.platform === 'win32' ? 'cordova.cmd' : 'cordova';
const NPX_BIN = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function run(file, args, cwd) {
    return new Promise((resolve) => {
        execFile(file, args, { cwd }, (error, stdout, stderr) => {
            resolve({ error, stdout, stderr });
        });
    });
}

function alreadyInstalled(stdout, stderr) {
    return `${stdout || ''}${stderr || ''}`.includes('already installed');
}

function notFound(error) {
    return Boolean(error) && (error.code === 'ENOENT' || error.code === 127);
}

function recoveryMessage(platform, result) {
    return [
        `[Hook] Failed to install pushwoosh-cordova-plugin: ${result.stderr || result.error.message}`,
        `platforms/${platform} is created but carries no plugin. Recover with:`,
        `  cordova platform rm ${platform}`,
        `  cordova platform add ${platform}`
    ].join('\n');
}

module.exports = async function (context) {
    const projectRoot = context.opts.projectRoot;
    const platform = (context.opts.platforms || [])[0];

    console.log(`[Hook] Platform added: ${platform}`);
    console.log('[Hook] Installing pushwoosh-cordova-plugin from the local checkout...');

    let result = await run(CORDOVA_BIN, PLUGIN_ADD_ARGS, projectRoot);

    if (notFound(result.error)) {
        console.log('[Hook] cordova not on PATH, retrying through npx');
        result = await run(NPX_BIN, ['--yes', 'cordova', ...PLUGIN_ADD_ARGS], projectRoot);
    }

    if (result.error) {
        if (alreadyInstalled(result.stdout, result.stderr)) {
            console.log('[Hook] Plugin already installed, skipping');
            return;
        }
        throw new Error(recoveryMessage(platform, result));
    }

    console.log('[Hook] Plugin installed successfully');
    console.log(result.stdout);
};
