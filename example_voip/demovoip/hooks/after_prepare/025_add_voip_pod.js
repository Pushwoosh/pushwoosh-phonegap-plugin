#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

module.exports = function(context) {
    const platforms = context.opts.platforms;

    if (platforms.indexOf('ios') === -1) {
        return;
    }

    const iosPlatformRoot = path.join(context.opts.projectRoot, 'platforms', 'ios');
    const podfilePath = path.join(iosPlatformRoot, 'Podfile');

    if (!fs.existsSync(podfilePath)) {
        console.log('[Hook] Podfile not found, skipping VoIP pod injection');
        return;
    }

    let podfileContent = fs.readFileSync(podfilePath, 'utf8');

    // Check if PushwooshVoIP already added
    if (podfileContent.includes("pod 'PushwooshVoIP'")) {
        console.log('[Hook] PushwooshVoIP pod already present in Podfile');
        return;
    }

    // Find the target block and add PushwooshVoIP pod
    const targetRegex = /(target\s+'[^']+'\s+do[\s\S]*?pod\s+'Pushwoosh'[^\n]*\n)/;

    if (targetRegex.test(podfileContent)) {
        podfileContent = podfileContent.replace(
            targetRegex,
            "$1  pod 'PushwooshXCFramework/PushwooshVoIP'\n"
        );

        fs.writeFileSync(podfilePath, podfileContent, 'utf8');
        console.log('[Hook] Added PushwooshVoIP pod to Podfile');
    } else {
        console.log('[Hook] Could not find Pushwoosh pod in Podfile, skipping VoIP pod injection');
    }
};
