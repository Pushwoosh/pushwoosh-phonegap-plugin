var path = require("path");
var fs = require("fs");
var AdmZip = require("adm-zip");
var utils = require("./utils");

var TAG = "[add_fcm_router.js]";


/**
 * Searches the resources folder for a zip file with the name equal
 * to the resource preference value and returns an absolute path
 * if found.
 *
 * @param {String} resourcesFolder - the absolute path to the expected resources folder
 * @param {String} prefZipFilename - the expected name of the zip file
 * @returns {string} absolute path to the zip file
 *
 */
function getZipFile(resourcesFolder, prefZipFilename) {
    try {
        var zipFile;
        var dirFiles = fs.readdirSync(resourcesFolder);
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

/**
 * Attempts to unzip the zip file
 * @param {string} zipFile Absolute path to the etracted zip
 * @param {string} unzippedTargetDir Absolutepath to where the
 * uncompressed content is going to be placed
 * @param {string} prefZipFilename The name of the zip file
 * @returns {string} Absolute path to the folder containing
 * the uncompressed content of the zip file
 */
function unzip(zipFile, unzippedTargetDir, prefZipFilename) {
    var zip = new AdmZip(zipFile);
    var targetDir = path.join(unzippedTargetDir, prefZipFilename);
    zip.extractAllTo(targetDir, true);
    return targetDir;
}

function extractAppId() {
  const configFile = "config.xml";
  const xmlData = fs.readFileSync(configFile, "utf8");
  const match = xmlData.match(/id="([^"]+)"/);
  return match ? match[1] : null;
}

function getPackageSpecificPath() {
	const packageName = extractAppId();
	return packageName.replace(/\./g,"/");
}

function copyJavaFile(srcFile) {
	try {
	    if (!fs.existsSync(srcFile)) {
	      throw new Error("Source file not found: " + srcFile);
	    }

	    const destinationPath = path.join("platforms/android/app/src/main/java", getPackageSpecificPath());
	    if (!fs.existsSync(destinationPath)) {
		    fs.mkdirSync(destinationPath, { recursive: true });
		}
	    fs.copyFileSync(srcFile, path.join(destinationPath, "FirebaseMessagingRouterService.java"));
        return true;
	} catch (error) {
    console.error(TAG, "Error copying FirebaseMessagingRouterService:", error.message);
    return false;
  }
}

function addService(manifestPath, serviceName, serviceTemplate) {
  fs.readFile(manifestPath, 'utf8', (err, data) => {
    if (err) {
      console.error(TAG, 'Error reading manifest file:', err);
      return;
    }

    const applicationRegex = /<application\b[^>]*>/;
    const applicationMatch = applicationRegex.exec(data);

    if (!applicationMatch) {
      console.error(TAG, '<application> tag not found in manifest');
      return;
    }

    const updatedManifest = data.substring(0, applicationMatch.index + applicationMatch[0].length) +
      serviceTemplate +
      data.substring(applicationMatch.index + applicationMatch[0].length);

    fs.writeFile(manifestPath, updatedManifest, 'utf8', (err) => {
      if (err) {
        console.error(TAG, 'Error writing updated manifest:', err);
        throw new Error('Error writing updated manifest:', err);
      }
      console.log(TAG, 'Service element added successfully!');
    });
  });
}

module.exports = function(context) {
    console.log(TAG, "Hook started");
    console.log(TAG, "Platform:", context.opts.plugin.platform);

    return new Promise(function(resolve, reject) {
        var wwwpath = utils.getWwwPath(context);
        console.log(TAG, "WWW path:", wwwpath);

    	var configPath = path.join(wwwpath, "FirebaseMessagingRouterService");
        console.log(TAG, "Config path:", configPath);

        var prefZipFilename = "FirebaseMessagingRouterService";
        var zipFile = getZipFile(configPath, prefZipFilename);
        console.log(TAG, "Zip file found:", zipFile || "NOT FOUND");

        // if zip file is present, lets unzip it!
        if (zipFile) {
            console.log(TAG, "Unzipping:", zipFile);
        	var unzippedResourcesDir = unzip(zipFile, configPath, prefZipFilename);
            console.log(TAG, "Unzipped to:", unzippedResourcesDir);

	        var unzippedFile = path.join(unzippedResourcesDir, "FirebaseMessagingRouterService.java");
	        var copyWithSuccess = copyJavaFile(unzippedFile);
            console.log(TAG, "Copy result:", copyWithSuccess ? "SUCCESS" : "FAILED");

            if (!copyWithSuccess) {
                console.log(TAG, "ERROR: Unable to copy FirebaseMessagingRouterService");
                return reject(
                    "Failed to install pushwoosh plugin. Reason: Unable to copy FirebaseMessagingRouterService file to project."
                );
            }

            const manifestPath = context.opts.projectRoot + '/platforms/android/app/src/main/AndroidManifest.xml';
            console.log(TAG, "Manifest path:", manifestPath);

            const serviceName = ".FirebaseMessagingRouterService";
            const serviceTemplate = `
                <service android:name="${serviceName}" android:exported="false">
                    <intent-filter android:priority="500">
                        <action android:name="com.google.firebase.MESSAGING_EVENT" />
                    </intent-filter>
                </service>`;

            if (fs.existsSync(manifestPath)) {
                console.log(TAG, "Manifest exists, adding service");
                addService(manifestPath, serviceName, serviceTemplate);
            } else {
                console.log(TAG, "Manifest NOT found at:", manifestPath);
            }
        } else {
            console.log(TAG, "No FCM router zip found, skipping");
        }

        console.log(TAG, "Hook completed successfully");
        return resolve();
    });
};





