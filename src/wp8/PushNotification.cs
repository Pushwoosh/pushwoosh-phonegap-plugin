using System;
using Microsoft.Phone.Shell;
using PushSDK;
using PushSDK.Classes;
using WPCordovaClassLib.Cordova;
using WPCordovaClassLib.Cordova.Commands;
using WPCordovaClassLib.Cordova.JSON;

namespace Cordova.Extension.Commands
{
    public class PushNotification : BaseCommand
    {
        private static NotificationService service = null;

        private static NotificationService NotificationService
        {
            get {
                if (service == null)
                {
                    service = NotificationService.GetCurrent("F9408-29446", "HelloCordova/MainPage.xaml", null);
                    service.SubscribeToPushService("test");
                    String token = service.PushToken;
                }
                return service;
            }
        }

        // Copied from PWNotification
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


        // Copied from PWUserToken
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


        // Copied from PWUserData
        public void GetUserData(string options)
        {
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, NotificationService.UserData));
        }


        // Copied from PWTags
        public void SendTags(string options)
        {
            NotificationService.Tags.OnSendingComplete += (sender, args) => DispatchCommandResult(new PluginResult(PluginResult.Status.OK, JsonHelper.Serialize(args.Result)));

            NotificationService.Tags.SendRequest(options);
        }


        // Copied from  PWGeozone
        public void StartGeozone(string options)
        {
            NotificationService.GeoZone.Start();
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, "Geozone service is started"));
        }

        public void StopGeozone(string options)
        {
            NotificationService.GeoZone.Stop();
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, "Geozone service is stopped"));
        }
    }
}