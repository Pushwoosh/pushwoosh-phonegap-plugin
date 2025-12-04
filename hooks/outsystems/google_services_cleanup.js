var path = require("path");
var utils = require("./utils");

var TAG = "[google_services_cleanup.js]";

module.exports = function(context) {
    console.log(TAG, "Hook started");
    console.log(TAG, "Platform:", context.opts.plugin.platform);

    return new Promise(function(resolve, reject) {
        var wwwpath = utils.getWwwPath(context);
        console.log(TAG, "WWW path:", wwwpath);

        var configPath = path.join(wwwpath, "google-services");
        console.log(TAG, "Cleaning up:", configPath);

        // clean up google-services folder from source directory in project
        utils.rmNonEmptyDir(configPath);

        console.log(TAG, "Hook completed successfully");
        return resolve();
    });
};
