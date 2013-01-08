package com.arellomobile.android.push.utils.notification;

import android.app.Notification;
import android.content.Context;
import android.graphics.Bitmap;
import android.os.Bundle;

/**
 * Date: 28.09.12
 * Time: 12:08
 *
 * @author MiG35
 */
public class V11NotificationCreator
{
	private static final int sImageHeight = 24;

	public static Notification generateNotification(Context context, Bundle data, String title)
	{
		int simpleIcon = Helper.tryToGetIconFormStringOrGetFromApplication(data.getString("i"), context);

		Bitmap bitmap = null;
		String customIcon = data.getString("ci");
		if (customIcon != null)
		{
			bitmap = Helper.tryToGetBitmapFromInternet(customIcon, context, sImageHeight);
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
