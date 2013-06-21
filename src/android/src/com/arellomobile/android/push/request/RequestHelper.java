//
//  RequestHelper.java
//
// Pushwoosh Push Notifications SDK
// www.pushwoosh.com
//
// MIT Licensed
package com.arellomobile.android.push.request;

import android.content.Context;
import android.location.Location;
import com.arellomobile.android.push.data.PushZoneLocation;
import com.arellomobile.android.push.utils.GeneralUtils;
import com.arellomobile.android.push.utils.PreferenceUtils;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Date: 17.08.12
 * Time: 10:24
 *
 * @author mig35
 */
public class RequestHelper
{
	static public Map<String, Object> getRegistrationUnregistrationData(Context context, String deviceRegistrationID)
	{
		HashMap<String, Object> data = new HashMap<String, Object>();

		data.put("application", PreferenceUtils.getApplicationId(context));
		data.put("hwid", GeneralUtils.getDeviceUUID(context));
		data.put("device_name", GeneralUtils.isTablet(context) ? "Tablet" : "Phone");
		data.put("device_type", "3");
		data.put("language", Locale.getDefault().getLanguage());
		data.put("timezone", Calendar.getInstance().getTimeZone().getRawOffset() / 1000); // converting from milliseconds to seconds

		String packageName = context.getApplicationContext().getPackageName();
		data.put("android_package", packageName);
		data.put("push_token", deviceRegistrationID);

		return data;
	}

	static public Map<String, Object> getSendPushStatData(Context context, String hash)
	{
		Map<String, Object> data = new HashMap<String, Object>();

		data.put("application", PreferenceUtils.getApplicationId(context));
		data.put("hwid", GeneralUtils.getDeviceUUID(context));
		data.put("hash", hash);

		return data;
	}
	
	static public Map<String, Object> getSendGoalAchievedData(Context context, String goal, Integer count)
	{
		Map<String, Object> data = new HashMap<String, Object>();

		data.put("application", PreferenceUtils.getApplicationId(context));
		data.put("hwid", GeneralUtils.getDeviceUUID(context));
		data.put("goal", goal);
		
		if(count != null)
			data.put("count", count);

		return data;		
	}

	static public Map<String, Object> getSendTagsData(Context context)
	{
		Map<String, Object> data = new HashMap<String, Object>();

		data.put("application", PreferenceUtils.getApplicationId(context));
		data.put("hwid", GeneralUtils.getDeviceUUID(context));

		return data;
	}

	static public Map<String, Object> getNearestZoneData(Context context, Location location)
	{
		Map<String, Object> data = new HashMap<String, Object>();

		data.put("application", PreferenceUtils.getApplicationId(context));
		data.put("hwid", GeneralUtils.getDeviceUUID(context));
		data.put("lat", location.getLatitude());
		data.put("lng", location.getLongitude());

		return data;
	}

	static public PushZoneLocation getPushZoneLocationFromData(JSONObject resultData) throws JSONException
	{
		JSONObject response = resultData.getJSONObject("response");

		PushZoneLocation location = new PushZoneLocation();

		location.setName(response.getString("name"));
		location.setLat(response.getDouble("lat"));
		location.setLng(response.getDouble("lng"));
		location.setDistanceTo(response.getLong("distance"));

		return location;
	}

	static public Map<String, Object> getSendAppOpenData(Context context) {
		Map<String, Object> data = new HashMap<String, Object>();

		data.put("application", PreferenceUtils.getApplicationId(context));
		data.put("hwid", GeneralUtils.getDeviceUUID(context));

		return data;
	}
	
	static public Map<String, Object> getAppRemovedData(Context context, String packageName) {
		Map<String, Object> data = new HashMap<String, Object>();

		data.put("application", PreferenceUtils.getApplicationId(context));
		data.put("android_package", packageName);
		data.put("hwid", GeneralUtils.getDeviceUUID(context));

		return data;
	}
	
	static public Map<String, Object> getGetTagsData(Context context) {
		Map<String, Object> data = new HashMap<String, Object>();

		data.put("application", PreferenceUtils.getApplicationId(context));
		data.put("hwid", GeneralUtils.getDeviceUUID(context));

		return data;		
	}

	public static Map<String, Object> getTagsFromData(JSONObject resultData) {
		Map<String, Object> result = new HashMap<String, Object>();

		try {
			JSONObject response = resultData.getJSONObject("response");
			JSONObject jsonResult = response.getJSONObject("result");
			
			@SuppressWarnings("unchecked")
			Iterator<String> keys = jsonResult.keys();
			while(keys.hasNext()) {
				String key = keys.next();
				result.put(key, jsonResult.get(key));
			}
		} catch (JSONException e) {
			e.printStackTrace();
			return new HashMap<String, Object>();
		}

		return result;
	}
}
