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
import com.arellomobile.android.push.request.versions.VersionHelper;
import com.arellomobile.android.push.request.versions.Version__1_2;
import com.arellomobile.android.push.request.versions.Version__1_3;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

/**
 * Date: 17.08.12
 * Time: 10:24
 *
 * @author mig35
 */
public class RequestHelper
{
	private static final Map<String, VersionHelper> sVersionHelpers;

	static
	{
		sVersionHelpers = new HashMap<String, VersionHelper>();

		sVersionHelpers.put("1.1", new Version__1_2());
		sVersionHelpers.put("1.2", new Version__1_2());
		sVersionHelpers.put("1.3", new Version__1_3());
	}

	public static Map<String, Object> getRegistrationUnregistrationData(Context context, String deviceRegistrationID,
			String pushVersion)
	{
		VersionHelper versionHelper = getVersionHelper(pushVersion);

		return versionHelper.getRegistrationUnregistrationData(context, deviceRegistrationID);
	}

	public static Map<String, Object> getSendPushStatData(Context context, String hash, String pushVersion)
	{
		VersionHelper versionHelper = getVersionHelper(pushVersion);

		return versionHelper.getSendPushStatData(context, hash);
	}

	public static Map<String, Object> getSendGoalAchievedData(Context context, String goal, Integer count, String pushVersion)
	{
		VersionHelper versionHelper = getVersionHelper(pushVersion);

		return versionHelper.getSendGoalAchievedData(context, goal, count);
	}
	
	public static Map<String, Object> getSendAppOpenData(Context context, String pushVersion)
	{
		VersionHelper versionHelper = getVersionHelper(pushVersion);

		return versionHelper.getSendAppOpenData(context);
	}

	public static Map<String, Object> getSendTagsData(Context context, String pushVersion)
	{
		VersionHelper versionHelper = sVersionHelpers.get(pushVersion);

		return versionHelper.getSendTagsData(context);
	}

	public static Map<String, Object> getNearestZoneData(Context context, Location location, String pushVersion)
	{
		VersionHelper versionHelper = sVersionHelpers.get(pushVersion);

		return versionHelper.getNearestZoneData(context, location);
	}

	public static PushZoneLocation getPushZoneLocationFromData(JSONObject resultData, String pushVersion)
			throws Exception
	{
		VersionHelper versionHelper = sVersionHelpers.get(pushVersion);

		return versionHelper.getPushZoneLocationFromData(resultData);
	}

	private static VersionHelper getVersionHelper(String pushVersion)
	{
		VersionHelper versionHelper = sVersionHelpers.get(pushVersion);

		if (null == versionHelper)
		{
			throw new RuntimeException("No Version Request Helper sent to version №" + pushVersion);
		}
		return versionHelper;
	}
	
	public static Map<String, Object> getAppRemovedData(Context context, String packageName, String pushVersion)
	{
		VersionHelper versionHelper = sVersionHelpers.get(pushVersion);

		return versionHelper.getAppRemovedData(context, packageName);
	}
}
