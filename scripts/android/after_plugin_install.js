var helper = require('./helper');

module.exports = function(context) {
    helper.restoreRootBuildGradle();
    helper.modifyRootBuildGradle();
};
