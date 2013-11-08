package com.arellomobile.android.push.tags;

import android.content.Context;
import android.os.AsyncTask;
import com.arellomobile.android.push.PushManager;
import com.arellomobile.android.push.exception.PushWooshException;

import java.util.Map;

/**
 * Date: 27.08.12
 * Time: 14:29
 *
 * @author MiG35
 */
public abstract class SendPushTagsAbstractAsyncTask extends AsyncTask<Map<String, Object>, Void, Map<String, String>>
		implements SendPushTagsCallBack
{
	private Context mContext;
	private PushWooshException mError;

	public SendPushTagsAbstractAsyncTask(Context context)
	{
		mContext = context;
	}

	@Override
	protected void onPreExecute()
	{
		super.onPreExecute();

		taskStarted();
	}

	@Override
	protected Map<String, String> doInBackground(Map<String, Object>... maps)
	{
		try
		{
			if (maps.length != 1)
			{
				throw new PushWooshException("Wrong parameters");
			}

			Map<String, String> result = PushManager.sendTagsFromBG(mContext, maps[0]);
			mContext = null;
			return result;
		}
		catch (PushWooshException e)
		{
			mError = e;
			mContext = null;
			return null;
		}
	}

	@Override
	protected void onPostExecute(Map<String, String> skippedTags)
	{
		super.onPostExecute(skippedTags);

		if (null != mError)
		{
			onSentTagsError(mError);
		}
		else
		{
			onSentTagsSuccess(skippedTags);
		}
	}
}
