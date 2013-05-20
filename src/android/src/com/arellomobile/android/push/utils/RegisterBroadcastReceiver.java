package com.arellomobile.android.push.utils;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import com.arellomobile.android.push.PushManager;

/**
 * Date: 26.02.13
 * Time: 19:33
 *
 * @author MiG35
 */
public abstract class RegisterBroadcastReceiver extends BroadcastReceiver
{
	@Override
	public final void onReceive(Context context, Intent intent)
	{
		onRegisterActionReceive(context, intent);
		if (GeneralUtils.checkStickyBroadcastPermissions(context))
		{
			context.removeStickyBroadcast(new Intent(PushManager.REGISTER_BROAD_CAST_ACTION));
		}
	}

	protected abstract void onRegisterActionReceive(Context context, Intent intent);
}
