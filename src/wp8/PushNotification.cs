using System;
using System.Collections.Generic;
using Microsoft.Phone.Shell;
using PushSDK;
using PushSDK.Classes;
using WPCordovaClassLib.Cordova;
using WPCordovaClassLib.Cordova.JSON;
using System.Runtime.Serialization;

namespace WPCordovaClassLib.Cordova.Commands
{
    public class PushNotification : BaseCommand
    {
        private String appid;
        private NotificationService service = null;


        // New onDeviceReady function
        public void onDeviceReady(string options)
        {
            string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
            PushOptions pushOptions = JSON.JsonHelper.Deserialize<PushOptions>(args[0]);
            this.appid = pushOptions.AppID;         
        }

        // PWNotification
        public void registerDevice(string options)
        {
            // TODO try without the mainpage.xaml stuff
            IEnumerable<string> tiles = new string[] { "http://www.pushwoosh.com" };
            service = NotificationService.GetCurrent(appid, "/HelloCordova;component/MainPage.xaml", tiles);
            service.SubscribeToPushService();

            service.OnPushAccepted += 
                (sender, args) => DispatchCommandResult(new PluginResult(PluginResult.Status.OK, args.Result));

            // TODO: I think this should be passed to the onNotifCallback of the x-platform JS API
            // DispatchCommandResult(new PluginResult(PluginResult.Status.OK, service.LastPushContent));

            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, service.PushToken));
        }

        public void UnsubscribeFromPushNotification(string options)
        {
            service.UnsubscribeFromPushes();
        }

        
        // PWUserToken
        public void GetUserToken(string options)
        {
            if (!string.IsNullOrEmpty(service.PushToken))
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.OK, service.PushToken));
            }
            service.OnPushTokenUpdated += OnPushTokenUpdated;
        }

        private void OnPushTokenUpdated(object sender, CustomEventArgs<Uri> e)
        {
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, e.Result.ToString()));
        }

        
        // PWUserData
        public void GetUserData(string options)
        {
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, service.UserData));
        }


        // PWTags
        public void SendTags(string options)
        {
            service.Tags.OnSendingComplete += (sender, args) => DispatchCommandResult(new PluginResult(PluginResult.Status.OK, JsonHelper.Serialize(args.Result)));
            service.Tags.SendRequest(options);
        }


        // PWGeozone
        public void StartGeozone(string options)
        {
            service.GeoZone.Start();
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, "Geozone service is started"));
        }

        public void StopGeozone(string options)
        {
            service.GeoZone.Stop();
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, "Geozone service is stopped"));
        }

        [DataContract]
        public class PushOptions
        {
            [DataMember(Name = "appid", IsRequired = true)]
            public string AppID { get; set; }
        }

    }
}
