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

    // Read plugin preferences from config.xml and pass as --variable flags
    // (Cordova doesn't always pick up config.xml preferences automatically)
    const pluginVariables = ['LOG_LEVEL', 'ANDROID_FOREGROUND_PUSH', 'IOS_FOREGROUND_ALERT_TYPE'];
    let extraFlags = '';
    try {
        const configXml = fs.readFileSync(path.join(projectRoot, 'config.xml'), 'utf8');
        for (const varName of pluginVariables) {
            const match = configXml.match(new RegExp(`<preference\\s+name=["']${varName}["']\\s+value=["']([^"']+)["']`, 'i'));
            if (match) {
                extraFlags += ` --variable ${varName}=${match[1]}`;
                console.log(`[Hook] Forwarding preference ${varName}=${match[1]}`);
            }
        }
    } catch (e) {
        console.warn('[Hook] Could not read config.xml preferences:', e.message);
    }

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

    const command = `cordova plugin add ../../ --link ${voipFlags}${extraFlags}`;

    return new Promise((resolve, reject) => {
        exec(command, { cwd: projectRoot }, (error, stdout, stderr) => {
            if (error) {
                if (stderr.includes('already installed') || stdout.includes('already installed')) {
                    console.log('[Hook] Plugin already installed, skipping');
                } else {
                    console.error('[Hook] Error installing plugin:', stderr);
                    reject(error);
                    return;
                }
            } else {
                console.log('[Hook] Plugin installed successfully');
                console.log(stdout);
            }

            // Install second-webview-plugin for bug reproducer
            const secondWebViewCmd = `cordova plugin add ./second-webview-plugin --link`;
            console.log('[Hook] Installing second-webview-plugin...');
            exec(secondWebViewCmd, { cwd: projectRoot }, (err2, stdout2, stderr2) => {
                if (err2) {
                    if ((stderr2 && stderr2.includes('already installed')) || (stdout2 && stdout2.includes('already installed'))) {
                        console.log('[Hook] second-webview-plugin already installed, skipping');
                    } else {
                        console.error('[Hook] Error installing second-webview-plugin:', stderr2);
                        // Non-fatal: don't reject, just warn
                    }
                } else {
                    console.log('[Hook] second-webview-plugin installed successfully');
                    console.log(stdout2);
                }
                resolve();
            });
        });
    });
};
