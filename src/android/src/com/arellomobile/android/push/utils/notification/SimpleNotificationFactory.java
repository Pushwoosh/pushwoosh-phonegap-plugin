package com.arellomobile.android.push.utils.notification;

import android.app.Notification;
import android.content.Context;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.os.Build;
import android.os.Bundle;
import android.text.Html;

import com.arellomobile.android.push.preference.SoundType;
import com.arellomobile.android.push.preference.VibrateType;
import com.pushwoosh.support.v4.app.NotificationCompat;

public class SimpleNotificationFactory extends BaseNotificationFactory
{
	private static final int sImageHeight = 128;
	
	public SimpleNotificationFactory(Context context, Bundle data, String header, String message, SoundType soundType, VibrateType vibrateType)
	{
		super(context, data, header, message, soundType, vibrateType);
	}

	@Override
	Notification generateNotificationInner(Context context, Bundle data, String header, String message, String tickerTitle)
	{
		int simpleIcon = Helper.tryToGetIconFormStringOrGetFromApplication(data.getString("i"), context);

		Resources res = context.getResources();
		//int height = (int) res.getDimension(android.R.dimen.notification_large_icon_height);
		//int width = (int) res.getDimension(android.R.dimen.notification_large_icon_width);
		
		Bitmap bitmap = null;
		String customIcon = data.getString("ci");
		if (customIcon != null)
		{
			bitmap = Helper.tryToGetBitmapFromInternet(customIcon, context, sImageHeight);
		}
		
		NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(context);
		notificationBuilder.setContentTitle(header);
		notificationBuilder.setContentText(message);
		notificationBuilder.setTicker(tickerTitle);
		notificationBuilder.setWhen(System.currentTimeMillis());
		
		notificationBuilder.setStyle(new NotificationCompat.BigTextStyle().bigText(message));
		
		notificationBuilder.setSmallIcon(simpleIcon);
		
		if (null != bitmap)
		{
			notificationBuilder.setLargeIcon(bitmap);
		}

		return notificationBuilder.build();
	}
}
