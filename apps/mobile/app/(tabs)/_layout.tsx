import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, type } from '@/src/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

function TabBarIcon({ name, color }: { name: IconName; color: string }) {
  return <Ionicons name={name} size={22} color={color} />;
}

function tint(color: unknown): string {
  return typeof color === 'string' ? color : colors.textSecondary;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'web' ? 10 : 0);
  const tabBarHeight = 52 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.text,
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
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: '700', fontSize: type.title },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Сегодня',
          tabBarLabel: 'Сегодня',
          tabBarAccessibilityLabel: 'Вкладка Сегодня',
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
          tabBarAccessibilityLabel: 'Вкладка Питание',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'restaurant' : 'restaurant-outline'} color={tint(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'План',
          tabBarLabel: 'План',
          headerShown: false,
          tabBarAccessibilityLabel: 'Вкладка План',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'compass' : 'compass-outline'} color={tint(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Активность',
          href: null,
          tabBarAccessibilityLabel: 'Активность',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'walk' : 'walk-outline'} color={tint(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Прогресс',
          tabBarLabel: 'Прогресс',
          tabBarAccessibilityLabel: 'Вкладка Прогресс',
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
          tabBarAccessibilityLabel: 'Вкладка Профиль',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'person' : 'person-outline'} color={tint(color)} />
          ),
        }}
      />
    </Tabs>
  );
}
