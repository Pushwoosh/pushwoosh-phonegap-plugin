#!/usr/bin/env node

'use strict';

var utilities = require("./lib/utilities");

var ANDROID_DIR = 'platforms/android';

var PLATFORM = {
  ANDROID: {
    dest: [
      ANDROID_DIR + '/google-services.json',
      ANDROID_DIR + '/app/google-services.json'
    ],
    src: [
      'google-services.json',
      ANDROID_DIR + '/assets/www/google-services.json',
      'www/google-services.json',
      ANDROID_DIR + '/app/src/main/google-services.json'
    ],
  }
};

module.exports = function (context) {
  var platforms = context.opts.platforms;
  if (platforms.indexOf('android') !== -1 && utilities.directoryExists(ANDROID_DIR)) {
    console.log('Preparing Firebase on Android');
    utilities.copyKey(PLATFORM.ANDROID);
  }
};
