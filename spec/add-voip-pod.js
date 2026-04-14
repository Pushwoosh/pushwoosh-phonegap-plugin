const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

module.exports = function (context) {
    let pwVoipEnabled = context.opts?.cli_variables?.PW_VOIP_IOS_ENABLED;

    if (typeof pwVoipEnabled === 'undefined') {
        try {
            const packageJsonPath = path.join(context.opts.projectRoot, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                pwVoipEnabled =
                    packageJson?.cordova?.plugins?.['pushwoosh-cordova-plugin']?.PW_VOIP_IOS_ENABLED;
            }
        } catch (_) {}
    }

    if (pwVoipEnabled !== 'true') {
        return;
    }

    const iosPlatformPath = path.join(context.opts.projectRoot, 'platforms', 'ios');
    const podfilePath = path.join(iosPlatformPath, 'Podfile');

    if (!fs.existsSync(podfilePath)) {
        return;
    }

    let podfileContent = fs.readFileSync(podfilePath, 'utf8');

    if (!podfileContent.includes('PushwooshXCFramework/PushwooshVoIP')) {
        const lines = podfileContent.split('\n');
        const index = lines.findIndex(line =>
            line.trim().startsWith(`pod 'PushwooshXCFramework'`) &&
            !line.includes(`/`)
        );

        if (index !== -1) {
            // Extract version from existing pod line to avoid version conflicts
            const versionMatch = lines[index].match(/'PushwooshXCFramework',\s*'([^']+)'/);
            const voipPodLine = versionMatch
                ? `\tpod 'PushwooshXCFramework/PushwooshVoIP', '${versionMatch[1]}'`
                : `\tpod 'PushwooshXCFramework/PushwooshVoIP'`;
            lines.splice(index + 1, 0, voipPodLine);
            fs.writeFileSync(podfilePath, lines.join('\n'));

            try {
                execSync('pod install', { cwd: iosPlatformPath, stdio: 'inherit' });
            } catch (_) {}
        }
    }
};
