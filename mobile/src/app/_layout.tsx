import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';

export default function RootLayout() {
  const me = useAuthStore((s) => s.me);

  useEffect(() => {
    me();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Početna' }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="products" options={{ title: 'Proizvodi' }} />
      <Stack.Screen name="cart" options={{ title: 'Korpa' }} />
      <Stack.Screen name="profile" options={{ title: 'Profil' }} />
    </Stack>
  );
}
