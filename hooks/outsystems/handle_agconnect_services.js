var path = require("path");
var fs = require("fs");
var AdmZip = require("adm-zip");
var utils = require("./utils");
var FSUtils = require("../huawei/FSUtils");

var ROOT_BUILD_GRADLE_FILE = "platforms/android/build.gradle";
var ROOT_REPOSITORIES_GRADLE_FILE = "platforms/android/repositories.gradle";
var APP_REPOSITORIES_GRADLE_FILE = "platforms/android/app/repositories.gradle";
var COMMENT = "//This line is added by cordova-plugin-hms-push plugin";
var NEW_LINE = "\n";
var APP_BUILD_GRADLE_FILE = "platforms/android/app/build.gradle";
var APPLY_PLUGIN = "apply plugin: 'com.huawei.agconnect'"
var PLUGIN_BUILD_GRADLE_FILE = "plugins/pushwoosh-cordova-plugin/libs/android/googleservices-build.gradle";
var HUAWEI_PUSH_KIT_DEPENDENCY = "implementation \"com.huawei.hms:push:5.3.0.304\""

function getZipFile(resourcesFolder, prefZipFilename) {
    try {
        var dirFiles = fs.readdirSync(resourcesFolder);
        var zipFile;
        dirFiles.forEach(function(file) {
            if (file.match(/\.zip$/)) {
                var filename = path.basename(file, ".zip");
                if (filename === prefZipFilename) {
                    zipFile = path.join(resourcesFolder, file);
                }
            }
        });
        return zipFile;
    } catch (error) {
        return undefined;
    }
}

function unzip(zipFile, unzippedTargetDir, prefZipFilename) {
    var zip = new AdmZip(zipFile);
    var targetDir = path.join(unzippedTargetDir, prefZipFilename);
    zip.extractAllTo(targetDir, true);
    return targetDir;
}

function getServiceFileTargetDir(context) {
    var platformPath = utils.getPlatformPath(context);
    var platform = context.opts.plugin.platform;
    switch (platform) {
        case "android": {
            var platformVersion = utils.getPlatformVersion(context);
            var majorPlatformVersion = platformVersion.split(".")[0];
            if (parseInt(majorPlatformVersion) >= 7) {
                return path.join(platformPath, "app");
            } else {
                return platformPath;
            }
        }
        case "ios":
            return platformPath;
        default:
            return undefined;
    }
}

function copyServiceFile(sourceDir, targetDir, platform) {
    switch (platform) {
        case "android":
            return copyServiceOnAndroid(sourceDir, targetDir);
        case "ios":
            return true;
        default:
            return false;
    }
}

function copyServiceOnAndroid(sourceDir, targetDir) {
    try {
        var sourceFilePath = path.join(sourceDir, "agconnect-services.json");
        var targetFilePath = path.join(targetDir, "agconnect-services.json");
        fs.copyFileSync(sourceFilePath, targetFilePath);
        return true;
    } catch (error) {
        return false;
    }
}

function addAGConnectDependency(lines) {
    var AG_CONNECT_DEPENDENCY = "classpath 'com.huawei.agconnect:agcp:1.5.2.300' " + COMMENT;
    var pattern = /(\s*)classpath(\s+)[\',\"]com.android.tools.build:gradle.*[^\]\n]/m;
    var index;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (pattern.test(line)) {
            index = i;
            break;
        }
    }

    lines.splice(index + 1, 0, AG_CONNECT_DEPENDENCY);
    return lines;
}

function addHuaweiRepo(lines) {
    var HUAWEI_REPO = "maven { url 'https://developer.huawei.com/repo/' } " + COMMENT;
    var pattern = /(\s*)jcenter\(\)/m;
    var indexList = [];

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (pattern.test(line)) {
            indexList.push(i);
        }
    }

    for (var i = 0; i < indexList.length; i++) {
        lines.splice(indexList[i] + 1, 0, HUAWEI_REPO);
        if (i < indexList.length - 1) {
            indexList[i + 1] = indexList[i + 1] + 1;
        }
    }

    return lines;
}

function updateRepositoriesGradle(file) {
    if (FSUtils.exists(file)) {
        var repoGradleContent = FSUtils.readFile(file, "UTF-8");
        if (repoGradleContent.indexOf("developer.huawei.com/repo") === -1) {
            var lastIndexOfCurlyBracket = repoGradleContent.lastIndexOf("}");

            repoGradleContent =
                repoGradleContent.substring(0, lastIndexOfCurlyBracket) +
                "    maven { url 'https://developer.huawei.com/repo/' }\n}" +
                repoGradleContent.substring(lastIndexOfCurlyBracket + 1);

            FSUtils.writeFile(file, repoGradleContent);
        }
    }
}

function updateAppBuildGradle(file) {
    if (FSUtils.exists(file)) {
        var appGradleContent = FSUtils.readFile(file, "UTF-8");
        if (appGradleContent.indexOf(APPLY_PLUGIN) === -1) {
            appGradleContent = appGradleContent + NEW_LINE + APPLY_PLUGIN;

            FSUtils.writeFile(file, appGradleContent);
        }
    }
}

function updatePluginBuildGradle(file) {
    if (FSUtils.exists(file)) {
        var pluginGradleContent = FSUtils.readFile(file, "UTF-8");
        if (pluginGradleContent.indexOf("com.huawei.hms:push") === -1) {
            var dependenciesLastIndex = pluginGradleContent.lastIndexOf("dependencies {");

            pluginGradleContent = 
                pluginGradleContent.substring(0, dependenciesLastIndex + 14) + 
                NEW_LINE + 
                HUAWEI_PUSH_KIT_DEPENDENCY +
                NEW_LINE + 
                pluginGradleContent.substring(dependenciesLastIndex + 15);

            FSUtils.writeFile(file, pluginGradleContent);
        }
    }
}

module.exports = function(context) {
    return new Promise(function(resolve, reject) {
        var wwwpath = utils.getWwwPath(context);

        var configPath = path.join(wwwpath, "agconnect-services");

        var prefZipFilename = "agconnect-services";
        var zipFile = getZipFile(configPath, prefZipFilename);

        if (!zipFile) {
            console.log("agconnect-services.zip not found. Skipping Huawei initialization.");
        }
        var unzipedResourcesDir = unzip(zipFile, configPath, prefZipFilename);
        var platform = context.opts.plugin.platform;
        var targetDir = getServiceFileTargetDir(context);
        var copyWithSuccess = copyServiceFile(
            unzipedResourcesDir,
            targetDir,
            platform
        );

        if (copyWithSuccess) {
            if (!FSUtils.exists(ROOT_BUILD_GRADLE_FILE)) {
                console.log(
                    "root build.gradle file does not exist. Huawei integration cannot be proceeded."
                );
                return resolve();
            }

            if (!FSUtils.exists(APP_BUILD_GRADLE_FILE)) {
                console.log(
                    "app/build.gradle file does not exist. Huawei integration cannot be proceeded."
                );
                return resolve();
            }
        
            var rootGradleContent = FSUtils.readFile(ROOT_BUILD_GRADLE_FILE, "UTF-8");
            var lines = rootGradleContent.split(NEW_LINE);
        
            var depAddedLines = addAGConnectDependency(lines);
            var repoAddedLines = addHuaweiRepo(depAddedLines);
            FSUtils.writeFile(ROOT_BUILD_GRADLE_FILE, repoAddedLines.join(NEW_LINE));
        
            updateRepositoriesGradle(ROOT_REPOSITORIES_GRADLE_FILE);
            updateRepositoriesGradle(APP_REPOSITORIES_GRADLE_FILE);
            updateAppBuildGradle(APP_BUILD_GRADLE_FILE);
            updatePluginBuildGradle(PLUGIN_BUILD_GRADLE_FILE);
        }
        return resolve();
    });
};
