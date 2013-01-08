//
//  DeviceFeature2_5.java
//
// Pushwoosh Push Notifications SDK
// www.pushwoosh.com
//
// MIT Licensed
package com.arellomobile.android.push;

import android.content.Context;
import android.location.Location;
import android.util.Log;
import com.arellomobile.android.push.data.PushZoneLocation;
import com.arellomobile.android.push.request.RequestHelper;
import com.arellomobile.android.push.utils.NetworkUtils;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Date: 16.08.12
 * Time: 19:04
 *
 * @author mig35
 */
public class DeviceFeature2_5
{
	private static final String TAG = "PushWoosh DeviceFeature2_5";

	private static final String PUSH_STAT = "pushStat";
	private static final String TAGS_PATH = "setTags";
	private static final String NEAREST_ZONE = "getNearestZone";
	private static final String APP_OPEN = "applicationOpen";

	static void sendPushStat(Context context, String hash)
	{
		final Map<String, Object> data = new HashMap<String, Object>();

		data.putAll(RequestHelper.getSendPushStatData(context, hash, NetworkUtils.PUSH_VERSION));

		Log.w(TAG, "Try To sent PushStat");

		NetworkUtils.NetworkResult res = new NetworkUtils.NetworkResult(-1, null);
		Exception exception = new Exception();
		for (int i = 0; i < NetworkUtils.MAX_TRIES; ++i)
		{
			try
			{
				res = NetworkUtils.makeRequest(data, PUSH_STAT);
				if (200 == res.getResultCode())
				{
					Log.w(TAG, "Send PushStat success");
					return;
				}
			}
			catch (Exception e)
			{
				exception = e;
			}
		}

		Log.e(TAG, "ERROR: Try To sent PushStat " + exception.getMessage() + ". Response = " + res.getResultData(),
				exception);
	}
	
	static void sendAppOpen(Context context)
	{
		final Map<String, Object> data = new HashMap<String, Object>();

		data.putAll(RequestHelper.getSendAppOpenData(context, NetworkUtils.PUSH_VERSION));

		Log.w(TAG, "Try To sent AppOpen");

		NetworkUtils.NetworkResult res = new NetworkUtils.NetworkResult(-1, null);
		Exception exception = new Exception();
		for (int i = 0; i < NetworkUtils.MAX_TRIES; ++i)
		{
			try
			{
				res = NetworkUtils.makeRequest(data, APP_OPEN);
				if (200 == res.getResultCode())
				{
					Log.w(TAG, "Send AppOpen success");
					return;
				}
			}
			catch (Exception e)
			{
				exception = e;
			}
		}

		Log.e(TAG, "ERROR: Try To sent AppOpen " + exception.getMessage() + ". Response = " + res.getResultData(),
				exception);
	}

	static JSONArray sendTags(Context context, Map<String, Object> tags) throws Exception
	{
		final Map<String, Object> data = new HashMap<String, Object>();

		data.putAll(RequestHelper.getSendTagsData(context, NetworkUtils.PUSH_VERSION));

		JSONObject tagsObject = new JSONObject();
		for (String key : tags.keySet())
		{
			Object value = tags.get(key);
			if (value instanceof String || value instanceof Integer)
			{
				tagsObject.put(key, value);
			}
			else if (value instanceof List)
			{
				JSONArray values = new JSONArray();
				for (Object item : (List<?>) value)
				{
					if (item instanceof String || item instanceof Integer)
					{
						values.put(String.valueOf(item));
					}
					else
					{
						throw new RuntimeException("wrong type for tag: " + key);
					}
				}
				tagsObject.put(key, values);
			}
			else if (value instanceof JSONArray)
			{
				JSONArray values = (JSONArray)value;
				tagsObject.put(key, values);
			}
			else
			{
				throw new RuntimeException("wrong type for tag: " + key);
			}
		}

		data.put("tags", tagsObject);

		Log.w(TAG, "Try To sent Tags");

		NetworkUtils.NetworkResult res = new NetworkUtils.NetworkResult(-1, null);
		Exception exception = new Exception();
		for (int i = 0; i < NetworkUtils.MAX_TRIES; ++i)
		{
			try
			{
				res = NetworkUtils.makeRequest(data, TAGS_PATH);
				if (200 == res.getResultCode())
				{
					Log.w(TAG, "Send Tags success");
					return res.getResultData().getJSONObject("response").getJSONArray("skipped");
				}
			}
			catch (Exception e)
			{
				exception = e;
			}
		}

		Log.e(TAG, "ERROR: sent Tags " + exception.getMessage() + ". Response = " + res, exception);
		throw exception;
	}

	public static PushZoneLocation getNearestZone(Context context, Location location) throws Exception
	{
		final Map<String, Object> data = new HashMap<String, Object>();

		data.putAll(RequestHelper.getNearestZoneData(context, location, NetworkUtils.PUSH_VERSION));

		Log.w(TAG, "Try To Sent Nearest Zone");

		NetworkUtils.NetworkResult res = new NetworkUtils.NetworkResult(-1, null);
		Exception exception = new Exception();
		for (int i = 0; i < NetworkUtils.MAX_TRIES; ++i)
		{
			try
			{
				res = NetworkUtils.makeRequest(data, NEAREST_ZONE);
				if (200 == res.getResultCode())
				{
					Log.w(TAG, "Send Nearest Zone success");

					return RequestHelper.getPushZoneLocationFromData(res.getResultData(), NetworkUtils.PUSH_VERSION);
				}
			}
			catch (Exception e)
			{
				exception = e;
			}
		}

		Log.e(TAG, "ERROR: sent Nearest Zon " + exception.getMessage() + ". Response = " + res, exception);
		throw exception;
	}
}
