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
using PushSDK.Classes;
using Newtonsoft.Json;

namespace WPCordovaClassLib.Cordova.Commands
{
    public class PushNotification : BaseCommand
    {
        private String appid;
        private String authenticatedServiceName = null;
        private NotificationService service = null;
        volatile private bool deviceReady = false;

        private string registerCallbackId = null;

        // returns null value if it fails.
        private string getCallbackId(string options)
        {
            string[] optStings = null;
            try
            {
                optStings = JSON.JsonHelper.Deserialize<string[]>(options);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION), CurrentCommandCallbackId);
            }

            if (optStings == null)
                return CurrentCommandCallbackId;

            //callback id is the last item
            return optStings[optStings.Length - 1];
        }

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
            if(registerCallbackId != null)
                DispatchCommandResult(new PluginResult(PluginResult.Status.OK, token), registerCallbackId);
        }

        private void OnPushTokenFailed(object sender, string error)
        {
            if (registerCallbackId != null)
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, error), registerCallbackId);
        }

        public void registerDevice(string options)
        {
            string callbackId = getCallbackId(options);
            waitDeviceReady();

            service.SubscribeToPushService(authenticatedServiceName);
            if (string.IsNullOrEmpty(service.PushToken))
            {
                registerCallbackId = callbackId;

                PluginResult plugResult = new PluginResult(PluginResult.Status.NO_RESULT);
                plugResult.KeepCallback = true;
                DispatchCommandResult(plugResult, callbackId);
            }
            else
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.OK, service.PushToken), callbackId);
            }
        }

        public void unregisterDevice(string options)
        {
            string callbackId = getCallbackId(options);

            PluginResult plugResult = new PluginResult(PluginResult.Status.NO_RESULT);
            plugResult.KeepCallback = true;
            DispatchCommandResult(plugResult);

            waitDeviceReady();
            service.UnsubscribeFromPushes(
                (obj, args) =>
                {
                    string result = JsonConvert.SerializeObject(args);
                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK, result));
                },
                (obj, args) =>
                {
                    string result = JsonConvert.SerializeObject(args);
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, result));
                });
        }

        public void getTags(string options)
        {
            string callbackId = getCallbackId(options);

            PluginResult plugResult = new PluginResult(PluginResult.Status.NO_RESULT);
            plugResult.KeepCallback = true;
            DispatchCommandResult(plugResult);

            waitDeviceReady();
            service.GetTags(
                (obj, args) =>
                {
                    string result = JsonConvert.SerializeObject(args);
                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK, result), callbackId);
                },
                (obj, args) =>
                {
                    string result = JsonConvert.SerializeObject(args);
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, result), callbackId);
                });
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
            string callbackId = getCallbackId(options);

            PluginResult plugResult = new PluginResult(PluginResult.Status.NO_RESULT);
            plugResult.KeepCallback = true;
            DispatchCommandResult(plugResult);

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
                    string result = JsonConvert.SerializeObject(args);
                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK, result), callbackId);
                },
                (obj, args) => 
                {
                    string result = JsonConvert.SerializeObject(args);
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, result), callbackId);
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

        void ExecutePushNotificationCallback(object sender, ToastPush push)
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
                            string pushPayload = JsonConvert.SerializeObject(push);
                            cView.Browser.InvokeScript("eval", "cordova.require(\"pushwoosh-cordova-plugin.PushNotification\").notificationCallback(" + pushPayload + ")");
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
