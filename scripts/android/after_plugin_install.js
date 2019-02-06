var helper = require('./helper');

module.exports = function(context) {
    helper.restoreBuildGradle();
    helper.modifyBuildGradle();
};
