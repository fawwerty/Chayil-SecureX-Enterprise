// app/_layout.js — Root layout (Inter = system font on iOS/Android, no loading needed)
import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../src/hooks/useAuth';
import { Colors } from '../src/theme';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { user, loading, init } = useAuth();
  const router   = useRouter();
  const segments = useSegments();

  useEffect(() => { init(); }, []);
  useEffect(() => {
    if (loading) return;
    const inApp = segments[0] === '(tabs)';
    if (!user && inApp) router.replace('/');
  }, [user, loading, segments]);

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  return null;
}

export default function RootLayout() {
  return (
    <View style={{ flex:1, backgroundColor: Colors.bgCanvas }}>
      <StatusBar style="light" backgroundColor={Colors.bgCanvas} />
      <AuthGate />
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bgCanvas },
        animation: 'fade_from_bottom',
      }}>
        <Stack.Screen name="index" options={{ animation:'none' }}/>
        <Stack.Screen name="(tabs)" options={{ animation:'fade' }}/>
      </Stack>
    </View>
  );
}
