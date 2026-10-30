/**
 * Expo config plugin scaffold for nf-fit Android home-screen widgets.
 * Phase 6: stamps metadata only — no AppWidgetProvider binary yet.
 * Full native wiring: docs/13-WIDGETS-SCAFFOLD.md (option A).
 *
 * @param {import('@expo/config-plugins').ExpoConfig} config
 */
function withNfFitWidgets(config) {
  const extra = config.extra ?? {};
  return {
    ...config,
    extra: {
      ...extra,
      nfFitWidgets: {
        scaffold: true,
        version: 1,
        packageHint: 'app.nffit.dogfood',
        note: 'Native AppWidgetProvider deferred; contract in src/widgets/todayWidgetContract.ts',
      },
    },
  };
}

module.exports = withNfFitWidgets;
