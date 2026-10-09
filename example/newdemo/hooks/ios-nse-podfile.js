'use strict';

const POD_NAME = 'PushwooshXCFramework';
const POD_PIN_RE = /<pod\s+name="PushwooshXCFramework"\s+spec="([^"]+)"/;

function podVersionFromPluginXml(text) {
    const match = POD_PIN_RE.exec(text);
    return match ? match[1] : null;
}

function targetLine(target) {
    return `target '${target}' do`;
}

function withoutTarget(lines, target) {
    const start = lines.findIndex((line) => line.trim() === targetLine(target));
    if (start === -1) {
        return lines;
    }
    let end = lines.findIndex((line, index) => index > start && line.trim() === 'end');
    if (end === -1) {
        end = lines.length - 1;
    }
    return [...lines.slice(0, start), ...lines.slice(end + 1)];
}

function blockLines(target, project, version) {
    return [
        targetLine(target),
        `\tproject '${project}.xcodeproj'`,
        `\tpod '${POD_NAME}', '${version}'`,
        'end'
    ];
}

// Rebuilds the extension block from scratch every time: the output is a pure function of the
// inputs, so idempotency and stale-pin replacement fall out of the same code path.
function addExtensionTarget(text, { target, project, version }) {
    const lines = withoutTarget(text.split('\n'), target);
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        lines.pop();
    }
    const next = [...lines, ...blockLines(target, project, version), ''].join('\n');
    return { text: next, changed: next !== text };
}

module.exports = { POD_NAME, podVersionFromPluginXml, addExtensionTarget };
