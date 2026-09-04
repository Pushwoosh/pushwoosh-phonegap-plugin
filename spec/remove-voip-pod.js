#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const PLUGIN_ID = 'pushwoosh-cordova-plugin';
const SUBSPEC = 'PushwooshXCFramework/PushwooshVoIP';

/**
 * before_plugin_uninstall (ios): drops the PushwooshVoIP subspec line that add-voip-pod.js
 * spliced into the Podfile. Cordova cannot do it itself — removePodSpecs only knows pods
 * declared in <podspec>, and this one is conditional on a variable. Cordova removes the base
 * pod and runs `pod install` right after this hook, so no `pod install` here.
 */
module.exports = function (ctx) {
  const opts = (ctx && ctx.opts) || {};
  if (!opts.projectRoot) return;
  if (Array.isArray(opts.platforms) && !opts.platforms.includes('ios')) return;

  // An absent platforms list must not abort the cleanup: a leftover subspec keeps the framework linked
  const podfilePath = path.join(opts.projectRoot, 'platforms', 'ios', 'Podfile');
  if (!fs.existsSync(podfilePath)) return;

  const lines = fs.readFileSync(podfilePath, 'utf8').split('\n');
  const kept = lines.filter(line => !line.includes(SUBSPEC));
  if (kept.length === lines.length) return;

  fs.writeFileSync(podfilePath, kept.join('\n'), 'utf8');
  console.log(`[${PLUGIN_ID}] Removed ${SUBSPEC} from platforms/ios/Podfile`);
};
