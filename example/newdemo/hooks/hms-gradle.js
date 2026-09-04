'use strict';

const HUAWEI_REPO_LINE = "    maven { url 'https://developer.huawei.com/repo/' }";
const AGCP_CLASSPATH_LINE = '        classpath "com.huawei.agconnect:agcp:1.9.1.301"';

const MAVEN_CENTRAL_ANCHOR = 'mavenCentral()';
const AGP_CLASSPATH_ANCHOR = 'classpath "com.android.tools.build:gradle:';

function insertAfterAnchor(source, patternMatcher, anchor, targetLine) {
    const text = String(source);
    const lines = text.split('\n');

    if (lines.some(l => l.trim() === targetLine.trim())) {
        return { text, changed: false, missingAnchor: null };
    }

    const staleIndex = lines.findIndex((l) => {
        const trimmed = l.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            return false;
        }
        return patternMatcher(l);
    });

    if (staleIndex !== -1) {
        lines[staleIndex] = targetLine;
        return { text: lines.join('\n'), changed: true, missingAnchor: null };
    }

    const anchorIndex = lines.findIndex((l) => l.includes(anchor));
    if (anchorIndex === -1) {
        return { text, changed: false, missingAnchor: anchor };
    }

    lines.splice(anchorIndex + 1, 0, targetLine);
    return { text: lines.join('\n'), changed: true, missingAnchor: null };
}

function addHuaweiRepository(source) {
    const matcher = (line) => line.includes('maven') && line.includes('developer.huawei.com');
    return insertAfterAnchor(source, matcher, MAVEN_CENTRAL_ANCHOR, HUAWEI_REPO_LINE);
}

function addAgconnectClasspath(source) {
    const matcher = (line) => line.includes('com.huawei.agconnect:agcp');
    return insertAfterAnchor(source, matcher, AGP_CLASSPATH_ANCHOR, AGCP_CLASSPATH_LINE);
}

module.exports = {
    HUAWEI_REPO_LINE,
    AGCP_CLASSPATH_LINE,
    addHuaweiRepository,
    addAgconnectClasspath
};
