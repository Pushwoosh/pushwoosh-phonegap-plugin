package com.arellomobile.android.push;

import com.arellomobile.android.push.utils.WorkerTask;
import com.arellomobile.android.push.utils.executor.ExecutorHelper;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.AsyncTask;

public class PackageRemoveReceiver extends BroadcastReceiver
{

	@Override
	public void onReceive(Context context, Intent intent) {
		if (!Intent.ACTION_PACKAGE_REMOVED.equals(intent.getAction()))
			return;

		Uri uri = intent.getData();
		String pkg = uri != null ? uri.getSchemeSpecificPart() : null;

		if (pkg == null)
			return;
		
		sendPackageRemoved(context, pkg);
	}
   
	private void sendPackageRemoved(Context context, final String packageName)
	{
		AsyncTask<Void, Void, Void> task;
		try
		{
			task = new WorkerTask(context)
			{
				@Override
				protected void doWork(Context context)
				{
					DeviceFeature2_5.sendAppRemovedData(context, packageName);
				}
			};
		}
		catch (Throwable e)
		{
			// we are not in UI thread. Simple run our registration
			DeviceFeature2_5.sendAppRemovedData(context, packageName);
			return;
		}
		ExecutorHelper.executeAsyncTask(task);
	}
}
