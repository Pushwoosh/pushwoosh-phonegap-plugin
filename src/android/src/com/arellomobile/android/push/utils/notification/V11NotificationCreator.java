package com.arellomobile.android.push.utils.notification;

import android.app.Notification;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;

/**
 * Date: 28.09.12
 * Time: 12:08
 *
 * @author MiG35
 */
public class V11NotificationCreator
{
	public static Notification generateNotification(Context context, Bundle data, String title)
	{
		int simpleIcon = Helper.tryToGetIconFormStringOrGetFromApplication(data.getString("i"), context);

		Bitmap bitmap = null;
		String customIcon = data.getString("ci");
		if(customIcon != null)
		{
			bitmap = Helper.tryToGetBitmapFromInternet(customIcon, context, 40);
		}

		Notification.Builder notificationBuilder = new Notification.Builder(context);
		notificationBuilder.setTicker(title);
		notificationBuilder.setContentTitle(title);
		notificationBuilder.setWhen(System.currentTimeMillis());

		if (null != bitmap)
		{
			notificationBuilder.setLargeIcon(bitmap);
		}

		notificationBuilder.setSmallIcon(simpleIcon);

		return notificationBuilder.getNotification();
	}
}
