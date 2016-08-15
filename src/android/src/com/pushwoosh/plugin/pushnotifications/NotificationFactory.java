package com.pushwoosh.plugin.pushnotifications;

import com.pushwoosh.internal.PushManagerImpl;
import com.pushwoosh.notification.DefaultNotificationFactory;
import com.pushwoosh.notification.PushData;

import org.json.JSONObject;

public class NotificationFactory extends DefaultNotificationFactory
{
    private static PushNotifications mPlugin;

    public void setPlugin(PushNotifications plugin)
    {
        mPlugin = plugin;
    }

    @Override
    public void onPushReceived(PushData pushData)
    {
        super.onPushReceived(pushData);

        if (mPlugin != null)
        {
            JSONObject data = PushManagerImpl.bundleToJSON(pushData.getExtras());
            mPlugin.doOnPushReceived(data.toString());
        }
    }
}
