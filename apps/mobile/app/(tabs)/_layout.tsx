import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, elevation, radius, type } from '@/src/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Ref 01 — floating chrome; active icon in a circle. */
function TabBarIcon({
  name,
  color,
  focused,
}: {
  name: IconName;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapOn]}>
      <Ionicons name={name} size={22} color={focused ? colors.text : color} />
    </View>
  );
}

function tint(color: unknown): string {
  return typeof color === 'string' ? color : colors.textMuted;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'web' ? 12 : 0);
  const tabBarHeight = 64 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: type.micro,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: Platform.OS === 'web' ? 4 : 0,
        },
        tabBarItemStyle: {
          paddingTop: 8,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          height: tabBarHeight,
          paddingBottom: bottomInset,
          ...elevation.tabBar,
        },
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '800',
          fontSize: type.title,
        },
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
            <TabBarIcon
              name={focused ? 'home' : 'home-outline'}
              color={tint(color)}
              focused={focused}
            />
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
            <TabBarIcon
              name={focused ? 'restaurant' : 'restaurant-outline'}
              color={tint(color)}
              focused={focused}
            />
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
            <TabBarIcon
              name={focused ? 'compass' : 'compass-outline'}
              color={tint(color)}
              focused={focused}
            />
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
            <TabBarIcon
              name={focused ? 'barbell' : 'barbell-outline'}
              color={tint(color)}
              focused={focused}
            />
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
            <TabBarIcon
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
              color={tint(color)}
              focused={focused}
            />
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
            <TabBarIcon
              name={focused ? 'settings' : 'settings-outline'}
              color={tint(color)}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapOn: {
    borderWidth: 1.5,
    borderColor: colors.text,
  },
});
