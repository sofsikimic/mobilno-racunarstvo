import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { User, Mail, Shield, XCircle, ArrowRight } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { useOrdersStore } from '../../stores/ordersStore';
import { colors, radius } from '../constants/theme';

function OrderCard({ o, isUser, onCancel }) {
  const status = String(o.status || '').toUpperCase();
  const canCancel = isUser && status === 'PENDING';

  function getBadgeStyle(status) {
    switch (status) {
      case 'PENDING': return { bg: '#fef9c3', text: '#854d0e' };
      case 'CONFIRMED': return { bg: '#dbeafe', text: '#1e40af' };
      case 'DELIVERED': return { bg: '#dcfce7', text: '#166534' };
      case 'CANCELLED': return { bg: '#fee2e2', text: '#991b1b' };
      default: return { bg: colors.slate50, text: colors.slate700 };
    }
  }

  const badge = getBadgeStyle(status);

  return (
    <View style={order.card}>
      <View style={order.cardTop}>
        <View style={order.cardLeft}>
          <View style={order.cardTitleRow}>
            <Text style={order.cardId}>Order #{o.id}</Text>
            <View style={[order.badge, { backgroundColor: badge.bg }]}>
              <Text style={[order.badgeText, { color: badge.text }]}>{status}</Text>
            </View>
          </View>
          <Text style={order.cardMeta}>
            Total: <Text style={order.cardMetaBold}>{Number(o.total_price).toFixed(2)}</Text>
          </Text>
          <Text style={order.cardDate}>
            Created: {o.created_at ? new Date(o.created_at).toLocaleString() : '—'}
          </Text>
        </View>
      </View>

      <View style={order.cardActions}>
        <TouchableOpacity
          style={order.detailsBtn}
          onPress={() => router.push(`/orders/${o.id}`)}
        >
          <Text style={order.detailsBtnText}>Details</Text>
          <ArrowRight size={16} color="#fff" />
        </TouchableOpacity>

        {canCancel ? (
          <TouchableOpacity style={order.cancelBtn} onPress={() => onCancel(o.id)}>
            <XCircle size={16} color={colors.redDark} />
            <Text style={order.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const order = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLeft: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardId: { fontSize: 14, fontWeight: '800', color: colors.slate900 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardMeta: { fontSize: 13, color: colors.slate700, marginTop: 6 },
  cardMetaBold: { fontWeight: '800', color: colors.slate900 },
  cardDate: { fontSize: 12, color: colors.slate500, marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.red, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm },
  detailsBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#fecaca', backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm },
  cancelBtnText: { color: colors.redDark, fontWeight: '700', fontSize: 13 },
});

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const fetchOrders = useOrdersStore((s) => s.fetchOrders);
  const orders = useOrdersStore((s) => s.items);
  const isLoading = useOrdersStore((s) => s.isLoading);
  const error = useOrdersStore((s) => s.error);
  const success = useOrdersStore((s) => s.success);
  const clearMessages = useOrdersStore((s) => s.clearMessages);
  const cancelOrder = useOrdersStore((s) => s.cancelOrder);

  const role = (user?.role || '').toLowerCase();
  const isUser = role === 'user';
  const isAdmin = role === 'admin';

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    clearMessages();
    fetchOrders();
  }, [user]);

  const sorted = useMemo(() => orders || [], [orders]);

  async function onCancel(orderId) {
    clearMessages();
    try {
      await cancelOrder(orderId);
      await fetchOrders();
    } catch {}
  }

  if (!user) return null;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={sorted}
      keyExtractor={(o) => String(o.id)}
      ListHeaderComponent={
        <>
          {/* Profile card */}
          <View style={styles.profileCard}>
            <View style={styles.profileCardTop}>
              <View>
                <Text style={styles.profileTitle}>Profile</Text>
                <Text style={styles.profileSubtitle}>Your account information.</Text>
              </View>
              <View style={styles.profileIcon}>
                <User size={22} color={colors.slate700} />
              </View>
            </View>

            <View style={styles.profileFields}>
              <View style={styles.profileField}>
                <User size={16} color={colors.slate500} />
                <Text style={styles.profileFieldValue}>{user?.name}</Text>
              </View>
              <View style={styles.profileField}>
                <Mail size={16} color={colors.slate500} />
                <Text style={styles.profileFieldValue}>{user?.email}</Text>
              </View>
              <View style={styles.profileField}>
                <Shield size={16} color={colors.slate500} />
                <Text style={styles.profileFieldValue}>{isAdmin ? 'Admin' : 'User'}</Text>
              </View>
            </View>

            <View style={styles.profileNote}>
              <Text style={styles.profileNoteText}>
                {isAdmin
                  ? 'Admins can manage catalog and update order statuses.'
                  : 'Users can view and cancel PENDING orders.'}
              </Text>
            </View>
          </View>

          {/* Orders header */}
          <View style={styles.ordersHeader}>
            <View>
              <Text style={styles.ordersTitle}>{isAdmin ? 'All orders' : 'My orders'}</Text>
              <Text style={styles.ordersSubtitle}>
                {isAdmin ? 'Overview of every order in the system.' : 'View your order history and status.'}
              </Text>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchOrders()}>
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}

          {isLoading ? (
            <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 20 }} />
          ) : !sorted.length ? (
            <Text style={styles.empty}>
              {isAdmin
                ? 'No orders in the system yet.'
                : (<>No orders yet.{' '}<Text style={styles.emptyLink} onPress={() => router.push('/products')}>Browse products</Text></>)}
            </Text>
          ) : null}
        </>
      }
      renderItem={({ item }) => (
        <OrderCard o={item} isUser={isUser} onCancel={onCancel} />
      )}
      ListFooterComponent={
        isAdmin ? (
          <View style={styles.adminNote}>
            <Text style={styles.adminNoteText}>Admins see all orders in the Admin page (filters by user/status).</Text>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: 16, paddingBottom: 40 },
  profileCard: { borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.white, borderRadius: radius.lg, padding: 20, marginBottom: 20 },
  profileCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  profileTitle: { fontSize: 22, fontWeight: '800', color: colors.slate900 },
  profileSubtitle: { fontSize: 13, color: colors.slate600, marginTop: 2 },
  profileIcon: { width: 44, height: 44, backgroundColor: colors.slate50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  profileFields: { gap: 10 },
  profileField: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileFieldValue: { fontSize: 14, fontWeight: '600', color: colors.slate900 },
  profileNote: { marginTop: 16, backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.sm, padding: 12 },
  profileNoteText: { fontSize: 12, color: colors.slate600 },
  ordersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  ordersTitle: { fontSize: 16, fontWeight: '800', color: colors.slate900 },
  ordersSubtitle: { fontSize: 13, color: colors.slate600, marginTop: 2 },
  refreshBtn: { borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm },
  refreshBtnText: { fontSize: 13, fontWeight: '600', color: colors.slate700 },
  error: { backgroundColor: colors.redLight, borderWidth: 1, borderColor: '#fecaca', borderRadius: radius.sm, padding: 10, color: colors.redDark, fontSize: 13, marginBottom: 12 },
  success: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: radius.sm, padding: 10, color: colors.greenDark, fontSize: 13, marginBottom: 12 },
  empty: { fontSize: 13, color: colors.slate600 },
  emptyLink: { fontWeight: '700', color: colors.red },
  adminNote: { backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.sm, padding: 12, marginTop: 8 },
  adminNoteText: { fontSize: 13, color: colors.slate700 },
});