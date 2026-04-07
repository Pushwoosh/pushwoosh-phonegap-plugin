#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

module.exports = function (ctx) {
  if (!ctx.opts.platforms.includes('android')) return;

  const projectRoot = ctx.opts.projectRoot;
  // Cordova tracks plugin vars in plugins/fetch.json — reliable source
  const fetchPath = path.join(projectRoot, 'plugins', 'fetch.json');
  if (!fs.existsSync(fetchPath)) return;

  const fetch = JSON.parse(fs.readFileSync(fetchPath, 'utf8'));
  const entry = fetch['pushwoosh-cordova-plugin'];
  const vars = (entry && entry.variables) || {};
  const val = String(vars.PW_VOIP_ANDROID_ENABLED || 'false').toLowerCase();

  const line = `PW_VOIP_ANDROID_ENABLED=${val}\n`;
  const re = /^PW_VOIP_ANDROID_ENABLED=.*$/m;

  // Write to both Cordova and Capacitor gradle.properties
  const gradlePropsPaths = [
    path.join(projectRoot, 'platforms', 'android', 'gradle.properties'), // Cordova
    path.join(projectRoot, 'android', 'gradle.properties'),              // Capacitor
  ];

  gradlePropsPaths.forEach(function (gradleProps) {
    if (!fs.existsSync(path.dirname(gradleProps))) return;

    let contents = fs.existsSync(gradleProps) ? fs.readFileSync(gradleProps, 'utf8') : '';

    if (re.test(contents)) {
      contents = contents.replace(re, line.trim());
    } else {
      if (contents.length && !contents.endsWith('\n')) contents += '\n';
      contents += line;
    }

    fs.writeFileSync(gradleProps, contents, 'utf8');
    console.log(`[pushwoosh-cordova-plugin] Wrote PW_VOIP_ANDROID_ENABLED=${val} to ${gradleProps}`);
  });
};
