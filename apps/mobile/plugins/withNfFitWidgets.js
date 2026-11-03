const {
  withAndroidManifest,
  withDangerousMod,
  AndroidConfig,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Inject AppWidgetProviders that read nf_fit_today_widget.json
 * from the app files dir (written by JS syncTodayWidgetPayload).
 * Variants: Today (full day) · Compact (kcal) · Movement (steps+sleep).
 */

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeFile(filePath, contents) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, contents);
}

const PAYLOAD_KT = `package app.nffit.dogfood.widgets

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import app.nffit.dogfood.MainActivity
import org.json.JSONObject
import java.io.File

internal object WidgetPayload {
  fun read(context: Context): JSONObject {
    return try {
      val file = File(context.filesDir, "nf_fit_today_widget.json")
      if (!file.exists()) JSONObject()
      else JSONObject(file.readText())
    } catch (_: Exception) {
      JSONObject()
    }
  }

  fun openApp(context: Context): PendingIntent {
    return PendingIntent.getActivity(
      context,
      0,
      Intent(context, MainActivity::class.java),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }
}
`;

const TODAY_PROVIDER_KT = `package app.nffit.dogfood.widgets

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.widget.RemoteViews
import app.nffit.dogfood.R

class TodayWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    for (id in appWidgetIds) {
      val views = RemoteViews(context.packageName, R.layout.nf_fit_today_widget)
      val data = WidgetPayload.read(context)
      views.setTextViewText(R.id.widget_title, data.optString("dateLocal", "Сегодня"))
      views.setTextViewText(R.id.widget_kcal, data.optString("energyLabel", "— ккал"))
      views.setTextViewText(R.id.widget_steps, data.optString("stepsLabel", "— шаг"))
      views.setTextViewText(R.id.widget_water, data.optString("waterLabel", "— мл"))
      views.setTextViewText(R.id.widget_sleep, data.optString("sleepLabel", "— ч"))
      views.setOnClickPendingIntent(R.id.widget_root, WidgetPayload.openApp(context))
      appWidgetManager.updateAppWidget(id, views)
    }
  }

  companion object {
    fun refreshAll(context: Context) {
      val mgr = AppWidgetManager.getInstance(context)
      val ids = mgr.getAppWidgetIds(ComponentName(context, TodayWidgetProvider::class.java))
      if (ids.isNotEmpty()) TodayWidgetProvider().onUpdate(context, mgr, ids)
    }
  }
}
`;

const COMPACT_PROVIDER_KT = `package app.nffit.dogfood.widgets

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.widget.RemoteViews
import app.nffit.dogfood.R

class CompactKcalWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    for (id in appWidgetIds) {
      val views = RemoteViews(context.packageName, R.layout.nf_fit_compact_widget)
      val data = WidgetPayload.read(context)
      views.setTextViewText(R.id.widget_title, data.optString("dateLocal", "Сегодня"))
      views.setTextViewText(R.id.widget_kcal, data.optString("energyLabel", "— ккал"))
      views.setOnClickPendingIntent(R.id.widget_root, WidgetPayload.openApp(context))
      appWidgetManager.updateAppWidget(id, views)
    }
  }

  companion object {
    fun refreshAll(context: Context) {
      val mgr = AppWidgetManager.getInstance(context)
      val ids = mgr.getAppWidgetIds(ComponentName(context, CompactKcalWidgetProvider::class.java))
      if (ids.isNotEmpty()) CompactKcalWidgetProvider().onUpdate(context, mgr, ids)
    }
  }
}
`;

const MOVEMENT_PROVIDER_KT = `package app.nffit.dogfood.widgets

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.widget.RemoteViews
import app.nffit.dogfood.R

class MovementWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    for (id in appWidgetIds) {
      val views = RemoteViews(context.packageName, R.layout.nf_fit_movement_widget)
      val data = WidgetPayload.read(context)
      views.setTextViewText(R.id.widget_title, data.optString("dateLocal", "Движение"))
      views.setTextViewText(R.id.widget_steps, data.optString("stepsLabel", "— шаг"))
      views.setTextViewText(R.id.widget_sleep, data.optString("sleepLabel", "— ч"))
      views.setOnClickPendingIntent(R.id.widget_root, WidgetPayload.openApp(context))
      appWidgetManager.updateAppWidget(id, views)
    }
  }

  companion object {
    fun refreshAll(context: Context) {
      val mgr = AppWidgetManager.getInstance(context)
      val ids = mgr.getAppWidgetIds(ComponentName(context, MovementWidgetProvider::class.java))
      if (ids.isNotEmpty()) MovementWidgetProvider().onUpdate(context, mgr, ids)
    }
  }
}
`;

const REFRESH_KT = `package app.nffit.dogfood.widgets

import android.content.Context

object NfFitWidgets {
  fun refreshAll(context: Context) {
    try { TodayWidgetProvider.refreshAll(context) } catch (_: Exception) {}
    try { CompactKcalWidgetProvider.refreshAll(context) } catch (_: Exception) {}
    try { MovementWidgetProvider.refreshAll(context) } catch (_: Exception) {}
  }
}
`;

const LAYOUT_TODAY = `<?xml version="1.0" encoding="utf-8"?>
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
    android:textColor="#8B929E"
    android:textSize="12sp"
    android:text="Сегодня" />
  <TextView
    android:id="@+id/widget_kcal"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:textColor="#0A0A0A"
    android:textSize="22sp"
    android:textStyle="bold"
    android:text="— ккал" />
  <TextView
    android:id="@+id/widget_steps"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:textColor="#0A0A0A"
    android:textSize="14sp"
    android:text="— шаг" />
  <LinearLayout
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="horizontal">
    <TextView
      android:id="@+id/widget_water"
      android:layout_width="0dp"
      android:layout_height="wrap_content"
      android:layout_weight="1"
      android:textColor="#5C6370"
      android:textSize="13sp"
      android:text="— мл" />
    <TextView
      android:id="@+id/widget_sleep"
      android:layout_width="0dp"
      android:layout_height="wrap_content"
      android:layout_weight="1"
      android:textColor="#5C6370"
      android:textSize="13sp"
      android:text="— ч" />
  </LinearLayout>
</LinearLayout>
`;

const LAYOUT_COMPACT = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
  android:id="@+id/widget_root"
  android:layout_width="match_parent"
  android:layout_height="match_parent"
  android:orientation="vertical"
  android:padding="12dp"
  android:gravity="center_vertical"
  android:background="#FFFFFF">
  <TextView
    android:id="@+id/widget_title"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:textColor="#8B929E"
    android:textSize="11sp"
    android:text="Сегодня" />
  <TextView
    android:id="@+id/widget_kcal"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:textColor="#0A0A0A"
    android:textSize="20sp"
    android:textStyle="bold"
    android:text="— ккал" />
</LinearLayout>
`;

const LAYOUT_MOVEMENT = `<?xml version="1.0" encoding="utf-8"?>
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
    android:textColor="#8B929E"
    android:textSize="12sp"
    android:text="Движение" />
  <TextView
    android:id="@+id/widget_steps"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:textColor="#0A0A0A"
    android:textSize="20sp"
    android:textStyle="bold"
    android:text="— шаг" />
  <TextView
    android:id="@+id/widget_sleep"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:textColor="#5C6370"
    android:textSize="14sp"
    android:text="— ч" />
</LinearLayout>
`;

const INFO_TODAY = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
  android:minWidth="180dp"
  android:minHeight="110dp"
  android:updatePeriodMillis="1800000"
  android:initialLayout="@layout/nf_fit_today_widget"
  android:resizeMode="horizontal|vertical"
  android:widgetCategory="home_screen"
  android:description="@string/nf_fit_widget_description" />
`;

const INFO_COMPACT = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
  android:minWidth="110dp"
  android:minHeight="40dp"
  android:updatePeriodMillis="1800000"
  android:initialLayout="@layout/nf_fit_compact_widget"
  android:resizeMode="horizontal|vertical"
  android:widgetCategory="home_screen"
  android:description="@string/nf_fit_widget_compact_description" />
`;

const INFO_MOVEMENT = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
  android:minWidth="110dp"
  android:minHeight="80dp"
  android:updatePeriodMillis="1800000"
  android:initialLayout="@layout/nf_fit_movement_widget"
  android:resizeMode="horizontal|vertical"
  android:widgetCategory="home_screen"
  android:description="@string/nf_fit_widget_movement_description" />
`;

const WIDGET_RECEIVERS = [
  {
    name: 'app.nffit.dogfood.widgets.TodayWidgetProvider',
    label: '@string/nf_fit_widget_name',
    resource: '@xml/nf_fit_today_widget_info',
  },
  {
    name: 'app.nffit.dogfood.widgets.CompactKcalWidgetProvider',
    label: '@string/nf_fit_widget_compact_name',
    resource: '@xml/nf_fit_compact_widget_info',
  },
  {
    name: 'app.nffit.dogfood.widgets.MovementWidgetProvider',
    label: '@string/nf_fit_widget_movement_name',
    resource: '@xml/nf_fit_movement_widget_info',
  },
];

function ensureString(strings, name, value) {
  if (strings.includes(`name="${name}"`)) return strings;
  return strings.replace('</resources>', `  <string name="${name}">${value}</string>\n</resources>`);
}

function withNfFitWidgets(config) {
  config = {
    ...config,
    extra: {
      ...(config.extra ?? {}),
      nfFitWidgets: {
        scaffold: false,
        version: 3,
        packageHint: 'app.nffit.dogfood',
        variants: ['today', 'compact', 'movement'],
        note: 'Providers read files/nf_fit_today_widget.json',
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
      writeFile(path.join(javaDir, 'WidgetPayload.kt'), PAYLOAD_KT);
      writeFile(path.join(javaDir, 'TodayWidgetProvider.kt'), TODAY_PROVIDER_KT);
      writeFile(path.join(javaDir, 'CompactKcalWidgetProvider.kt'), COMPACT_PROVIDER_KT);
      writeFile(path.join(javaDir, 'MovementWidgetProvider.kt'), MOVEMENT_PROVIDER_KT);
      writeFile(path.join(javaDir, 'NfFitWidgets.kt'), REFRESH_KT);

      const res = path.join(projectRoot, 'app/src/main/res');
      writeFile(path.join(res, 'layout/nf_fit_today_widget.xml'), LAYOUT_TODAY);
      writeFile(path.join(res, 'layout/nf_fit_compact_widget.xml'), LAYOUT_COMPACT);
      writeFile(path.join(res, 'layout/nf_fit_movement_widget.xml'), LAYOUT_MOVEMENT);
      writeFile(path.join(res, 'xml/nf_fit_today_widget_info.xml'), INFO_TODAY);
      writeFile(path.join(res, 'xml/nf_fit_compact_widget_info.xml'), INFO_COMPACT);
      writeFile(path.join(res, 'xml/nf_fit_movement_widget_info.xml'), INFO_MOVEMENT);

      const stringsPath = path.join(res, 'values/strings.xml');
      let strings = fs.existsSync(stringsPath)
        ? fs.readFileSync(stringsPath, 'utf8')
        : '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n</resources>\n';
      strings = ensureString(strings, 'nf_fit_widget_description', 'Ккал, шаги, вода и сон');
      strings = ensureString(strings, 'nf_fit_widget_name', 'nf-fit · день');
      strings = ensureString(strings, 'nf_fit_widget_compact_description', 'Только энергия дня');
      strings = ensureString(strings, 'nf_fit_widget_compact_name', 'nf-fit · ккал');
      strings = ensureString(strings, 'nf_fit_widget_movement_description', 'Шаги и сон');
      strings = ensureString(strings, 'nf_fit_widget_movement_name', 'nf-fit · движение');
      writeFile(stringsPath, strings);

      const mainActivity = path.join(
        projectRoot,
        'app/src/main/java/app/nffit/dogfood/MainActivity.kt',
      );
      if (fs.existsSync(mainActivity)) {
        let src = fs.readFileSync(mainActivity, 'utf8');
        if (!src.includes('NfFitWidgets.refreshAll')) {
          if (src.includes('TodayWidgetProvider.refreshAll')) {
            src = src.replace(
              'app.nffit.dogfood.widgets.TodayWidgetProvider.refreshAll(this)',
              'app.nffit.dogfood.widgets.NfFitWidgets.refreshAll(this)',
            );
          } else if (!src.includes('override fun onResume')) {
            src = src.replace(
              'override fun getMainComponentName(): String = "main"',
              `override fun onResume() {
    super.onResume()
    try {
      app.nffit.dogfood.widgets.NfFitWidgets.refreshAll(this)
    } catch (_: Exception) {
    }
  }

  override fun getMainComponentName(): String = "main"`,
            );
          }
          fs.writeFileSync(mainActivity, src);
        }
      }
      return cfg;
    },
  ]);

  config = withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    const receivers = app.receiver ?? [];
    for (const w of WIDGET_RECEIVERS) {
      const already = receivers.some(
        (r) => r.$?.['android:name'] === w.name || r.$?.['android:name']?.endsWith(w.name.split('.').pop()),
      );
      if (already) continue;
      receivers.push({
        $: {
          'android:name': w.name,
          'android:exported': 'true',
          'android:label': w.label,
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
              'android:resource': w.resource,
            },
          },
        ],
      });
    }
    app.receiver = receivers;
    return cfg;
  });

  return config;
}

module.exports = withNfFitWidgets;
