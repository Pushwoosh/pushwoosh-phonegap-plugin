using System;
using System.Diagnostics;
using System.Windows;
using System.Collections.Generic;
using Microsoft.Phone.Controls;
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


        public void onDeviceReady(string options)
        {
            string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
            PushOptions pushOptions = JSON.JsonHelper.Deserialize<PushOptions>(args[0]);
            this.appid = pushOptions.AppID;
        }

        public void registerDevice(string options)
        {
            service = NotificationService.GetCurrent(appid, null, null);
            service.SubscribeToPushService();
            service.OnPushAccepted += (sender, args) => DispatchCommandResult(new PluginResult(PluginResult.Status.OK, args.Result));

            if (!string.IsNullOrEmpty(service.LastPushContent))
            {
                this.ExecuteCallback(service.LastPushContent);
            }

            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, service.PushToken));
        }

        public void unregisterDevice(string options)
        {
            service.UnsubscribeFromPushes();
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, "Unregistered from pushes"));
        }


        public void getPushToken(string options)
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


        public void GetUserData(string options)
        {
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, service.UserData));
        }


        public void setTags(string options)
        {
            string[] opts = JSON.JsonHelper.Deserialize<string[]>(options);
            service.Tags.OnSendingComplete += (sender, args) => DispatchCommandResult(new PluginResult(PluginResult.Status.OK, JsonHelper.Serialize(args.Result)));
            service.Tags.SendRequest(opts[0]);
        }


        public void startLocationTracking(string options)
        {
            service.GeoZone.Start();
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, "GeoZone service is started"));
        }

        public void stopLocationTracking(string options)
        {
            service.GeoZone.Stop();
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, "GeoZone service is stopped"));
        }

        void ExecuteCallback(string callbackResult)
        {
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                PhoneApplicationFrame frame;
                PhoneApplicationPage page;
                CordovaView cView;

                if (TryCast(Application.Current.RootVisual, out frame) &&
                    TryCast(frame.Content, out page) &&
                    TryCast(page.FindName("CordovaView"), out cView))
                {
                    cView.Browser.Dispatcher.BeginInvoke(() =>
                    {
                        try
                        {
                            cView.Browser.InvokeScript("execScript", "window.plugins.pushNotification.notificationCallback(" + callbackResult + ")");
                        }
                        catch (Exception ex)
                        {
                            Debug.WriteLine("ERROR: Exception in InvokeScriptCallback :: " + ex.Message);
                        }
                    });
                }
            });
        }

        static bool TryCast<T>(object obj, out T result) where T : class
        {
            result = obj as T;
            return result != null;
        }

        [DataContract]
        public class PushOptions
        {
            [DataMember(Name = "appid", IsRequired = true)]
            public string AppID { get; set; }
        }

    }
}
