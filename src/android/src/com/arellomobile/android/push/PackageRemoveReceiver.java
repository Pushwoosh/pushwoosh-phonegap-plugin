package com.arellomobile.android.push;

import com.arellomobile.android.push.utils.WorkerTask;
import com.arellomobile.android.push.utils.executor.ExecutorHelper;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Handler;
import android.os.Looper;

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
   
	private void sendPackageRemoved(final Context context, final String packageName)
	{
		Handler handler = new Handler(context.getMainLooper());
		handler.post(new Runnable() {
			public void run() {
				AsyncTask<Void, Void, Void> task = new WorkerTask(context)
				{
					@Override
					protected void doWork(Context context)
					{
						try {
							DeviceFeature2_5.sendAppRemovedData(context, packageName);
						} catch (Exception e) {
//								e.printStackTrace();
						}
					}
				};

				ExecutorHelper.executeAsyncTask(task);
			}
		});
	}
}
