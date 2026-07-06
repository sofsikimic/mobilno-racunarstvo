import { Stack, router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShoppingCart, User, LogOut, LogIn, UserPlus, Package,
  ArrowLeft, Shield, ChefHat, Heart, Home,
} from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';
import { colors, radius } from '../constants/theme';

// ─── TOP BAR (mobile): only auth-related actions ──────────────────
// Logged out  -> Login, Register
// Role "user" -> Cart, Logout
// Role admin  -> Logout only
// Everything else (Home, Products, Recipes, Favorites, Profile, Admin)
// lives in the bottom tab bar, like a standard mobile app.
function TopBar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';
  const isUser = (user?.role || '').toLowerCase() === 'user';

  async function handleLogout() {
    try { await logout(); router.replace('/'); } catch {}
  }

  return (
    <View style={navStyles.header}>
      <View style={navStyles.left}>
        {!isHome && (
          <TouchableOpacity
            onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } }}
            style={navStyles.backBtn}
          >
            <ArrowLeft size={20} color={colors.slate700} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={navStyles.brand} onPress={() => router.push('/')}>
          <Text style={navStyles.brandText}>ShopTheStep</Text>
        </TouchableOpacity>
      </View>

      <View style={navStyles.actions}>
        {user ? (
          <>
            {isUser && (
              <TouchableOpacity onPress={() => router.push('/cart')}>
                <ShoppingCart size={22} color={colors.slate700} />
              </TouchableOpacity>
            )}
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

// ─── BOTTOM TAB BAR (mobile): the rest of the menu ─────────────────
function BottomNav() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';
  const isUser = (user?.role || '').toLowerCase() === 'user';

  const items = [
    { key: 'home', label: 'Home', href: '/', icon: Home, show: true },
    { key: 'products', label: 'Products', href: '/products', icon: Package, show: true },
    { key: 'recipes', label: 'Recipes', href: '/external-recipes', icon: ChefHat, show: true },
    { key: 'favorites', label: 'Favorites', href: '/favorites', icon: Heart, show: isUser },
    { key: 'profile', label: 'Profile', href: '/profile', icon: User, show: !!user },
    { key: 'admin', label: 'Admin', href: '/admin', icon: Shield, show: isAdmin },
  ].filter((i) => i.show);

  return (
    <View style={[navStyles.bottomBar, { paddingBottom: insets.bottom || 8 }]}>
      {items.map(({ key, label, href, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <TouchableOpacity
            key={key}
            style={navStyles.bottomItem}
            onPress={() => router.push(href as any)}
          >
            <Icon size={22} color={active ? colors.red : colors.slate500} />
            <Text style={[navStyles.bottomLabel, active && navStyles.bottomLabelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const navStyles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
    borderBottomColor: colors.slate200, backgroundColor: colors.white,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { padding: 4 },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandText: { fontSize: 16, fontWeight: '800', color: colors.slate900 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loginBtn: { backgroundColor: colors.slate700, padding: 6, borderRadius: radius.sm },
  registerBtn: { backgroundColor: colors.red, padding: 6, borderRadius: radius.sm },
  logoutBtn: { backgroundColor: colors.green, padding: 6, borderRadius: radius.sm },
  bottomBar: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.slate200,
    backgroundColor: colors.white, paddingTop: 8,
  },
  bottomItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 2 },
  bottomLabel: { fontSize: 11, color: colors.slate500, fontWeight: '600' },
  bottomLabelActive: { color: colors.red },
});

export default function RootLayout() {
  const me = useAuthStore((s) => s.me);
  const clearCart = useCartStore((s) => s.clear);

  useEffect(() => {
    me().then((user) => {
      if (user && (user.role || '').toLowerCase() === 'admin') { clearCart(); }
    });
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <TopBar />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="products" />
        <Stack.Screen name="cart" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="recipes" />
        <Stack.Screen name="recipes/[id]" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="orders/[id]" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="external-recipes" />
      </Stack>
      <BottomNav />
    </View>
  );
}