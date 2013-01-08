package com.arellomobile.android.push.utils.notification;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;

/**
 * Date: 30.10.12
 * Time: 18:21
 *
 * @author MiG35
 */
public class Helper
{
	public static int tryToGetIconFormStringOrGetFromApplication(String iconName, Context context)
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

	public static Bitmap tryToGetBitmapFromInternet(String bitmapUrl, Context context, int imageSize)
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
				float newImageScale = 1f;
				if (-1 != imageSize)
				{
					newImageScale = maxSize / (imageSize * context.getResources().getDisplayMetrics().density);
				}

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

	public static Bitmap getScaleBitmap(Bitmap srcBitmap, int outHeightSimple, Context context)
	{
		int outHeight = (int) (outHeightSimple * context.getResources().getDisplayMetrics().density);
		return Bitmap.createScaledBitmap(srcBitmap, srcBitmap.getWidth() * outHeight / srcBitmap.getHeight(), outHeight, true);
	}

}
