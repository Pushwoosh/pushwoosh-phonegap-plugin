package com.pushwoosh.plugin.internal;

import com.pushwoosh.internal.PluginProvider;

public class PhonegapPluginProvider implements PluginProvider {
	@Override
	public String getPluginType() {
		try {
			//If contains class Cordova than it's cordova plugin
			Class.forName("org.apache.cordova.CordovaPlugin");
			return "Cordova";
		} catch (ClassNotFoundException ignore) {
            //Otherwise this is PhoneGap build
			return "PhoneGap Build";
		}
	}

	@Override
	public int richMediaStartDelay() {
		return DEFAULT_RICH_MEDIA_START_DELAY;
	}
}
