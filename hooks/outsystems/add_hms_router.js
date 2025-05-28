var path = require("path");
var fs = require("fs");
var AdmZip = require("adm-zip");
var utils = require("./utils");


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
                    console.log("[PUSHWOOSH HELPER] zipFile found: " + zipFile);
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
    console.log("[PUSHWOOSH HELPER] extracted zip to targetDir");
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
	      throw new Error("[PUSHWOOSH HELPER] Source file not found:", srcFile);
	    }

	    const destinationPath = path.join("platforms/android/app/src/main/java", getPackageSpecificPath());
	    if (!fs.existsSync(destinationPath)) {
		    fs.mkdirSync(destinationPath, { recursive: true });
		}
	    fs.copyFileSync(srcFile, path.join(destinationPath, "HuaweiMessagingRouterService.java"));
	    console.log("[PUSHWOOSH HELPER] Copied " + srcFile + " to " + destinationPath);
        return true;
	} catch (error) {
    console.error("[PUSHWOOSH HELPER] Error copying HuaweiMessagingRouterService.java file:", error.message);
    return false;
  }
}

function addService(manifestPath, serviceName, serviceTemplate) {
  fs.readFile(manifestPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading manifest file:', err);
      return;
    }

    const applicationRegex = /<application\b[^>]*>/;
    const applicationMatch = applicationRegex.exec(data);

    if (!applicationMatch) {
      console.error('<application> tag not found in manifest');
      return;
    }

    const updatedManifest = data.substring(0, applicationMatch.index + applicationMatch[0].length) +
      serviceTemplate +
      data.substring(applicationMatch.index + applicationMatch[0].length);

    fs.writeFile(manifestPath, updatedManifest, 'utf8', (err) => {
      if (err) {
        console.error('Error writing updated manifest:', err);
        throw new Error('Error writing updated manifest:', err);
      }
      console.log('Service element added successfully!');
    });
  });
}

module.exports = function(context) {
    return new Promise(function(resolve, reject) {
        var wwwpath = utils.getWwwPath(context);    
    	var configPath = path.join(wwwpath, "HuaweiMessagingRouterService");
        var prefZipFilename = "HuaweiMessagingRouterService";
        var zipFile = getZipFile(configPath, prefZipFilename);

        // if zip file is present, lets unzip it!
        if (zipFile) {
        	var unzippedResourcesDir = unzip(zipFile, configPath, prefZipFilename);
	        var unzippedFile = path.join(unzippedResourcesDir, "HuaweiMessagingRouterService.java");
	        var copyWithSuccess = copyJavaFile(unzippedFile);
            if (!copyWithSuccess) {
                return reject(
                    "Failed to install pushwoosh plugin. Reason: Unable to copy HuaweiMessagingRouterService file to project."
                );
            }

            const manifestPath = context.opts.projectRoot + '/platforms/android/app/src/main/AndroidManifest.xml';
            const serviceName = ".HuaweiMessagingRouterService";
            const serviceTemplate = `
                <service android:name="${serviceName}" android:exported="false">
                    <intent-filter android:priority="500">
                        <action android:name="com.huawei.push.action.MESSAGING_EVENT" />
                    </intent-filter>
                </service>`;

            if (fs.existsSync(manifestPath)) {
                console.log("manifest exists");
                addService(manifestPath, serviceName, serviceTemplate);
            }
        }

        return resolve();
    });
};





