//
//  PushWebview.java
//
// Pushwoosh Push Notifications SDK
// www.pushwoosh.com
//
// MIT Licensed

package com.arellomobile.android.push;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class PushWebview extends Activity
{
	public void onCreate(Bundle savedInstanceState)
	{
		super.onCreate(savedInstanceState);

		WebView webView = new WebView(this);

		String url = getIntent().getStringExtra("url");

		webView.getSettings().setJavaScriptEnabled(true);
		webView.setWebViewClient(new HelloWebViewClient());
		webView.reload();

		webView.loadUrl(url);

		setContentView(webView);
	}

	private class HelloWebViewClient extends WebViewClient
	{
		@Override
		public boolean shouldOverrideUrlLoading(WebView view, String url)
		{
			//finish activity when browser starts
			finish();

			Uri uri = Uri.parse(url);
			Intent intent = new Intent(Intent.ACTION_VIEW, uri);
			startActivity(intent);

			return false;
		}
	}
}
