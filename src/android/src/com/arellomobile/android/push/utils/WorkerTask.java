package com.arellomobile.android.push.utils;

import android.content.Context;
import android.os.AsyncTask;

/**
 * Date: 17.08.12
 * Time: 13:06
 *
 * @author mig35
 */
public abstract class WorkerTask extends AsyncTask<Void, Void, Void>
{
	private Context mContext;

	protected WorkerTask(Context context)
	{
		mContext = context;
	}

	@Override
	protected Void doInBackground(Void... aVoids)
	{
		try
		{
			doWork(mContext);
		}
		catch (Throwable e)
		{
			// pass
		}
		finally
		{
			mContext = null;
		}

		return null;
	}

	protected abstract void doWork(Context context) throws Exception;
}
