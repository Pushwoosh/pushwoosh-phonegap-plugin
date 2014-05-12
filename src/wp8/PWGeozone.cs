using Microsoft.Phone.Shell;
using PushSDK;
using WPCordovaClassLib.Cordova;
using WPCordovaClassLib.Cordova.Commands;

namespace Cordova.Extension.Commands
{
    public class PWGeozone : BaseCommand
    {
        private static NotificationService NotificationService
        {
            get { return ((PhonePushApplicationService)PhoneApplicationService.Current).NotificationService; }
        }

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
