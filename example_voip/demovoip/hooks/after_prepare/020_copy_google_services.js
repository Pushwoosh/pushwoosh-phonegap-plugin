#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

module.exports = function(context) {
    const platforms = context.opts.platforms;

    if (platforms.indexOf('android') === -1) {
        return;
    }

    const projectRoot = context.opts.projectRoot;
    const sourceFile = path.join(projectRoot, 'google-services.json');
    const targetFile = path.join(projectRoot, 'platforms/android/app/google-services.json');

    if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, targetFile);
        console.log('[Hook] Copied google-services.json to platforms/android/app/');
    } else {
        console.log('[Hook] Warning: google-services.json not found in project root');
    }
};
