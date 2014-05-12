using Microsoft.Phone.Shell;
using PushSDK;
using WPCordovaClassLib.Cordova;
using WPCordovaClassLib.Cordova.Commands;

namespace Cordova.Extension.Commands
{
    public class PWNotification : BaseCommand
    {
        private static NotificationService NotificationService
        {
            get { return ((PhonePushApplicationService)PhoneApplicationService.Current).NotificationService; }
        }

        public void SubscribeToPushNotification(string options)
        {
            NotificationService.OnPushAccepted += 
                (sender, args) => DispatchCommandResult(new PluginResult(PluginResult.Status.OK, args.Result));

            if (!string.IsNullOrEmpty(NotificationService.LastPushContent))
                DispatchCommandResult(new PluginResult(PluginResult.Status.OK, NotificationService.LastPushContent));
        }

        public void UnsubscribeFromPushNotification(string options)
        {
            NotificationService.UnsubscribeFromPushes();
        }
    }
}
