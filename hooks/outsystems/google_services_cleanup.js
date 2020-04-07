var path = require("path");
var utils = require("./utils");
module.exports = function(context) {
    return new Promise(function(resolve, reject) {
        var wwwpath = utils.getWwwPath(context);
        var configPath = path.join(wwwpath, "google-services");
        console.log("Cleaning up ", configPath);
        // clean up google-services folder from source directory in project
        utils.rmNonEmptyDir(configPath);
        return resolve();
    });
};
