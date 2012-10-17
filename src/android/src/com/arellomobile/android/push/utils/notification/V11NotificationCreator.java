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
		int simpleIcon = tryToGetIconFormStringOrGetFromApplication(data.getString("i"), context);

		Bitmap bitmap = tryToGetBitmapFromInternet(data.getString("ii"), context);

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

	private static Bitmap tryToGetBitmapFromInternet(String bitmapUrl, Context context)
	{
		if (null != bitmapUrl)
		{
			InputStream inputStream = null;
			try
			{
				URL url = new URL(bitmapUrl);

				URLConnection connection = url.openConnection();

				connection.connect();

				inputStream = connection.getInputStream();
				ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
				byte[] buffer = new byte[1024];
				int read;

				while ((read = inputStream.read(buffer)) != -1)
				{
					byteArrayOutputStream.write(buffer, 0, read);
				}
				inputStream.close();
				byteArrayOutputStream.close();

				buffer = byteArrayOutputStream.toByteArray();

				BitmapFactory.Options options = new BitmapFactory.Options();
				options.inJustDecodeBounds = true;

				BitmapFactory.decodeByteArray(buffer, 0, buffer.length, options);

				int maxSize = Math.max(options.outWidth, options.outHeight);
				float newImageScale = maxSize / (40 * context.getResources().getDisplayMetrics().density);

				options.inJustDecodeBounds = false;
				options.inSampleSize = Math.round(newImageScale);

				return BitmapFactory.decodeByteArray(buffer, 0, buffer.length, options);
			}
			catch (Throwable e)
			{
				// pass
			}
			finally
			{
				if (null != inputStream)
				{
					try
					{
						inputStream.close();
					}
					catch (IOException e)
					{
						// pass
					}
					inputStream = null;
				}
				System.gc();
			}
		}

		return null;
	}
}
