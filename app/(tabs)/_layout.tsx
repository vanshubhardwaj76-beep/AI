import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from '@/components/ui/Icon';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home' },
  { name: 'goals', title: 'Goals', icon: 'goals' },
  { name: 'pet', title: 'Pet', icon: 'pet' },
  { name: 'journal', title: 'Journal', icon: 'journal' },
  { name: 'profile', title: 'Profile', icon: 'profile' },
];

export default function TabsLayout() {
  const { colors, fontsReady } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 86 : 68,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', ...(fontsReady ? { fontFamily: 'Nunito_700Bold' } : {}) },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, focused }) => (
              <View style={{ width: 44, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? colors.primarySoft : 'transparent' }}>
                <Icon name={t.icon} size={22} color={String(color)} strokeWidth={focused ? 2.6 : 2} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
