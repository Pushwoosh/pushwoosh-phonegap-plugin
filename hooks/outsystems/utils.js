var path = require("path");
var fs = require("fs");
/**
 * Get the platform version for the current execution
 * @param {object} context
 * @returns {string} platform version
 */
function getPlatformVersion(context) {
    var projectRoot = context.opts.projectRoot;
    var platformsJsonFile = path.join(
        projectRoot,
        "platforms",
        "platforms.json"
    );
    var platforms = require(platformsJsonFile);
    var platform = context.opts.plugin.platform;
    return platforms[platform];
}

function rmNonEmptyDir(dir_path) {
    if (fs.existsSync(dir_path)) {
        fs.readdirSync(dir_path).forEach(function(entry) {
            var entry_path = path.join(dir_path, entry);
            if (fs.lstatSync(entry_path).isDirectory()) {
                rmNonEmptyDir(entry_path);
            } else {
                fs.unlinkSync(entry_path);
            }
        });
        fs.rmdirSync(dir_path);
    }
}


/**
 * Get the full path to the platform directory
 * @param {object} context Cordova context
 * @returns {string} absolute path to platforms directory
 */
function getPlatformPath(context) {
    var projectRoot = context.opts.projectRoot;
    var platform = context.opts.plugin.platform;
    return path.join(projectRoot, "platforms", platform);
}

/**
 * Get absolute path to the www folder inside the platform
 * and not the root www folder from the cordova project.
 * Example:
 *     - Android: project_foo/platforms/android/app/src/main/assets/www
 *     - iOS: project_foo/platforms/ios/www
 * @param {string} platform
 */
function getWwwPath(context) {
    var platformPath = getPlatformPath(context);
    var platform = context.opts.plugin.platform;
    var wwwfolder;
    if (platform === "android") {
        var platformVersion = getPlatformVersion(context);
        if (platformVersion >= "7") {
            wwwfolder = "app/src/main/assets/www";
        } else {
            wwwfolder = "assets/www";
        }
    } else if (platform === "ios") {
        wwwfolder = "www";
    }
    return path.join(platformPath, wwwfolder);
}


module.exports = {
    getPlatformVersion: getPlatformVersion,
    rmNonEmptyDir: rmNonEmptyDir,
    getPlatformPath: getPlatformPath,
    getWwwPath: getWwwPath,
};