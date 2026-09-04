#!/usr/bin/env node

'use strict';

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

// These match the plugin's own defaults today; pinned anyway so a future default change can't silently alter this foreground-call demo.
const PLUGIN_VARIABLES = [
    'LOG_LEVEL=DEBUG',
    'IOS_FOREGROUND_ALERT_TYPE=ALERT',
    'ANDROID_FOREGROUND_PUSH=true'
];

// cordova-lib overwrites fetch.json's variables per platform, not merges: forward both always, or adding the second platform silently disables VoIP on the first.
const VOIP_VARIABLES = ['PW_VOIP_ANDROID_ENABLED=true', 'PW_VOIP_IOS_ENABLED=true'];

const PLATFORM_LABEL = { android: 'Android', ios: 'iOS' };

const PLUGIN_ID = 'pushwoosh-cordova-plugin';
const PLUGIN_PATH = '../../';
const SECOND_WEBVIEW_ID = 'second-webview-plugin';
const SECOND_WEBVIEW_PATH = './second-webview-plugin';

// --nosave keeps package.json free of plugin entries: a re-saved file:../.. breaks the next clean run.
const SECOND_WEBVIEW_ADD_ARGS = ['plugin', 'add', SECOND_WEBVIEW_PATH, '--link', '--nosave'];

// execFile bypasses the shell, and on Windows the cordova/npx/npm entry points are .cmd files.
const CORDOVA_BIN = process.platform === 'win32' ? 'cordova.cmd' : 'cordova';
const NPX_BIN = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const NPM_BIN = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function pluginAddArgs() {
    const variables = [...PLUGIN_VARIABLES, ...VOIP_VARIABLES];

    // --link keeps the plugin a symlink: the sample lives inside the plugin it installs.
    return [
        'plugin', 'add', PLUGIN_PATH, '--link', '--nosave',
        ...variables.flatMap((variable) => ['--variable', variable])
    ];
}

function run(file, args, cwd) {
    return new Promise((resolve) => {
        execFile(file, args, { cwd }, (error, stdout, stderr) => {
            resolve({ error, stdout, stderr });
        });
    });
}

function alreadyInstalled(result) {
    return `${result.stdout || ''}${result.stderr || ''}`.includes('already installed');
}

function notFound(error) {
    return Boolean(error) && (error.code === 'ENOENT' || error.code === 127);
}

async function runCordova(args, cwd) {
    const result = await run(CORDOVA_BIN, args, cwd);

    if (!notFound(result.error)) {
        return result;
    }

    console.log('[Hook] cordova not on PATH, retrying through npx');
    return run(NPX_BIN, ['--yes', 'cordova', ...args], cwd);
}

// The only reliable sign a plugin survived: cordova reads its plugin.xml through this exact path.
function pluginResolves(projectRoot, pluginId) {
    return fs.existsSync(path.join(projectRoot, 'plugins', pluginId, 'plugin.xml'));
}

function recoveryMessage(platform, reason) {
    return [
        `[Hook] Failed to install pushwoosh-cordova-plugin: ${reason}`,
        `platforms/${platform} is created but carries no plugin. Recover with:`,
        `  cordova platform rm ${platform}`,
        `  cordova platform add ${platform}`
    ].join('\n');
}

module.exports = async function (context) {
    const projectRoot = context.opts.projectRoot;
    const platform = (context.opts.platforms || [])[0];

    console.log(`[Hook] Platform added: ${platform}`);

    if (PLATFORM_LABEL[platform]) {
        console.log(`[Hook] Enabling VoIP for ${PLATFORM_LABEL[platform]}`);
    } else {
        console.log('[Hook] Not a VoIP platform, VoIP variables are forwarded anyway');
    }

    console.log('[Hook] Installing pushwoosh-cordova-plugin from the local checkout...');

    const plugin = await runCordova(pluginAddArgs(), projectRoot);

    if (plugin.error) {
        if (!alreadyInstalled(plugin)) {
            throw new Error(recoveryMessage(platform, plugin.stderr || plugin.error.message));
        }
        console.log('[Hook] Plugin already installed, skipping');
    } else {
        console.log('[Hook] Plugin installed successfully');
        console.log(plugin.stdout);
    }

    console.log('[Hook] Installing second-webview-plugin...');

    // The multi-WebView reproducer is not what this sample is for; its failure must not sink the run.
    const second = await runCordova(SECOND_WEBVIEW_ADD_ARGS, projectRoot);

    if (second.error && !alreadyInstalled(second)) {
        console.warn(`[Hook] second-webview-plugin failed, continuing: ${second.stderr || second.error.message}`);
    } else {
        console.log('[Hook] second-webview-plugin ready');
    }

    console.log('[Hook] Restoring npm links for both plugins...');

    // npm's --nosave reify prunes whichever local plugin wasn't named in the last install; naming both here keeps both.
    const relink = await run(NPM_BIN, ['install', PLUGIN_PATH, SECOND_WEBVIEW_PATH, '--no-save'], projectRoot);

    // The relink's own exit code isn't the source of truth - what cordova can actually read back is.
    if (!pluginResolves(projectRoot, PLUGIN_ID)) {
        const reason = relink.error ? (relink.stderr || relink.error.message) : `plugins/${PLUGIN_ID}/plugin.xml does not resolve after the npm relink`;
        throw new Error(recoveryMessage(platform, reason));
    }

    if (!pluginResolves(projectRoot, SECOND_WEBVIEW_ID)) {
        console.warn(`[Hook] second-webview-plugin still does not resolve after the npm relink, continuing`);
    }
};
