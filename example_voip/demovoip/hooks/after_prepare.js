#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

module.exports = function(context) {
    const platforms = context.opts.platforms;

    if (platforms.indexOf('android') !== -1) {
        const androidPlatformRoot = path.join(context.opts.projectRoot, 'platforms', 'android');
        const localPropertiesPath = path.join(androidPlatformRoot, 'local.properties');

        // Android SDK path - adjust if needed
        const sdkPath = process.env.ANDROID_HOME ||
                       process.env.ANDROID_SDK_ROOT ||
                       path.join(process.env.HOME, 'Library', 'Android', 'sdk');

        const content = `## This file must *NOT* be checked into Version Control Systems,
# as it contains information specific to your local configuration.
#
# Location of the SDK. This is only used by Gradle.
sdk.dir=${sdkPath}
`;

        fs.writeFileSync(localPropertiesPath, content, 'utf8');
        console.log('[Hook] Created local.properties with sdk.dir=' + sdkPath);
    }
};
