import { useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { PackageCheck, XCircle, ShoppingBag, Shield } from 'lucide-react-native';
import { useAuthStore } from '../../../stores/authStore';
import { useOrdersStore } from '../../../stores/ordersStore';
import { colors, radius } from '../../constants/theme';

function OrderItemRow({ it }) {
  const qty = Number(it.quantity || 0);
  const price = Number(it.price_at_purchase || 0);
  const line = qty * price;

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemName}>{it.product_name || `Product #${it.product_id}`}</Text>
        <Text style={styles.itemMeta}>
          Qty: <Text style={styles.itemMetaBold}>{qty}</Text>
          {'  •  '}
          Price: <Text style={styles.itemMetaBold}>{price.toFixed(2)}</Text>
        </Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemSubtotalLabel}>Subtotal</Text>
        <Text style={styles.itemSubtotal}>{line.toFixed(2)}</Text>
      </View>
    </View>
  );
}

function getBadgeStyle(status) {
  switch (status) {
    case 'PENDING': return { bg: '#fef9c3', text: '#854d0e' };
    case 'CONFIRMED': return { bg: '#dbeafe', text: '#1e40af' };
    case 'DELIVERED': return { bg: '#dcfce7', text: '#166534' };
    case 'CANCELLED': return { bg: '#fee2e2', text: '#991b1b' };
    default: return { bg: colors.slate50, text: colors.slate700 };
  }
}

export default function OrderDetails() {
  const { id } = useLocalSearchParams();

  const user = useAuthStore((s) => s.user);
  const role = (user?.role || '').toLowerCase();
  const isUser = role === 'user';
  const isAdmin = role === 'admin';

  const order = useOrdersStore((s) => s.order);
  const isLoading = useOrdersStore((s) => s.isLoading);
  const error = useOrdersStore((s) => s.error);
  const success = useOrdersStore((s) => s.success);
  const clearMessages = useOrdersStore((s) => s.clearMessages);
  const clearOrder = useOrdersStore((s) => s.clearOrder);
  const fetchOrderById = useOrdersStore((s) => s.fetchOrderById);
  const cancelOrder = useOrdersStore((s) => s.cancelOrder);

  useEffect(() => {
    clearMessages();
    clearOrder();
    if (!id) return;
    fetchOrderById(id);
  }, [id]);

  const forbidden = useMemo(() => {
    if (!order) return false;
    if (isAdmin) return false;
    if (isUser && order.user_id !== user?.id) return true;
    return false;
  }, [order, isAdmin, isUser, user?.id]);

  const canCancel = useMemo(() => {
    if (!order) return false;
    if (!isUser) return false;
    if (order.user_id !== user?.id) return false;
    return String(order.status || '').toUpperCase() === 'PENDING';
  }, [order, isUser, user?.id]);

  async function onCancel() {
    if (!order) return;
    clearMessages();
    try {
      await cancelOrder(order.id);
      await fetchOrderById(order.id);
    } catch {}
  }

  const status = String(order?.status || '').toUpperCase();
  const badge = getBadgeStyle(status);

  if (!isLoading && (forbidden || (error && String(error).toLowerCase().includes('forbidden')))) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyCard}>
          <Shield size={24} color={colors.slate700} />
          <Text style={styles.emptyTitle}>You can't view this order</Text>
          <Text style={styles.emptySubtitle}>This order belongs to another user.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/profile')}>
            <Text style={styles.backBtnText}>Go to Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading && !order) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyCard}>
          <ShoppingBag size={24} color={colors.slate700} />
          <Text style={styles.emptyTitle}>Order not found</Text>
          <Text style={styles.emptySubtitle}>It may not exist or you don't have access.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/profile')}>
            <Text style={styles.backBtnText}>Go to Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={order.items || []}
      keyExtractor={(it) => String(it.id)}
      ListHeaderComponent={
        <>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Order details</Text>
              <Text style={styles.subtitle}>Review items, totals, and status.</Text>
            </View>
            {canCancel ? (
              <TouchableOpacity
                style={styles.cancelTopBtn}
                onPress={onCancel}
                disabled={isLoading}
              >
                <XCircle size={16} color={colors.redDark} />
                <Text style={styles.cancelTopBtnText}>Cancel</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}

          <View style={styles.itemsHeader}>
            <View style={styles.itemsHeaderLeft}>
              <PackageCheck size={18} color={colors.slate700} />
              <Text style={styles.itemsTitle}>Items</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.text }]}>{status}</Text>
            </View>
          </View>
        </>
      }
      renderItem={({ item }) => <OrderItemRow it={item} />}
      ListEmptyComponent={
        <Text style={styles.empty}>No items found for this order.</Text>
      }
      ListFooterComponent={
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Order ID</Text>
            <Text style={styles.summaryValue}>#{order.id}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>User</Text>
            <Text style={styles.summaryValue}>{order.user_id}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Created</Text>
            <Text style={styles.summaryValue}>
              {order.created_at ? new Date(order.created_at).toLocaleString() : '—'}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryTotal}>{Number(order.total_price).toFixed(2)}</Text>
          </View>

          {canCancel ? (
            <TouchableOpacity
              style={[styles.cancelBtn, isLoading && { opacity: 0.6 }]}
              onPress={onCancel}
              disabled={isLoading}
            >
              <XCircle size={16} color="#fff" />
              <Text style={styles.cancelBtnText}>Cancel order</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.cancelNote}>
              <Text style={styles.cancelNoteText}>
                {isUser
                  ? 'Cancel is available only while the order is PENDING.'
                  : 'Admins manage order statuses in Admin panel.'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.profileBtnText}>Back to Profile</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: colors.slate900 },
  subtitle: { fontSize: 13, color: colors.slate600, marginTop: 2 },
  cancelTopBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#fecaca', backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm },
  cancelTopBtnText: { color: colors.redDark, fontWeight: '700', fontSize: 13 },
  error: { backgroundColor: colors.redLight, borderWidth: 1, borderColor: '#fecaca', borderRadius: radius.sm, padding: 10, color: colors.redDark, fontSize: 13, marginBottom: 12 },
  success: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: radius.sm, padding: 10, color: colors.greenDark, fontSize: 13, marginBottom: 12 },
  itemsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  itemsHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemsTitle: { fontSize: 15, fontWeight: '800', color: colors.slate900 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  itemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.lg, backgroundColor: colors.white, padding: 14, marginBottom: 10 },
  itemLeft: { flex: 1, marginRight: 10 },
  itemName: { fontSize: 14, fontWeight: '800', color: colors.slate900 },
  itemMeta: { fontSize: 13, color: colors.slate600, marginTop: 4 },
  itemMetaBold: { fontWeight: '700', color: colors.slate800 },
  itemRight: { alignItems: 'flex-end' },
  itemSubtotalLabel: { fontSize: 11, color: colors.slate500 },
  itemSubtotal: { fontSize: 15, fontWeight: '800', color: colors.slate900 },
  summary: { borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.lg, backgroundColor: colors.white, padding: 16, marginTop: 8 },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: colors.slate900, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryTotalRow: { borderTopWidth: 1, borderTopColor: colors.slate200, paddingTop: 10, marginTop: 4 },
  summaryLabel: { fontSize: 13, color: colors.slate700 },
  summaryValue: { fontSize: 13, fontWeight: '600', color: colors.slate900 },
  summaryTotal: { fontSize: 18, fontWeight: '800', color: colors.slate900 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.red, padding: 12, borderRadius: radius.sm, marginTop: 16 },
  cancelBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  cancelNote: { backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.sm, padding: 12, marginTop: 16 },
  cancelNoteText: { fontSize: 12, color: colors.slate600 },
  profileBtn: { borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.white, padding: 12, borderRadius: radius.sm, alignItems: 'center', marginTop: 10 },
  profileBtnText: { fontSize: 14, fontWeight: '700', color: colors.slate700 },
  emptyCard: { margin: 16, borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.lg, backgroundColor: colors.white, padding: 32, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.slate900, marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: colors.slate600, marginTop: 4, textAlign: 'center' },
  backBtn: { backgroundColor: colors.red, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.sm, marginTop: 16 },
  backBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});