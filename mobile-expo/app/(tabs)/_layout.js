// Role-aware tab navigation with glassmorphism tab bar
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors, R, Fonts, roleConfig } from '../../src/theme';

const ALL_TABS = [
  { name: 'dashboard', label: 'Home',      icon: '⬡', activeIcon: '⬡' },
  { name: 'scan',      label: 'Scan',      icon: '◎', activeIcon: '◎' },
  { name: 'threats',   label: 'Threats',   icon: '⚡', activeIcon: '⚡', badge: true },
  { name: 'osint',     label: 'OSINT',     icon: '◈', activeIcon: '◈' },
  { name: 'incidents', label: 'Incidents', icon: '⚠', activeIcon: '⚠', badge: true },
  { name: 'reports',   label: 'Reports',   icon: '◉', activeIcon: '◉' },
  { name: 'profile',   label: 'Profile',   icon: '◇', activeIcon: '◇' },
];

function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const role = user?.role || 'analyst';
  const rc = roleConfig[role] || roleConfig.analyst;
  const allowedTabs = rc.tabs;
  const visibleTabs = ALL_TABS.filter(t => allowedTabs.includes(t.name));

  return (
    <View style={[s.container, { paddingBottom: insets.bottom || 8 }]}>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[s.bar]}>
        {state.routes.map((route, idx) => {
          const tabDef = visibleTabs.find(t => t.name === route.name);
          if (!tabDef) return null;
          const focused = state.index === idx;

          const press = () => {
            Haptics.selectionAsync();
            if (!focused) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity key={route.key} style={s.tab} onPress={press} activeOpacity={0.75}>
              {focused && (
                <View style={[s.activeLine, { backgroundColor: rc.color }]} />
              )}
              <Text style={[s.icon, { color: focused ? rc.color : Colors.textDim }]}>
                {focused ? tabDef.activeIcon : tabDef.icon}
              </Text>
              <Text style={[s.label, { color: focused ? rc.color : Colors.textDim }]}>
                {tabDef.label}
              </Text>
              {tabDef.badge && !focused && (
                <View style={s.badge} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace('/');
  }, [user]);

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.void } }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="threats" />
      <Tabs.Screen name="osint" />
      <Tabs.Screen name="incidents" />
      <Tabs.Screen name="reports" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const s = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: Colors.border, overflow: 'hidden' },
  bar: { flexDirection: 'row', paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4, gap: 3, position: 'relative' },
  activeLine: { position: 'absolute', top: -8, width: '50%', height: 2, borderRadius: 1 },
  icon:  { fontSize: 18, lineHeight: 22 },
  label: { fontSize: 9, fontFamily: Fonts.display700, textTransform: 'uppercase', letterSpacing: 0.4 },
  badge: { position: 'absolute', top: 4, right: '22%', width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.red },
});
