package com.arellomobile.android.push.utils.notification;

import android.app.Notification;
import android.content.Context;
import android.os.Bundle;

/**
 * Date: 28.09.12
 * Time: 12:08
 *
 * @author MiG35
 */
public class NotificationCreator
{
	@SuppressWarnings("deprecation")
	public static Notification generateNotification(Context context, Bundle data, String title)
	{
		return new Notification(tryToGetIconFormStringOrGetFromApplication(data.getString("i"), context), title,
				System.currentTimeMillis());
	}

	private static int tryToGetIconFormStringOrGetFromApplication(String iconName, Context context)
	{
		int iconId = context.getApplicationInfo().icon;

		if (null != iconName)
		{
			int customId = context.getResources().getIdentifier(iconName, "drawable", context.getPackageName());
			if (0 != customId)
			{
				iconId = customId;
			}
		}

		return iconId;
	}

}
