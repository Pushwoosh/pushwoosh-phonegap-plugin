var path = require("path");
var fs = require("fs");
var utils = require("./utils");
var FSUtils = require("../huawei/FSUtils");

var NEW_LINE = "\n";
var PLUGIN_BUILD_GRADLE_FILE = "libs/android/googleservices-build.gradle";
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

            console.log(pluginGradleContent);
            FSUtils.writeFile(file, pluginGradleContent);
        }
    } else {
        console.log(file + " " + "does not exist");
    }
}

module.exports = function(context) {
    return new Promise(function(resolve, reject) {
        var wwwpath = utils.getWwwPath(context);

        var configPath = path.join(wwwpath, "agconnect-services");

        var prefZipFilename = "agconnect-services";
        var zipFile = getZipFile(configPath, prefZipFilename);

        if (zipFile) {
            updatePluginBuildGradle(PLUGIN_BUILD_GRADLE_FILE);
        }
        return resolve();
    });
};
