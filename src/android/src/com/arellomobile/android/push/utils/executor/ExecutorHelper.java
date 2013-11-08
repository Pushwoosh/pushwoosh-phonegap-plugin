package com.arellomobile.android.push.utils.executor;

import android.os.AsyncTask;
import android.os.Build;

/**
 * Date: 17.08.12
 * Time: 13:08
 *
 * @author mig35
 */
public class ExecutorHelper
{
	public static void executeAsyncTask(AsyncTask<Void, Void, Void> task)
	{
		if (null != task)
		{
			if (Build.VERSION.SDK_INT >= 11)
			{
				// see executeOnExecutor min sdk version
				V11ExecutorHelper.executeOnExecutor(task);
			}
			else
			{
				task.execute((Void) null);
			}
		}
	}
}
