const {
  withAndroidManifest,
  withDangerousMod,
  AndroidConfig,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Inject a minimal AppWidgetProvider that reads nf_fit_today_widget.json
 * from the app files dir (written by JS syncTodayWidgetPayload).
 */

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeFile(filePath, contents) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, contents);
}

const PROVIDER_KT = `package app.nffit.dogfood.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import app.nffit.dogfood.MainActivity
import app.nffit.dogfood.R
import org.json.JSONObject
import java.io.File

class TodayWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    for (id in appWidgetIds) {
      val views = RemoteViews(context.packageName, R.layout.nf_fit_today_widget)
      val data = readPayload(context)
      views.setTextViewText(R.id.widget_title, data.optString("dateLocal", "Сегодня"))
      views.setTextViewText(R.id.widget_kcal, data.optString("energyLabel", "— ккал"))
      views.setTextViewText(R.id.widget_steps, data.optString("stepsLabel", "— шаг"))
      views.setTextViewText(R.id.widget_water, data.optString("waterLabel", "— мл"))
      val open = PendingIntent.getActivity(
        context,
        0,
        Intent(context, MainActivity::class.java),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
      views.setOnClickPendingIntent(R.id.widget_root, open)
      appWidgetManager.updateAppWidget(id, views)
    }
  }

  companion object {
    fun refreshAll(context: Context) {
      val mgr = AppWidgetManager.getInstance(context)
      val ids = mgr.getAppWidgetIds(ComponentName(context, TodayWidgetProvider::class.java))
      if (ids.isNotEmpty()) {
        TodayWidgetProvider().onUpdate(context, mgr, ids)
      }
    }
  }

  private fun readPayload(context: Context): JSONObject {
    return try {
      val file = File(context.filesDir, "nf_fit_today_widget.json")
      if (!file.exists()) JSONObject()
      else JSONObject(file.readText())
    } catch (_: Exception) {
      JSONObject()
    }
  }
}
`;

const LAYOUT_XML = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
  android:id="@+id/widget_root"
  android:layout_width="match_parent"
  android:layout_height="match_parent"
  android:orientation="vertical"
  android:padding="12dp"
  android:background="#FFFFFF">
  <TextView
    android:id="@+id/widget_title"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:textColor="#6B7280"
    android:textSize="12sp"
    android:text="Сегодня" />
  <TextView
    android:id="@+id/widget_kcal"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:textColor="#000000"
    android:textSize="22sp"
    android:textStyle="bold"
    android:text="— ккал" />
  <TextView
    android:id="@+id/widget_steps"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:textColor="#111827"
    android:textSize="14sp"
    android:text="— шаг" />
  <TextView
    android:id="@+id/widget_water"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:textColor="#6B7280"
    android:textSize="13sp"
    android:text="— мл" />
</LinearLayout>
`;

const INFO_XML = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
  android:minWidth="180dp"
  android:minHeight="110dp"
  android:updatePeriodMillis="1800000"
  android:initialLayout="@layout/nf_fit_today_widget"
  android:resizeMode="horizontal|vertical"
  android:widgetCategory="home_screen"
  android:description="@string/nf_fit_widget_description" />
`;

function withNfFitWidgets(config) {
  config = {
    ...config,
    extra: {
      ...(config.extra ?? {}),
      nfFitWidgets: {
        scaffold: false,
        version: 2,
        packageHint: 'app.nffit.dogfood',
        note: 'TodayWidgetProvider reads files/nf_fit_today_widget.json',
      },
    },
  };

  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.platformProjectRoot;
      const javaDir = path.join(
        projectRoot,
        'app/src/main/java/app/nffit/dogfood/widgets',
      );
      writeFile(path.join(javaDir, 'TodayWidgetProvider.kt'), PROVIDER_KT);
      writeFile(
        path.join(projectRoot, 'app/src/main/res/layout/nf_fit_today_widget.xml'),
        LAYOUT_XML,
      );
      writeFile(
        path.join(projectRoot, 'app/src/main/res/xml/nf_fit_today_widget_info.xml'),
        INFO_XML,
      );

      const stringsPath = path.join(projectRoot, 'app/src/main/res/values/strings.xml');
      if (fs.existsSync(stringsPath)) {
        let strings = fs.readFileSync(stringsPath, 'utf8');
        if (!strings.includes('nf_fit_widget_description')) {
          strings = strings.replace(
            '</resources>',
            '  <string name="nf_fit_widget_description">Шаги и ккал дня (nf-fit)</string>\n</resources>',
          );
        }
        if (!strings.includes('nf_fit_widget_name')) {
          strings = strings.replace(
            '</resources>',
            '  <string name="nf_fit_widget_name">nf-fit · день</string>\n</resources>',
          );
        }
        fs.writeFileSync(stringsPath, strings);
      } else {
        writeFile(
          stringsPath,
          `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <string name="nf_fit_widget_description">Шаги и ккал дня (nf-fit)</string>
  <string name="nf_fit_widget_name">nf-fit · день</string>
</resources>
`,
        );
      }
      // Refresh widgets when app resumes (best-effort patch).
      const mainActivity = path.join(
        projectRoot,
        'app/src/main/java/app/nffit/dogfood/MainActivity.kt',
      );
      if (fs.existsSync(mainActivity)) {
        let src = fs.readFileSync(mainActivity, 'utf8');
        if (!src.includes('TodayWidgetProvider.refreshAll')) {
          if (!src.includes('override fun onResume')) {
            src = src.replace(
              'override fun getMainComponentName(): String = "main"',
              `override fun onResume() {
    super.onResume()
    try {
      app.nffit.dogfood.widgets.TodayWidgetProvider.refreshAll(this)
    } catch (_: Exception) {
    }
  }

  override fun getMainComponentName(): String = "main"`,
            );
            fs.writeFileSync(mainActivity, src);
          }
        }
      }
      return cfg;
    },
  ]);

  config = withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    const receivers = app.receiver ?? [];
    const name = 'app.nffit.dogfood.widgets.TodayWidgetProvider';
    const already = receivers.some(
      (r) => r.$?.['android:name'] === name || r.$?.['android:name'] === '.widgets.TodayWidgetProvider',
    );
    if (!already) {
      receivers.push({
        $: {
          'android:name': name,
          'android:exported': 'true',
          'android:label': '@string/nf_fit_widget_name',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/nf_fit_today_widget_info',
            },
          },
        ],
      });
      app.receiver = receivers;
    }
    return cfg;
  });

  return config;
}

module.exports = withNfFitWidgets;
