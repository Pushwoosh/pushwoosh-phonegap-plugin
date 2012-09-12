package com.arellomobile.android.push.tags;

import android.content.Context;
import com.arellomobile.android.push.exception.PushWooshException;

import java.util.Map;

/**
 * Date: 27.08.12
 * Time: 14:29
 *
 * @author MiG35
 */
public class SendPushTagsAsyncTask extends SendPushTagsAbstractAsyncTask
{
	private SendPushTagsCallBack mCallBack;

	public SendPushTagsAsyncTask(Context context, SendPushTagsCallBack callBack)
	{
		super(context);

		mCallBack = callBack;
	}

	@Override
	public void taskStarted()
	{
		mCallBack.taskStarted();
	}

	@Override
	public void onSentTagsSuccess(Map<String, String> skippedTags)
	{
		mCallBack.onSentTagsSuccess(skippedTags);
	}

	@Override
	public void onSentTagsError(PushWooshException error)
	{
		mCallBack.onSentTagsError(error);
	}
}
