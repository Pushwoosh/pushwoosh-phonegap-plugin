var fs = require("fs");
var path = require("path");

/*
 * Helper function to read the build.gradle that sits at the root of the project
 */
function readBuildGradle(target) {
  return fs.readFileSync(target, "utf-8");
}
/*
 * Added a dependency on 'com.google.gms' based on the position of the know 'com.android.tools.build' dependency in the build.gradle
 */
function addDependencies(buildGradle) {
  // find the known line to match
  var match = buildGradle.match(/^(\s*)classpath 'com.android.tools.build(.*)/m);
  var whitespace = match[1];
  
  // modify the line to add the necessary dependencies
  var googlePlayDependency = whitespace + 'classpath \'com.google.gms:google-services:4.1.0\'';
  var modifiedLine = match[0] + '\n' + googlePlayDependency;
  
  // modify the actual line
  return buildGradle.replace(/^(\s*)classpath 'com.android.tools.build(.*)/m, modifiedLine);
}
function addPlugin(buildGradle) {
  return "apply plugin: \'com.google.gms.google-services\'\n" + buildGradle;
}
/*
 * Add 'google()' and Crashlytics to the repository repo list
 */
function addRepos(buildGradle) {
  // find the known line to match
  var match = buildGradle.match(/^(\s*)jcenter\(\)/m);
  var whitespace = match[1];


  // update the all projects grouping
  var allProjectsIndex = buildGradle.indexOf('allprojects');
  if (allProjectsIndex > 0) {
    // split the string on allprojects because jcenter is in both groups and we need to modify the 2nd instance
    var firstHalfOfFile = buildGradle.substring(0, allProjectsIndex);
    var secondHalfOfFile = buildGradle.substring(allProjectsIndex);

    // Add google() to the allprojects section of the string
    match = secondHalfOfFile.match(/^(\s*)jcenter\(\)/m);
    var googlesMavenRepo = whitespace + 'google()';
    modifiedLine = match[0] + '\n' + googlesMavenRepo;
    // modify the part of the string that is after 'allprojects'
    secondHalfOfFile = secondHalfOfFile.replace(/^(\s*)jcenter\(\)/m, modifiedLine);

    // recombine the modified line
    buildGradle = firstHalfOfFile + secondHalfOfFile;
  } else {
    // this should not happen, but if it does, we should try to add the dependency to the buildscript
    match = buildGradle.match(/^(\s*)jcenter\(\)/m);
    var googlesMavenRepo = whitespace + 'google()';
    modifiedLine = match[0] + '\n' + googlesMavenRepo;
    // modify the part of the string that is after 'allprojects'
    buildGradle = buildGradle.replace(/^(\s*)jcenter\(\)/m, modifiedLine);
  }

  return buildGradle;
}

/*
 * Helper function to write to the build.gradle that sits at the root of the project
 */
function writeBuildGradle(contents, target) {
  fs.writeFileSync(target, contents);
}

module.exports = {

  modifyRootBuildGradle: function() {
    var target = path.join("platforms", "android", "build.gradle");
   
    if (!fs.existsSync(target)) {
      return;
    }
    var buildGradle = readBuildGradle(target);
    buildGradle = addDependencies(buildGradle);
    buildGradle = addRepos(buildGradle);
    writeBuildGradle(buildGradle, target);

    var target = path.join("platforms", "android", "app", "build.gradle");

    if (!fs.existsSync(target)) {
      return;
    }
    var buildGradle = readBuildGradle(target);
    buildGradle = addPlugin(buildGradle);
    writeBuildGradle(buildGradle, target);
  },

  restoreRootBuildGradle: function() {
    var target = path.join("platforms", "android", "build.gradle");

    if (!fs.existsSync(target)) {
      return;
    }

    var buildGradle = readBuildGradle(target);

    // remove any lines we added
    buildGradle = buildGradle.replace(/(?:^|\r?\n)(.*)cordova-plugin-firebase*?(?=$|\r?\n)/g, '');
  
    writeBuildGradle(buildGradle, target);
  }
};