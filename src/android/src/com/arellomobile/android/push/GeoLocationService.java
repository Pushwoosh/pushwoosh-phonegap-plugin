package com.arellomobile.android.push;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;
import com.arellomobile.android.push.data.PushZoneLocation;
import com.arellomobile.android.push.utils.executor.ExecutorHelper;
import com.arellomobile.android.push.utils.WorkerTask;
import com.google.android.gcm.GCMRegistrar;

/**
 * Date: 17.08.12
 * Time: 12:23
 *
 * @author mig35
 */
public class GeoLocationService extends Service
{
	private static final int TEN_SECONDS = 10000;
	private static final int TEN_METERS = 10;
	private static final int TWO_MINUTES = 1000 * 60 * 2;

	private final Object mSyncObject = new Object();

	private PowerManager.WakeLock mWakeLock;
	private LocationManager mLocationManager;
	private boolean mIfUpdating = false;

	private Location mOldLocation;
	private long mMinDistance;

	@Override
	public int onStartCommand(android.content.Intent intent, int flags, int startId)
	{
		super.onStartCommand(intent, flags, startId);

		initService();

		return START_STICKY;
	}

	@Override
	public void onDestroy()
	{
		super.onDestroy();

		mLocationManager.removeUpdates(mListener);
		mWakeLock.release();
		mWakeLock = null;
		mLocationManager = null;
	}

	@Override
	public IBinder onBind(Intent intent)
	{
		return null;
	}

	private void initService()
	{
		PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
		mWakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, getClass().getName());
		mWakeLock.acquire();
		mLocationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
		Location gpsLocation;
		Location networkLocation;
		synchronized (mSyncObject)
		{
			mLocationManager.removeUpdates(mListener);

			gpsLocation = requestUpdatesFromProvider(LocationManager.GPS_PROVIDER, TEN_METERS);
			networkLocation = requestUpdatesFromProvider(LocationManager.NETWORK_PROVIDER, TEN_METERS);
		}

		// If both providers return last known locations, compare the two and use the better
		// one to update the UI.  If only one provider returns a location, use it.
		if (gpsLocation != null && networkLocation != null)
		{
			updateLocation(getBetterLocation(gpsLocation, networkLocation));
		}
		else if (gpsLocation != null)
		{
			updateLocation(gpsLocation);
		}
		else if (networkLocation != null)
		{
			updateLocation(networkLocation);
		}
	}

	private void updateLocation(final Location location)
	{
		synchronized (mSyncObject)
		{
			if (!mIfUpdating && GCMRegistrar.isRegisteredOnServer(this))
			{
				if (null != mOldLocation && location.distanceTo(mOldLocation) < mMinDistance)
				{
					return;
				}

				mOldLocation = location;

				mLocationManager.removeUpdates(mListener);

				mIfUpdating = true;

				AsyncTask<Void, Void, Void> task = new WorkerTask(this)
				{
					protected PushZoneLocation mZoneLocation;

					@Override
					protected void doWork(Context context) throws Exception
					{
						mZoneLocation = DeviceFeature2_5.getNearestZone(context, location);
					}

					@Override
					protected void onPostExecute(Void result)
					{
						super.onPostExecute(result);

						synchronized (mSyncObject)
						{
							long distance = 0;

							if (null != mZoneLocation)
							{
								distance = mZoneLocation.getDistanceTo();
							}

							distance = Math.max(TEN_METERS, distance);

							requestUpdatesFromProvider(LocationManager.GPS_PROVIDER, distance);
							requestUpdatesFromProvider(LocationManager.NETWORK_PROVIDER, distance);

							mIfUpdating = false;
						}
					}
				};
				ExecutorHelper.executeAsyncTask(task);
			}
		}
	}

	private Location requestUpdatesFromProvider(final String provider, long distance)
	{
		mMinDistance = distance;

		Location location = null;
		try
		{
			if (mLocationManager.isProviderEnabled(provider))
			{
				mLocationManager.requestLocationUpdates(provider, TEN_SECONDS, distance, mListener);
				location = mLocationManager.getLastKnownLocation(provider);
			}
		}
		catch (Exception e)
		{
			Log.e(getClass().getName(), "Check ACCESS_FINE_LOCATION permission", e);
		}
		return location;
	}

	/**
	 * Determines whether one Location reading is better than the current Location fix.
	 * Code taken from
	 * http://developer.android.com/guide/topics/location/obtaining-user-location.html
	 *
	 * @param newLocation         The new Location that you want to evaluate
	 * @param currentBestLocation The current Location fix, to which you want to compare the new
	 *                            one
	 * @return The better Location object based on recency and accuracy.
	 */
	protected Location getBetterLocation(final Location newLocation, final Location currentBestLocation)
	{
		if (currentBestLocation == null)
		{
			// A new location is always better than no location
			return newLocation;
		}

		// Check whether the new location fix is newer or older
		long timeDelta = newLocation.getTime() - currentBestLocation.getTime();
		boolean isSignificantlyNewer = timeDelta > TWO_MINUTES;
		boolean isSignificantlyOlder = timeDelta < -TWO_MINUTES;
		boolean isNewer = timeDelta > 0;

		// If it's been more than two minutes since the current location, use the new location
		// because the user has likely moved.
		if (isSignificantlyNewer)
		{
			return newLocation;
			// If the new location is more than two minutes older, it must be worse
		}
		else if (isSignificantlyOlder)
		{
			return currentBestLocation;
		}

		// Check whether the new location fix is more or less accurate
		int accuracyDelta = (int) (newLocation.getAccuracy() - currentBestLocation.getAccuracy());
		boolean isLessAccurate = accuracyDelta > 0;
		boolean isMoreAccurate = accuracyDelta < 0;
		boolean isSignificantlyLessAccurate = accuracyDelta > 200;

		// Check if the old and new location are from the same provider
		boolean isFromSameProvider = isSameProvider(newLocation.getProvider(), currentBestLocation.getProvider());

		// Determine location quality using a combination of timeliness and accuracy
		if (isMoreAccurate)
		{
			return newLocation;
		}
		else if (isNewer && !isLessAccurate)
		{
			return newLocation;
		}
		else if (isNewer && !isSignificantlyLessAccurate && isFromSameProvider)
		{
			return newLocation;
		}
		return currentBestLocation;
	}

	/**
	 * Checks whether two providers are the same
	 */
	private boolean isSameProvider(String provider1, String provider2)
	{
		if (provider1 == null)
		{
			return provider2 == null;
		}
		return provider1.equals(provider2);
	}

	private final LocationListener mListener = new LocationListener()
	{

		@Override
		public void onLocationChanged(Location location)
		{
			// A new location update is received.  Do something useful with it.
			updateLocation(location);
		}

		@Override
		public void onProviderDisabled(String provider)
		{
		}

		@Override
		public void onProviderEnabled(String provider)
		{
		}

		@Override
		public void onStatusChanged(String provider, int status, Bundle extras)
		{
		}
	};
}
