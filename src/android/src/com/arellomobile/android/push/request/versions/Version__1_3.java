//
//  Version__1_3.java
//
// Pushwoosh Push Notifications SDK
// www.pushwoosh.com
//
// MIT Licensed
package com.arellomobile.android.push.request.versions;

import android.content.Context;
import android.location.Location;
import com.arellomobile.android.push.data.PushZoneLocation;
import com.arellomobile.android.push.utils.GeneralUtils;
import com.arellomobile.android.push.utils.PreferenceUtils;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Date: 17.08.12
 * Time: 10:24
 *
 * @author mig35
 */
public class Version__1_3 implements VersionHelper
{
	@Override
	public Map<String, Object> getRegistrationUnregistrationData(Context context, String deviceRegistrationID)
	{
		HashMap<String, Object> data = new HashMap<String, Object>();

		data.put("application", PreferenceUtils.getApplicationId(context));
		data.put("hwid", GeneralUtils.getDeviceUUID(context));
		data.put("device_name", GeneralUtils.isTablet(context) ? "Tablet" : "Phone");
		data.put("device_type", "3");
		data.put("language", Locale.getDefault().getLanguage());
		data.put("timezone", Calendar.getInstance().getTimeZone().getRawOffset() / 1000); // converting from
		// milliseconds to seconds
		data.put("push_token", deviceRegistrationID);

		return data;
	}

	@Override
	public Map<String, Object> getSendPushStatData(Context context, String hash)
	{
		Map<String, Object> data = new HashMap<String, Object>();

		data.put("application", PreferenceUtils.getApplicationId(context));
		data.put("hwid", GeneralUtils.getDeviceUUID(context));
		data.put("hash", hash);

		return data;
	}
	
	@Override
	public Map<String, Object> getSendGoalAchievedData(Context context, String goal, Integer count)
	{
		Map<String, Object> data = new HashMap<String, Object>();

		data.put("application", PreferenceUtils.getApplicationId(context));
		data.put("hwid", GeneralUtils.getDeviceUUID(context));
		data.put("goal", goal);
		
		if(count != null)
			data.put("count", count);

		return data;		
	}

	@Override
	public Map<String, Object> getSendTagsData(Context context)
	{
		Map<String, Object> data = new HashMap<String, Object>();

		data.put("application", PreferenceUtils.getApplicationId(context));
		data.put("hwid", GeneralUtils.getDeviceUUID(context));

		return data;
	}

	@Override
	public Map<String, Object> getNearestZoneData(Context context, Location location)
	{
		Map<String, Object> data = new HashMap<String, Object>();

		data.put("application", PreferenceUtils.getApplicationId(context));
		data.put("hwid", GeneralUtils.getDeviceUUID(context));
		data.put("lat", location.getLatitude());
		data.put("lng", location.getLongitude());

		return data;
	}

	@Override
	public PushZoneLocation getPushZoneLocationFromData(JSONObject resultData) throws JSONException
	{
		JSONObject response = resultData.getJSONObject("response");

		PushZoneLocation location = new PushZoneLocation();

		location.setName(response.getString("name"));
		location.setLat(response.getDouble("lat"));
		location.setLng(response.getDouble("lng"));
		location.setDistanceTo(response.getLong("distance"));

		return location;
	}

	@Override
	public Map<String, Object> getSendAppOpenData(Context context) {
		Map<String, Object> data = new HashMap<String, Object>();

		data.put("application", PreferenceUtils.getApplicationId(context));
		data.put("hwid", GeneralUtils.getDeviceUUID(context));

		return data;
	}
}
