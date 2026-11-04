import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';

import { colors, radius, space, touchMin, type } from '../../theme/tokens';
import { AppButton } from '@/src/design-system';

const FOOD_BARCODES = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
] as const;

const VIEWFINDER_H = 112;

export type ScanStatus = 'idle' | 'scanning' | 'captured' | 'looking_up';

export function BarcodeCameraPanel({
  enabled,
  status = 'scanning',
  lastCode = null,
  onScanned,
}: {
  enabled: boolean;
  /** Visual state driven by parent lookup flow. */
  status?: ScanStatus;
  lastCode?: string | null;
  onScanned: (code: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [torch, setTorch] = useState(false);
  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) {
      setLocked(false);
      setTorch(false);
    }
  }, [enabled]);

  useEffect(() => {
    const active = enabled && !locked && status === 'scanning';
    if (!active) {
      lineAnim.stopAnimation();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(lineAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(lineAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [enabled, locked, status, lineAnim]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>
          На web камера штрихкода ограничена — введи код цифрами ниже.
        </Text>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Проверяем доступ к камере…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>
          Нужен доступ к камере, чтобы считать штрихкод. Можно и без неё — введи код вручную.
        </Text>
        <AppButton label="Разрешить камеру" onPress={() => void requestPermission()} />
      </View>
    );
  }

  const handleScan = (result: BarcodeScanningResult) => {
    if (!enabled || locked || status === 'looking_up') return;
    // Digits only — some scanners emit GS1 separators / spaces around EAN.
    const data = String(result.data ?? '').replace(/\D/g, '');
    if (!/^\d{8,14}$/.test(data)) return;
    setLocked(true);
    onScanned(data);
  };

  const statusLabel =
    status === 'looking_up'
      ? 'Ищем продукт…'
      : status === 'captured' || locked
        ? lastCode
          ? `Считано · ${lastCode}`
          : 'Считано'
        : 'Ищу штрихкод…';

  const lineTranslate = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, VIEWFINDER_H - 8],
  });

  return (
    <View style={styles.wrap} accessibilityLabel="Сканер штрихкода">
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: [...FOOD_BARCODES] }}
        onBarcodeScanned={enabled && !locked && status === 'scanning' ? handleScan : undefined}
        accessibilityLabel="Камера штрихкода"
      />

      {/* Dimmed mask + clear viewfinder window */}
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.maskTop} />
        <View style={styles.midRow}>
          <View style={styles.maskSide} />
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
            {status === 'scanning' && !locked ? (
              <Animated.View
                style={[styles.scanLine, { transform: [{ translateY: lineTranslate }] }]}
              />
            ) : null}
            {status === 'looking_up' || locked ? (
              <View style={styles.capturedFlash}>
                <Text style={styles.capturedCheck}>✓</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.maskSide} />
        </View>
        <View style={styles.maskBottom}>
          <View
            style={[
              styles.statusPill,
              (status === 'captured' || locked || status === 'looking_up') && styles.statusPillOk,
            ]}
            accessibilityLiveRegion="polite"
          >
            <View
              style={[
                styles.statusDot,
                status === 'scanning' && !locked && styles.statusDotPulse,
                (locked || status === 'looking_up' || status === 'captured') && styles.statusDotOk,
              ]}
            />
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
          <Text style={styles.overlayHint}>Помести штрихкод в рамку</Text>
        </View>
      </View>

      <View style={styles.toolbar}>
        <Pressable
          style={[styles.toolBtn, torch && styles.toolBtnOn]}
          onPress={() => setTorch((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ selected: torch }}
          accessibilityLabel={torch ? 'Выключить фонарик' : 'Включить фонарик'}
        >
          <Text style={[styles.toolBtnText, torch && styles.toolBtnTextOn]}>
            {torch ? 'Фонарик вкл' : 'Фонарик'}
          </Text>
        </Pressable>
        {locked || status === 'captured' || status === 'looking_up' ? (
          <Pressable
            style={styles.toolBtn}
            onPress={() => setLocked(false)}
            accessibilityRole="button"
            accessibilityLabel="Сканировать снова"
          >
            <Text style={styles.toolBtnText}>Снова</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const MASK = 'rgba(0,0,0,0.55)';
const CORNER = colors.textOnInverse;
const LINE = colors.textOnInverse;

const styles = StyleSheet.create({
  wrap: {
    height: 320,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: space.lg,
    backgroundColor: colors.shadow,
    borderWidth: 2,
    borderColor: colors.text,
  },
  camera: { ...StyleSheet.absoluteFill },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  maskTop: { flex: 1, backgroundColor: MASK },
  maskBottom: {
    flex: 1.15,
    backgroundColor: MASK,
    alignItems: 'center',
    paddingTop: space.md,
  },
  midRow: { flexDirection: 'row', height: VIEWFINDER_H },
  maskSide: { flex: 1, backgroundColor: MASK },
  viewfinder: {
    width: '78%',
    height: VIEWFINDER_H,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: CORNER,
  },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 4 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 4 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 4 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 4 },
  scanLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 3,
    borderRadius: 2,
    backgroundColor: LINE,
    shadowColor: colors.textOnInverse,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  capturedFlash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(22, 163, 74, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capturedCheck: {
    color: colors.textOnInverse,
    fontSize: 36,
    fontWeight: '800',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    maxWidth: '92%',
  },
  statusPillOk: {
    borderColor: colors.success,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
  },
  statusDotPulse: {
    backgroundColor: colors.warning,
  },
  statusDotOk: {
    backgroundColor: colors.success,
  },
  statusText: {
    color: colors.textOnInverse,
    fontSize: type.caption,
    fontWeight: '700',
  },
  overlayHint: {
    marginTop: space.sm,
    color: 'rgba(255,255,255,0.9)',
    fontSize: type.caption,
    fontWeight: '600',
  },
  toolbar: {
    position: 'absolute',
    top: space.sm,
    right: space.sm,
    flexDirection: 'row',
    gap: space.sm,
  },
  toolBtn: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    minHeight: 40,
    paddingHorizontal: space.md,
    justifyContent: 'center',
  },
  toolBtnOn: {
    backgroundColor: colors.surface,
    borderColor: colors.surface,
  },
  toolBtnText: { color: colors.textOnInverse, fontWeight: '700', fontSize: type.caption },
  toolBtnTextOn: { color: colors.text },
  fallback: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginBottom: space.lg,
    gap: space.md,
    minHeight: touchMin * 2,
  },
  fallbackText: {
    color: colors.textSecondary,
    fontSize: type.body,
    lineHeight: 22,
  },
});
