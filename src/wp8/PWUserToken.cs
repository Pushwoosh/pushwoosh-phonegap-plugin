using System;
using Microsoft.Phone.Shell;
using PushSDK;
using PushSDK.Classes;
using WPCordovaClassLib.Cordova;
using WPCordovaClassLib.Cordova.Commands;

namespace Cordova.Extension.Commands
{
    public class PWUserToken : BaseCommand
    {
        private static NotificationService NotificationService
        {
            get { return ((PhonePushApplicationService) PhoneApplicationService.Current).NotificationService; }
        }

        public void GetUserToken(string options)
        {
            if (!string.IsNullOrEmpty(NotificationService.PushToken))
                DispatchCommandResult(new PluginResult(PluginResult.Status.OK, NotificationService.PushToken));

            NotificationService.OnPushTokenUpdated += OnPushTokenUpdated;
        }

        private void OnPushTokenUpdated(object sender, CustomEventArgs<Uri> e)
        {
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, e.Result.ToString()));
        }
    }
}
