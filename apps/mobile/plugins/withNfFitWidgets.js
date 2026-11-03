const {
  withAndroidManifest,
  withDangerousMod,
  AndroidConfig,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Nothing-light AppWidgets (pixel numerals + soft white squircle).
 * Payload: files/nf_fit_today_widget.json from syncTodayWidgetPayload.
 * Variants: Day · Kcal · Steps · Water · Sleep.
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

function providerKt(className, layoutRes, binderBody) {
  return `package app.nffit.dogfood.widgets

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.widget.RemoteViews
import app.nffit.dogfood.R

class ${className} : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    for (id in appWidgetIds) {
      val views = RemoteViews(context.packageName, R.layout.${layoutRes})
      val data = WidgetPayload.read(context)
${binderBody}
      views.setOnClickPendingIntent(R.id.widget_root, WidgetPayload.openApp(context))
      appWidgetManager.updateAppWidget(id, views)
    }
  }

  companion object {
    fun refreshAll(context: Context) {
      val mgr = AppWidgetManager.getInstance(context)
      val ids = mgr.getAppWidgetIds(ComponentName(context, ${className}::class.java))
      if (ids.isNotEmpty()) ${className}().onUpdate(context, mgr, ids)
    }
  }
}
`;
}

const TODAY_BIND = `
      views.setTextViewText(R.id.widget_title, data.optString("dayLabel", "DAY"))
      views.setTextViewText(R.id.widget_kcal_value, data.optString("energyValue", "—"))
      views.setTextViewText(R.id.widget_steps_value, data.optString("stepsValue", "—"))
      views.setTextViewText(R.id.widget_water_value, data.optString("waterValue", "—"))
      views.setTextViewText(R.id.widget_sleep_value, data.optString("sleepValue", "—"))
      views.setTextViewText(R.id.widget_kcal_dots, data.optString("energyDots", "········"))
      views.setTextViewText(R.id.widget_water_dots, data.optString("waterDots", "········"))
      views.setTextViewText(R.id.widget_water_unit, data.optString("waterUnit", "ml"))
`;

const KCAL_BIND = `
      views.setTextViewText(R.id.widget_value, data.optString("energyValue", "—"))
      views.setTextViewText(R.id.widget_dots, data.optString("energyDots", "········"))
`;

const STEPS_BIND = `
      views.setTextViewText(R.id.widget_value, data.optString("stepsValue", "—"))
`;

const WATER_BIND = `
      views.setTextViewText(R.id.widget_value, data.optString("waterValue", "—"))
      views.setTextViewText(R.id.widget_unit, data.optString("waterUnit", "ml"))
      views.setTextViewText(R.id.widget_dots, data.optString("waterDots", "········"))
`;

const SLEEP_BIND = `
      views.setTextViewText(R.id.widget_value, data.optString("sleepValue", "—"))
`;

const REFRESH_KT = `package app.nffit.dogfood.widgets

import android.content.Context

object NfFitWidgets {
  fun refreshAll(context: Context) {
    try { TodayWidgetProvider.refreshAll(context) } catch (_: Exception) {}
    try { CompactKcalWidgetProvider.refreshAll(context) } catch (_: Exception) {}
    try { StepsWidgetProvider.refreshAll(context) } catch (_: Exception) {}
    try { WaterWidgetProvider.refreshAll(context) } catch (_: Exception) {}
    try { SleepWidgetProvider.refreshAll(context) } catch (_: Exception) {}
  }
}
`;

const BG_DRAWABLE = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
  <solid android:color="#F7F7F5"/>
  <corners android:radius="28dp"/>
  <stroke android:width="1dp" android:color="#E6E6E2"/>
</shape>
`;

const ACCENT_DOT = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="oval">
  <solid android:color="#D71921"/>
  <size android:width="10dp" android:height="10dp"/>
</shape>
`;

const FONT_XML = `<?xml version="1.0" encoding="utf-8"?>
<font-family xmlns:android="http://schemas.android.com/apk/res/android">
  <font
    android:fontStyle="normal"
    android:fontWeight="400"
    android:font="@font/press_start_2p_regular" />
</font-family>
`;

/** Shared Nothing-light cell: label + pixel value + optional unit/dots */
function metricCell(idPrefix, label, showDots, unitId) {
  const dots = showDots
    ? `
      <TextView
        android:id="@+id/${idPrefix}_dots"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="4dp"
        android:textColor="#0A0A0A"
        android:textSize="9sp"
        android:letterSpacing="0.12"
        android:text="········" />`
    : '';
  const unit = unitId
    ? `
      <TextView
        android:id="@+id/${unitId}"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginStart="4dp"
        android:textColor="#8B929E"
        android:textSize="10sp"
        android:text="ml" />`
    : '';
  return `
  <LinearLayout
    android:layout_width="0dp"
    android:layout_height="wrap_content"
    android:layout_weight="1"
    android:orientation="vertical"
    android:padding="6dp">
    <TextView
      android:layout_width="match_parent"
      android:layout_height="wrap_content"
      android:textColor="#8B929E"
      android:textSize="10sp"
      android:textAllCaps="true"
      android:letterSpacing="0.08"
      android:text="${label}" />
    <LinearLayout
      android:layout_width="match_parent"
      android:layout_height="wrap_content"
      android:orientation="horizontal"
      android:gravity="bottom">
      <TextView
        android:id="@+id/${idPrefix}_value"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:fontFamily="@font/nf_fit_pixel"
        android:textColor="#0A0A0A"
        android:textSize="16sp"
        android:text="—" />${unit}
    </LinearLayout>${dots}
  </LinearLayout>`;
}

const LAYOUT_TODAY = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
  android:id="@+id/widget_root"
  android:layout_width="match_parent"
  android:layout_height="match_parent"
  android:orientation="vertical"
  android:padding="14dp"
  android:background="@drawable/nf_fit_widget_bg">
  <LinearLayout
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="horizontal"
    android:gravity="center_vertical">
    <TextView
      android:id="@+id/widget_title"
      android:layout_width="0dp"
      android:layout_height="wrap_content"
      android:layout_weight="1"
      android:fontFamily="@font/nf_fit_pixel"
      android:textColor="#0A0A0A"
      android:textSize="12sp"
      android:text="DAY" />
    <ImageView
      android:layout_width="8dp"
      android:layout_height="8dp"
      android:src="@drawable/nf_fit_accent_dot"
      android:contentDescription="@null" />
  </LinearLayout>
  <LinearLayout
    android:layout_width="match_parent"
    android:layout_height="0dp"
    android:layout_weight="1"
    android:orientation="horizontal"
    android:layout_marginTop="8dp"
    android:gravity="center_vertical">
    ${metricCell('widget_kcal', 'KCAL', true, null)}
    ${metricCell('widget_steps', 'STEPS', false, null)}
  </LinearLayout>
  <LinearLayout
    android:layout_width="match_parent"
    android:layout_height="0dp"
    android:layout_weight="1"
    android:orientation="horizontal"
    android:gravity="center_vertical">
    ${metricCell('widget_water', 'WATER', true, 'widget_water_unit')}
    ${metricCell('widget_sleep', 'SLEEP', false, null)}
  </LinearLayout>
</LinearLayout>
`;

function squareMetricLayout(label, valueId, opts = {}) {
  const { unitId, dotsId, accent } = opts;
  const accentRow = accent
    ? `
    <ImageView
      android:layout_width="8dp"
      android:layout_height="8dp"
      android:layout_marginStart="6dp"
      android:src="@drawable/nf_fit_accent_dot"
      android:contentDescription="@null" />`
    : '';
  const unit = unitId
    ? `
    <TextView
      android:id="@+id/${unitId}"
      android:layout_width="wrap_content"
      android:layout_height="wrap_content"
      android:layout_marginStart="4dp"
      android:textColor="#8B929E"
      android:textSize="11sp"
      android:text="ml" />`
    : '';
  const dots = dotsId
    ? `
  <TextView
    android:id="@+id/${dotsId}"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:layout_marginTop="8dp"
    android:textColor="#0A0A0A"
    android:textSize="10sp"
    android:letterSpacing="0.14"
    android:text="········" />`
    : '';
  return `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
  android:id="@+id/widget_root"
  android:layout_width="match_parent"
  android:layout_height="match_parent"
  android:orientation="vertical"
  android:padding="14dp"
  android:gravity="center_vertical"
  android:background="@drawable/nf_fit_widget_bg">
  <LinearLayout
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="horizontal"
    android:gravity="center_vertical">
    <TextView
      android:layout_width="wrap_content"
      android:layout_height="wrap_content"
      android:textColor="#8B929E"
      android:textSize="10sp"
      android:textAllCaps="true"
      android:letterSpacing="0.1"
      android:text="${label}" />${accentRow}
  </LinearLayout>
  <LinearLayout
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="horizontal"
    android:gravity="bottom"
    android:layout_marginTop="6dp">
    <TextView
      android:id="@+id/${valueId}"
      android:layout_width="wrap_content"
      android:layout_height="wrap_content"
      android:fontFamily="@font/nf_fit_pixel"
      android:textColor="#0A0A0A"
      android:textSize="22sp"
      android:text="—" />${unit}
  </LinearLayout>${dots}
</LinearLayout>
`;
}

const LAYOUT_KCAL = squareMetricLayout('KCAL', 'widget_value', {
  dotsId: 'widget_dots',
  accent: true,
});
const LAYOUT_STEPS = squareMetricLayout('STEPS', 'widget_value', {});
const LAYOUT_WATER = squareMetricLayout('WATER', 'widget_value', {
  unitId: 'widget_unit',
  dotsId: 'widget_dots',
});
const LAYOUT_SLEEP = squareMetricLayout('SLEEP H', 'widget_value', {});

function infoXml(layout, minW, minH, desc) {
  return `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
  android:minWidth="${minW}dp"
  android:minHeight="${minH}dp"
  android:updatePeriodMillis="1800000"
  android:initialLayout="@layout/${layout}"
  android:resizeMode="horizontal|vertical"
  android:widgetCategory="home_screen"
  android:description="@string/${desc}" />
`;
}

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
    name: 'app.nffit.dogfood.widgets.StepsWidgetProvider',
    label: '@string/nf_fit_widget_steps_name',
    resource: '@xml/nf_fit_steps_widget_info',
  },
  {
    name: 'app.nffit.dogfood.widgets.WaterWidgetProvider',
    label: '@string/nf_fit_widget_water_name',
    resource: '@xml/nf_fit_water_widget_info',
  },
  {
    name: 'app.nffit.dogfood.widgets.SleepWidgetProvider',
    label: '@string/nf_fit_widget_sleep_name',
    resource: '@xml/nf_fit_sleep_widget_info',
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
        version: 4,
        style: 'nothing-light-pixel',
        packageHint: 'app.nffit.dogfood',
        variants: ['today', 'kcal', 'steps', 'water', 'sleep'],
        note: 'Nothing-light squircles + Press Start 2P numerals',
      },
    },
  };

  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.platformProjectRoot;
      const projectRootApp = cfg.modRequest.projectRoot;
      const javaDir = path.join(
        projectRoot,
        'app/src/main/java/app/nffit/dogfood/widgets',
      );
      writeFile(path.join(javaDir, 'WidgetPayload.kt'), PAYLOAD_KT);
      writeFile(
        path.join(javaDir, 'TodayWidgetProvider.kt'),
        providerKt('TodayWidgetProvider', 'nf_fit_today_widget', TODAY_BIND),
      );
      writeFile(
        path.join(javaDir, 'CompactKcalWidgetProvider.kt'),
        providerKt('CompactKcalWidgetProvider', 'nf_fit_compact_widget', KCAL_BIND),
      );
      writeFile(
        path.join(javaDir, 'StepsWidgetProvider.kt'),
        providerKt('StepsWidgetProvider', 'nf_fit_steps_widget', STEPS_BIND),
      );
      writeFile(
        path.join(javaDir, 'WaterWidgetProvider.kt'),
        providerKt('WaterWidgetProvider', 'nf_fit_water_widget', WATER_BIND),
      );
      writeFile(
        path.join(javaDir, 'SleepWidgetProvider.kt'),
        providerKt('SleepWidgetProvider', 'nf_fit_sleep_widget', SLEEP_BIND),
      );
      writeFile(path.join(javaDir, 'NfFitWidgets.kt'), REFRESH_KT);

      const res = path.join(projectRoot, 'app/src/main/res');
      writeFile(path.join(res, 'drawable/nf_fit_widget_bg.xml'), BG_DRAWABLE);
      writeFile(path.join(res, 'drawable/nf_fit_accent_dot.xml'), ACCENT_DOT);
      writeFile(path.join(res, 'layout/nf_fit_today_widget.xml'), LAYOUT_TODAY);
      writeFile(path.join(res, 'layout/nf_fit_compact_widget.xml'), LAYOUT_KCAL);
      writeFile(path.join(res, 'layout/nf_fit_steps_widget.xml'), LAYOUT_STEPS);
      writeFile(path.join(res, 'layout/nf_fit_water_widget.xml'), LAYOUT_WATER);
      writeFile(path.join(res, 'layout/nf_fit_sleep_widget.xml'), LAYOUT_SLEEP);
      writeFile(
        path.join(res, 'xml/nf_fit_today_widget_info.xml'),
        infoXml('nf_fit_today_widget', 180, 160, 'nf_fit_widget_description'),
      );
      writeFile(
        path.join(res, 'xml/nf_fit_compact_widget_info.xml'),
        infoXml('nf_fit_compact_widget', 110, 110, 'nf_fit_widget_compact_description'),
      );
      writeFile(
        path.join(res, 'xml/nf_fit_steps_widget_info.xml'),
        infoXml('nf_fit_steps_widget', 110, 110, 'nf_fit_widget_steps_description'),
      );
      writeFile(
        path.join(res, 'xml/nf_fit_water_widget_info.xml'),
        infoXml('nf_fit_water_widget', 110, 110, 'nf_fit_widget_water_description'),
      );
      writeFile(
        path.join(res, 'xml/nf_fit_sleep_widget_info.xml'),
        infoXml('nf_fit_sleep_widget', 110, 110, 'nf_fit_widget_sleep_description'),
      );

      // Pixel font (Press Start 2P — OFL) for numerals.
      const fontSrcCandidates = [
        path.join(projectRootApp, 'assets/fonts/PressStart2P-Regular.ttf'),
        path.join(projectRootApp, 'apps/mobile/assets/fonts/PressStart2P-Regular.ttf'),
        path.join(__dirname, '../assets/fonts/PressStart2P-Regular.ttf'),
      ];
      const fontSrc = fontSrcCandidates.find((p) => fs.existsSync(p));
      if (fontSrc) {
        const fontDir = path.join(res, 'font');
        ensureDir(fontDir);
        fs.copyFileSync(fontSrc, path.join(fontDir, 'press_start_2p_regular.ttf'));
        writeFile(path.join(fontDir, 'nf_fit_pixel.xml'), FONT_XML);
      }

      const stringsPath = path.join(res, 'values/strings.xml');
      let strings = fs.existsSync(stringsPath)
        ? fs.readFileSync(stringsPath, 'utf8')
        : '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n</resources>\n';
      strings = ensureString(strings, 'nf_fit_widget_description', 'Day: kcal, steps, water, sleep');
      strings = ensureString(strings, 'nf_fit_widget_name', 'nf-fit · day');
      strings = ensureString(strings, 'nf_fit_widget_compact_description', 'Calories (pixel)');
      strings = ensureString(strings, 'nf_fit_widget_compact_name', 'nf-fit · kcal');
      strings = ensureString(strings, 'nf_fit_widget_steps_description', 'Steps (pixel)');
      strings = ensureString(strings, 'nf_fit_widget_steps_name', 'nf-fit · steps');
      strings = ensureString(strings, 'nf_fit_widget_water_description', 'Water (pixel)');
      strings = ensureString(strings, 'nf_fit_widget_water_name', 'nf-fit · water');
      strings = ensureString(strings, 'nf_fit_widget_sleep_description', 'Sleep hours (pixel)');
      strings = ensureString(strings, 'nf_fit_widget_sleep_name', 'nf-fit · sleep');
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
        (r) =>
          r.$?.['android:name'] === w.name ||
          r.$?.['android:name']?.endsWith(w.name.split('.').pop()),
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
