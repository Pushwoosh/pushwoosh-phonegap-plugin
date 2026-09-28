package com.pushwoosh.plugin.internal;

import com.pushwoosh.internal.PluginProvider;

public class PhonegapPluginProvider implements PluginProvider {
	private static final String PLUGIN_TYPE = "Cordova";
	private static final String PLUGIN_VERSION = "8.3.76";

	@Override
	public String getPluginType() {
		return PLUGIN_TYPE;
	}

	// No @Override: PluginProvider gains getPluginVersion() only in the next Android SDK release.
	public String getPluginVersion() {
		return PLUGIN_VERSION;
	}

	@Override
	public int richMediaStartDelay() {
		return DEFAULT_RICH_MEDIA_START_DELAY;
	}
}
