import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, type } from '@/src/design-system';
import { GarminAutoSyncHost } from '@/src/features/garmin/GarminAutoSyncHost';
import { useWidgetSync } from '@/src/widgets/useWidgetSync';

type IconName = ComponentProps<typeof Ionicons>['name'];

function TabBarIcon({ name, color }: { name: IconName; color: string }) {
  return <Ionicons name={name} size={22} color={color} />;
}

function tint(color: unknown): string {
  return typeof color === 'string' ? color : colors.textSecondary;
}

/**
 * nf-fit tab shell: Today / Food / Movement / Progress / Profile (TAB_SHELL).
 * Sleep lives inside Movement (Activity | Sleep). Route `sleep` hidden + redirects.
 */
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'web' ? 10 : 0);
  const tabBarHeight = 52 + bottomInset;
  useWidgetSync();

  return (
    <View style={{ flex: 1 }}>
      <GarminAutoSyncHost />
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: type.micro,
          fontWeight: '600',
          marginBottom: Platform.OS === 'web' ? 4 : 0,
        },
        tabBarItemStyle: {
          paddingTop: 6,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: tabBarHeight,
          paddingBottom: bottomInset,
        },
        headerStyle: { backgroundColor: colors.canvas },
        headerTitleStyle: { color: colors.ink, fontWeight: '700', fontSize: type.title },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Сегодня',
          tabBarLabel: 'Сегодня',
          tabBarAccessibilityLabel: 'Today tab, Сегодня',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={tint(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="food"
        options={{
          title: 'Питание',
          tabBarLabel: 'Питание',
          tabBarAccessibilityLabel: 'Food tab, Питание',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'restaurant' : 'restaurant-outline'} color={tint(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Движение',
          tabBarLabel: 'Движение',
          tabBarAccessibilityLabel: 'Movement tab, Движение',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'walk' : 'walk-outline'} color={tint(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="sleep"
        options={{
          href: null,
          title: 'Сон',
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Прогресс',
          tabBarLabel: 'Прогресс',
          tabBarAccessibilityLabel: 'Progress tab, Прогресс',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'stats-chart' : 'stats-chart-outline'} color={tint(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarLabel: 'Профиль',
          tabBarAccessibilityLabel: 'Profile tab, Профиль',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'person' : 'person-outline'} color={tint(color)} />
          ),
        }}
      />
    </Tabs>
    </View>
  );
}
