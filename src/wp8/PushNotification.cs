using System;
using System.Diagnostics;
using System.Windows;
using System.Collections.Generic;
using Microsoft.Phone.Controls;
using Microsoft.Phone.Shell;
using PushSDK;
using WPCordovaClassLib.Cordova;
using WPCordovaClassLib.Cordova.JSON;
using System.Runtime.Serialization;
using System.Threading;
using Newtonsoft.Json.Linq;

namespace WPCordovaClassLib.Cordova.Commands
{
    public class PushNotification : BaseCommand
    {
        private String appid;
        private String authenticatedServiceName = null;
        private NotificationService service = null;
        volatile private bool deviceReady = false;

        //Phonegap runs all plugins methods on a separate threads, make sure onDeviceReady goes first
        void waitDeviceReady()
        {
            while (!deviceReady)
                Thread.Sleep(10);
        }

        public void onDeviceReady(string options)
        {
            string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
            PushOptions pushOptions = JSON.JsonHelper.Deserialize<PushOptions>(args[0]);
            this.appid = pushOptions.AppID;
            authenticatedServiceName = pushOptions.ServiceName;

            service = NotificationService.GetCurrent(appid, authenticatedServiceName, null);
            service.OnPushTokenReceived += OnPushTokenReceived;
            service.OnPushTokenFailed += OnPushTokenFailed;
            service.OnPushAccepted += ExecutePushNotificationCallback;

            deviceReady = true;
        }

        private void OnPushTokenReceived(object sender, string token)
        {
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, token));
        }

        private void OnPushTokenFailed(object sender, string error)
        {
            DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, error));
        }

        public void registerDevice(string options)
        {
            waitDeviceReady();
            service.SubscribeToPushService(authenticatedServiceName);
            if (string.IsNullOrEmpty(service.PushToken))
            {
                PluginResult plugResult = new PluginResult(PluginResult.Status.NO_RESULT);
                plugResult.KeepCallback = true;
                DispatchCommandResult(plugResult);
            }
            else
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.OK, service.PushToken));
            }
        }

        public void unregisterDevice(string options)
        {
            waitDeviceReady();
            service.UnsubscribeFromPushes();
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, "Unregistered from pushes"));
        }

        public void getPushwooshHWID(string options)
        {
            waitDeviceReady();
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, service.DeviceUniqueID));
        }

        public void getPushToken(string options)
        {
            waitDeviceReady();
            if (service != null && !string.IsNullOrEmpty(service.PushToken))
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.OK, service.PushToken));
            }
        }

        public void setTags(string options)
        {
            waitDeviceReady();
            string[] opts = JSON.JsonHelper.Deserialize<string[]>(options);

            JObject jsonObject = JObject.Parse(opts[0]);

            List<KeyValuePair<string, object>> tags = new List<KeyValuePair<string, object>>();
            foreach (var element in jsonObject)
            {
                tags.Add(new KeyValuePair<string,object>(element.Key, element.Value));
            }

            service.SendTag(tags,
                (obj, args) =>
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK, JsonHelper.Serialize(args)));
                },
                (obj, args) => 
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, JsonHelper.Serialize(args)));
                }
            );
        }

        public void startLocationTracking(string options)
        {
            waitDeviceReady();
            service.StartGeoLocation();
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, "GeoZone service is started"));
        }

        public void stopLocationTracking(string options)
        {
            waitDeviceReady();
            service.StopGeoLocation();
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, "GeoZone service is stopped"));
        }

        void ExecutePushNotificationCallback(object sender, string pushPayload)
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
                            cView.Browser.InvokeScript("execScript", "window.plugins.pushNotification.notificationCallback(" + pushPayload + ")");
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

            [DataMember(Name = "serviceName", IsRequired = false)]
            public string ServiceName { get; set; }
        }
    }
}
