'use strict';

const fs = require('node:fs');
const path = require('node:path');

// xcode and cordova-ios come from `npm install` in newdemo: on a fresh clone the suites that need them skip, not fail.
const DEMO_MODULES = ['xcode', 'cordova-ios/package.json', 'cordova-common'];
const missingModules = DEMO_MODULES.filter((name) => {
    try {
        require.resolve(name);
        return false;
    } catch {
        return true;
    }
});
const demoModulesMissing = missingModules.length > 0 && `${missingModules.join(', ')} not installed: run npm install in newdemo`;

// cordova-ios 8 copies App.xcodeproj as is and only sets the app target's name and bundle id (lib/create.js).
function templatePbxproj({ name = 'newdemo', id = 'org.example.sampleapp' } = {}) {
    const template = path.join(
        path.dirname(require.resolve('cordova-ios/package.json')),
        'templates', 'project', 'App.xcodeproj', 'project.pbxproj'
    );
    const xcode = require('xcode');
    const project = xcode.project(template);
    project.parseSync();
    project.updateBuildProperty('PRODUCT_NAME', `"${name}"`, null, 'App');
    project.updateBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', `"${id}"`, null, 'App');
    return project.writeSync();
}

// The pin line exactly as the plugin's Package.swift carries it.
function pluginManifest(version = '7.3.0') {
    return [
        '// swift-tools-version: 5.9',
        'import PackageDescription',
        'let package = Package(',
        '    name: "pushwoosh-cordova-plugin",',
        '    dependencies: [',
        '        .package(url: "https://github.com/apache/cordova-ios.git", from: "8.0.0"),',
        `        .package(url: "https://github.com/Pushwoosh/Pushwoosh-XCFramework.git", exact: "${version}")`,
        '    ]',
        ')',
        ''
    ].join('\n');
}

module.exports = { templatePbxproj, pluginManifest, demoModulesMissing };
