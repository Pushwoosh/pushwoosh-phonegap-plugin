//
//  Version__1_2.java
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
import org.json.JSONObject;

import java.util.Calendar;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Date: 17.08.12
 * Time: 10:25
 *
 * @author mig35
 */
public class Version__1_2 implements VersionHelper
{
	@Override
	public Map<String, Object> getRegistrationUnregistrationData(Context context, String deviceRegistrationID)
	{
		HashMap<String, Object> data = new HashMap<String, Object>();

		data.put("application", PreferenceUtils.getApplicationId(context));
		data.put("hw_id", GeneralUtils.getDeviceUUID(context));
		data.put("device_name", GeneralUtils.isTablet(context) ? "Tablet" : "Phone");
		data.put("device_type", "3");
		data.put("language", Locale.getDefault().getLanguage());
		data.put("timezone", Calendar.getInstance().getTimeZone().getRawOffset() / 1000); // converting from
		// milliseconds to seconds
		data.put("device_id", deviceRegistrationID);

		return data;
	}

	@Override
	public Map<String, Object> getSendPushStatData(Context context, String hash)
	{
		throw new UnsupportedOperationException("This feature requires 1.3 api");
	}
	
	public Map<String, Object> getSendGoalAchievedData(Context context, String goal, Integer count)
	{
		throw new UnsupportedOperationException("This feature requires 1.3 api");
	}

	@Override
	public Map<String, Object> getSendTagsData(Context context)
	{
		throw new UnsupportedOperationException("This feature requires 1.3 api");
	}

	@Override
	public Map<String, Object> getNearestZoneData(Context context, Location location)
	{
		throw new UnsupportedOperationException("This feature requires 1.3 api");
	}

	@Override
	public PushZoneLocation getPushZoneLocationFromData(JSONObject resultData)
	{
		throw new UnsupportedOperationException("This feature requires 1.3 api");
	}

	@Override
	public Map<String, Object> getSendAppOpenData(Context context) {
		throw new UnsupportedOperationException("This feature requires 1.3 api");
	}
	
	@Override
	public Map<String, Object> getAppRemovedData(Context context, String packageName) {
		throw new UnsupportedOperationException("This feature requires 1.3 api");
	}
}
