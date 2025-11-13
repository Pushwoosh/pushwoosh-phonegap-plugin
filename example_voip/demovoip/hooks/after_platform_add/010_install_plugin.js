#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = function(context) {
    const projectRoot = context.opts.projectRoot;

    const platforms = context.opts.platforms || [];
    const addedPlatform = platforms[0]; // Платформа которую только что добавили

    console.log(`[Hook] Platform added: ${addedPlatform}`);
    console.log('[Hook] Installing pushwoosh-cordova-plugin with VoIP enabled...');

    let voipFlags = '';
    if (addedPlatform === 'ios') {
        voipFlags = '--variable PW_VOIP_IOS_ENABLED=true';
        console.log('[Hook] Enabling VoIP for iOS');
    } else if (addedPlatform === 'android') {
        voipFlags = '--variable PW_VOIP_ANDROID_ENABLED=true';
        console.log('[Hook] Enabling VoIP for Android');
    } else {
        console.log('[Hook] No VoIP flags for this platform');
    }

    const command = `cordova plugin add ../../ --link ${voipFlags}`;

    return new Promise((resolve, reject) => {
        exec(command, { cwd: projectRoot }, (error, stdout, stderr) => {
            if (error) {
                if (stderr.includes('already installed') || stdout.includes('already installed')) {
                    console.log('[Hook] Plugin already installed, skipping');
                    resolve();
                } else {
                    console.error('[Hook] Error installing plugin:', stderr);
                    reject(error);
                }
            } else {
                console.log('[Hook] Plugin installed successfully');
                console.log(stdout);
                resolve();
            }
        });
    });
};
