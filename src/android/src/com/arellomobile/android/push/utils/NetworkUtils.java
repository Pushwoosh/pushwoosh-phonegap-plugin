//
//  NetworkUtils.java
//
// Pushwoosh Push Notifications SDK
// www.pushwoosh.com
//
// MIT Licensed
package com.arellomobile.android.push.utils;

import android.util.Log;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;

/**
 * Date: 16.08.12
 * Time: 20:38
 *
 * @author mig35
 */
public class NetworkUtils
{
	private static final String TAG = "PushWoosh: NetworkUtils";

	public static final int MAX_TRIES = 5;

	public static final String PUSH_VERSION = "1.3";
	
	public static boolean useSSL = false;
	
	private static final String BASE_URL_SECURE = "https://cp.pushwoosh.com/json/" + PUSH_VERSION + "/";
	private static final String BASE_URL = "http://cp.pushwoosh.com/json/" + PUSH_VERSION + "/";


	public static NetworkResult makeRequest(Map<String, Object> data, String methodName) throws Exception
	{
		NetworkResult result = new NetworkResult(500, 0, null);
		OutputStream connectionOutput = null;
		InputStream inputStream = null;
		try
		{
			String urlString = NetworkUtils.BASE_URL + methodName;
			if(useSSL)
				urlString = NetworkUtils.BASE_URL_SECURE + methodName;
			
			URL url = new URL(urlString);
			HttpURLConnection connection = (HttpURLConnection) url.openConnection();
			connection.setRequestMethod("POST");
			connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");

			connection.setDoOutput(true);


			JSONObject innerRequestJson = new JSONObject();

			for (String key : data.keySet())
			{
				innerRequestJson.put(key, data.get(key));
			}

			JSONObject requestJson = new JSONObject();
			requestJson.put("request", innerRequestJson);

			connection.setRequestProperty("Content-Length", String.valueOf(requestJson.toString().getBytes().length));

			connectionOutput = connection.getOutputStream();
			connectionOutput.write(requestJson.toString().getBytes());
			connectionOutput.flush();
			connectionOutput.close();

			inputStream = new BufferedInputStream(connection.getInputStream());

			ByteArrayOutputStream dataCache = new ByteArrayOutputStream();

			// Fully read data
			byte[] buff = new byte[1024];
			int len;
			while ((len = inputStream.read(buff)) >= 0)
			{
				dataCache.write(buff, 0, len);
			}

			// Close streams
			dataCache.close();

			String jsonString = new String(dataCache.toByteArray()).trim();
			Log.w(TAG, "PushWooshResult: " + jsonString);

			JSONObject resultJSON = new JSONObject(jsonString);

			result.setData(resultJSON);
			result.setCode(connection.getResponseCode());
			result.setPushwooshCode(resultJSON.getInt("status_code"));
		}
		finally
		{
			if (null != inputStream)
			{
				inputStream.close();
			}
			if (null != connectionOutput)
			{
				connectionOutput.close();
			}
		}

		return result;
	}

	public static class NetworkResult
	{
		private int mPushwooshCode;
		private int mResultCode;
		private JSONObject mResultData;

		public NetworkResult(int networkCode, int pushwooshCode, JSONObject data)
		{
			mResultCode = networkCode;
			mPushwooshCode = pushwooshCode;
			mResultData = data;
		}

		public void setCode(int code)
		{
			mResultCode = code;
		}

		public void setPushwooshCode(int code)
		{
			mPushwooshCode = code;
		}

		public void setData(JSONObject data)
		{
			mResultData = data;
		}

		public int getResultCode()
		{
			return mResultCode;
		}

		public int getPushwooshCode()
		{
			return mPushwooshCode;
		}

		public JSONObject getResultData()
		{
			return mResultData;
		}
	}
}
