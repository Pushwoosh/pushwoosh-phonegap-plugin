package com.pushwoosh.plugin.pushnotifications;

import android.content.Context;
import android.content.res.AssetManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.support.annotation.Nullable;

import com.pushwoosh.inbox.ui.PushwooshInboxStyle;
import com.pushwoosh.inbox.ui.model.customizing.formatter.InboxDateFormatter;

import org.json.JSONObject;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

class InboxUiStyleManager {

    private static class StyleParser {
        private JSONObject style;
        private Context context;

        private static Integer parseColor(String colorString) {
            if (colorString == null || colorString.length() == 0) {
                return null;
            }

            if (!colorString.matches("^(#[0-9A-Fa-f]{3}|(0x|#)([0-9A-Fa-f]{2})?[0-9A-Fa-f]{6})$")) {
                return null;
            }

            // #FAB to #FFAABB
            if (colorString.startsWith("#") && colorString.length() == 4) {
                String r = colorString.substring(1, 2);
                String g = colorString.substring(2, 3);
                String b = colorString.substring(3, 4);
                colorString = "#" + r + r + g + g + b + b;
            }

            // 0xRRGGBB to #RRGGBB
            colorString = colorString.replace("0x", "#");

            return Color.parseColor(colorString);
        }

        private Integer optColor(String key, Integer defaultValue) {
            Integer color = parseColor(style.optString(key));
            if (color == null)
                return defaultValue;
            return color;
        }

        private InboxDateFormatter optDateFormatter(String key, InboxDateFormatter defaultValue) {
            String dateFormat = style.optString(key);
            if (dateFormat != null && !dateFormat.isEmpty()) {
                final SimpleDateFormat simpleDateFormat = new SimpleDateFormat(dateFormat, Locale.getDefault());
                return new InboxDateFormatter() {
                    @Override
                    public String transform(Date date) {
                        return simpleDateFormat.format(date);
                    }
                };
            }
            return defaultValue;
        }

        @Nullable
        private Drawable getDrawable(String assetPath) throws IOException {
            if (context != null) {
                AssetManager assetManager = context.getAssets();
                Bitmap bitmap = BitmapFactory.decodeStream(assetManager.open("www/" + assetPath));
                return new BitmapDrawable(context.getResources(), bitmap);
            }
            return null;
        }

        private Drawable optImage(String key, Drawable defaultValue) {
            String imagePath = style.optString(key);
            if (imagePath != null && imagePath.length() != 0) {
                try {
                    return getDrawable(imagePath);
                }
                catch (IOException e) {
                    e.printStackTrace();
                }

            }
            return defaultValue;
        }

        public StyleParser(Context context, JSONObject styleObject) {
            this.context = context;
            this.style = styleObject;
        }

        public void parse() {
            PushwooshInboxStyle style = PushwooshInboxStyle.INSTANCE;

            style.setBarBackgroundColor(optColor("barBackgroundColor", style.getBarBackgroundColor()));
            style.setBarAccentColor(optColor("barAccentColor", style.getBarAccentColor()));
            style.setBarTextColor(optColor("barTextColor", style.getBarTextColor()));
            style.setBarTitle(this.style.optString("barTitle", style.getBarTitle()));

            style.setDateFormatter(optDateFormatter("dateFormat", style.getDateFormatter()));

            style.setListErrorMessage(this.style.optString("listErrorMessage", style.getListErrorMessage() != null ?  style.getListErrorMessage().toString() : ""));
            style.setListEmptyText(this.style.optString("listEmptyMessage", style.getListEmptyText() != null ? style.getListEmptyText().toString() : ""));

            style.setDefaultImageIconDrawable(optImage("defaultImageIcon", style.getDefaultImageIconDrawable()));
            style.setListErrorImageDrawable(optImage("listErrorImage", style.getListErrorImageDrawable()));
            style.setListEmptyImageDrawable(optImage("listEmptyImage", style.getListEmptyImageDrawable()));

            style.setAccentColor(optColor("accentColor", style.getAccentColor()));
            style.setHighlightColor(optColor("highlightColor", style.getHighlightColor()));
            style.setBackgroundColor(optColor("backgroundColor", style.getBackgroundColor()));
            style.setDividerColor(optColor("dividerColor", style.getDividerColor()));
            style.setDateColor(optColor("dateColor", style.getDateColor()));
            style.setReadDateColor(optColor("readDateColor", style.getReadDateColor()));
            style.setTitleColor(optColor("titleColor", style.getTitleColor()));
            style.setReadTitleColor(optColor("readTitleColor", style.getReadTitleColor()));
            style.setDescriptionColor(optColor("descriptionColor", style.getDescriptionColor()));
            style.setReadDescriptionColor(optColor("readDescriptionColor", style.getReadDescriptionColor()));
        }
    }

    public static void setStyle(Context context, JSONObject styleObject) {
        if (styleObject != null)
            new StyleParser(context, styleObject).parse();
    }

}
