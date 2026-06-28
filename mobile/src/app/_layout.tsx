import { Stack, router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShoppingCart, User, LogOut, LogIn, UserPlus, Package, ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { colors, radius } from '../constants/theme';

function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const pathname = usePathname();
  const isHome = pathname === '/';

  async function handleLogout() {
    try {
      await logout();
      router.replace('/');
    } catch {}
  }

  return (
    <View style={navStyles.header}>
      <View style={navStyles.left}>
        {!isHome && (
          <TouchableOpacity onPress={() => router.back()} style={navStyles.backBtn}>
            <ArrowLeft size={20} color={colors.slate700} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={navStyles.brand} onPress={() => router.push('/')}>
          <Text style={navStyles.brandText}>ShopTheStep</Text>
        </TouchableOpacity>
      </View>

      <View style={navStyles.actions}>
        <TouchableOpacity onPress={() => router.push('/products')}>
          <Package size={22} color={colors.slate700} />
        </TouchableOpacity>

        {user ? (
          <>
            <TouchableOpacity onPress={() => router.push('/cart')}>
              <ShoppingCart size={22} color={colors.slate700} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/profile')}>
              <User size={22} color={colors.slate700} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={navStyles.logoutBtn}>
              <LogOut size={16} color={colors.white} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => router.push('/login')} style={navStyles.loginBtn}>
              <LogIn size={16} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/register')} style={navStyles.registerBtn}>
              <UserPlus size={16} color={colors.white} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const navStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
    backgroundColor: colors.white,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { padding: 4 },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandText: { fontSize: 16, fontWeight: '800', color: colors.slate900 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  loginBtn: { backgroundColor: colors.slate700, padding: 8, borderRadius: radius.sm },
  registerBtn: { backgroundColor: colors.red, padding: 8, borderRadius: radius.sm },
  logoutBtn: { backgroundColor: colors.green, padding: 8, borderRadius: radius.sm },
});

export default function RootLayout() {
  const me = useAuthStore((s) => s.me);

  useEffect(() => {
    me();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Navbar />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="products" />
        <Stack.Screen name="cart" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="recipes" />
        <Stack.Screen name="recipes/[id]" />
        <Stack.Screen name="orders/[id]" />
      </Stack>
    </View>
  );
}