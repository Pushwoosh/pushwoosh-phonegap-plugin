#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

module.exports = function(context) {
    const platforms = context.opts.platforms;

    if (platforms.indexOf('android') === -1) {
        return;
    }

    const platformRoot = path.join(context.opts.projectRoot, 'platforms/android');
    const configPath = path.join(platformRoot, 'cdv-gradle-config.json');

    if (!fs.existsSync(configPath)) {
        console.log('[Hook] cdv-gradle-config.json not found, skipping AGP fix');
        return;
    }

    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);

        // Fix AGP version to 8.5.1 (compatible with Android Studio)
        if (config.AGP_VERSION !== '8.5.1') {
            config.AGP_VERSION = '8.5.1';
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
            console.log('[Hook] Fixed AGP version to 8.5.1 in cdv-gradle-config.json');
        } else {
            console.log('[Hook] AGP version already correct (8.5.1)');
        }
    } catch (error) {
        console.error('[Hook] Error fixing AGP version:', error.message);
    }
};
