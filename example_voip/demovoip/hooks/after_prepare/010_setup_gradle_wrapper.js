#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

module.exports = function(context) {
    const platforms = context.opts.platforms;

    if (platforms.indexOf('android') === -1) {
        return;
    }

    const platformRoot = path.join(context.opts.projectRoot, 'platforms/android');
    const wrapperDir = path.join(platformRoot, 'gradle/wrapper');
    const wrapperPropsPath = path.join(wrapperDir, 'gradle-wrapper.properties');

    // Create wrapper directory if it doesn't exist
    if (!fs.existsSync(wrapperDir)) {
        fs.mkdirSync(wrapperDir, { recursive: true });
    }

    // Write gradle-wrapper.properties with Gradle 8.9
    const wrapperContent = `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.9-all.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`;

    fs.writeFileSync(wrapperPropsPath, wrapperContent, 'utf8');
    console.log('[Hook] Created gradle-wrapper.properties with Gradle 8.9');
};
