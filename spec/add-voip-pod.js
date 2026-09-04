#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const PLUGIN_ID = 'pushwoosh-cordova-plugin';
const SUBSPEC = 'PushwooshXCFramework/PushwooshVoIP';

/**
 * after_plugin_install (ios): links the optional PushwooshVoIP subspec into the project
 * Podfile when the plugin was installed with PW_VOIP_IOS_ENABLED=true, pinning it to the
 * version already used by the base PushwooshXCFramework pod.
 */
module.exports = function (ctx) {
  const projectRoot = ctx.opts.projectRoot;

  // Cordova tracks plugin vars in plugins/fetch.json — the only source populated this early
  const fetchPath = path.join(projectRoot, 'plugins', 'fetch.json');
  if (!fs.existsSync(fetchPath)) return;

  let vars;
  try {
    const fetched = JSON.parse(fs.readFileSync(fetchPath, 'utf8'));
    const entry = fetched[PLUGIN_ID];
    vars = (entry && entry.variables) || {};
  } catch (_) {
    return;
  }

  if (String(vars.PW_VOIP_IOS_ENABLED || 'false').toLowerCase() !== 'true') return;

  const iosPlatformPath = path.join(projectRoot, 'platforms', 'ios');
  const podfilePath = path.join(iosPlatformPath, 'Podfile');
  if (!fs.existsSync(podfilePath)) return;

  const lines = fs.readFileSync(podfilePath, 'utf8').split('\n');
  if (lines.some(line => line.includes(SUBSPEC))) return;

  const index = lines.findIndex(line =>
    line.trim().startsWith(`pod 'PushwooshXCFramework'`) && !line.includes('/')
  );
  if (index === -1) return;

  const versionMatch = lines[index].match(/'PushwooshXCFramework',\s*'([^']+)'/);
  const voipPodLine = versionMatch
    ? `\tpod '${SUBSPEC}', '${versionMatch[1]}'`
    : `\tpod '${SUBSPEC}'`;

  lines.splice(index + 1, 0, voipPodLine);
  fs.writeFileSync(podfilePath, lines.join('\n'), 'utf8');
  console.log(`[${PLUGIN_ID}] Added ${SUBSPEC} to platforms/ios/Podfile`);

  try {
    childProcess.execSync('pod install', { cwd: iosPlatformPath, stdio: 'inherit' });
  } catch (_) {}
};
