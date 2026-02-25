var exec = window.cordova.exec;

var SecondWebView = {
    open: function(success, error) {
        exec(success, error, "SecondWebView", "open", []);
    },
    close: function(success, error) {
        exec(success, error, "SecondWebView", "close", []);
    }
};

module.exports = SecondWebView;
