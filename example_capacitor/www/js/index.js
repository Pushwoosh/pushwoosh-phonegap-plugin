document.addEventListener('deviceready', onDeviceReady, false);

var pushwoosh = null;

function log(msg) {
  console.log('[CapDemo] ' + msg);
  var el = document.getElementById('log');
  var entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = new Date().toLocaleTimeString() + ' ' + msg;
  el.insertBefore(entry, el.firstChild);
}

function onDeviceReady() {
  log('deviceready fired — cordova ' + cordova.platformId + '@' + cordova.version);
  pushwoosh = cordova.require('pushwoosh-cordova-plugin.PushNotification');

  document.getElementById('btnInit').addEventListener('click', function () {
    log('Initializing Pushwoosh...');
    pushwoosh.onDeviceReady({ appid: '7BCDB-76CBE' });
    pushwoosh.getPushToken(function (token) { log('pushToken: ' + token); });
    pushwoosh.getPushwooshHWID(function (hwid) { log('HWID: ' + hwid); });

    pushwoosh.initializeVoIPParameters(
      true, 'ring.wav', 2,
      function () { log('VoIP init OK'); },
      function (err) { log('VoIP init ERROR: ' + err); }
    );
  });

  document.getElementById('btnRegister').addEventListener('click', function () {
    log('Registering for push...');
    pushwoosh.registerDevice(
      function (status) { log('Registered OK: ' + status.pushToken); },
      function (error) { log('Register ERROR: ' + JSON.stringify(error)); }
    );
  });

  document.getElementById('btnVoipSubscribe').addEventListener('click', function () {
    var events = [
      'answer', 'hangup', 'reject',
      'incomingCallSuccess', 'incomingCallFailure',
      'voipPushPayload', 'voipDidCancelCall'
    ];
    events.forEach(function (name) {
      pushwoosh.registerEvent(name,
        function (data) { log('VoIP EVENT [' + name + ']: ' + JSON.stringify(data)); },
        function (err) { log('VoIP registerEvent(' + name + ') FAIL: ' + err); }
      );
      log('Subscribed to: ' + name);
    });
  });

  document.getElementById('btnCallPermission').addEventListener('click', function () {
    log('Requesting call permission...');
    pushwoosh.requestCallPermission(
      function (result) { log('Call permission result: ' + JSON.stringify(result)); },
      function (err) { log('Call permission ERROR: ' + err); }
    );
  });

  document.addEventListener('push-notification', function (event) {
    log('push-notification: ' + JSON.stringify(event.notification));
  });
}
