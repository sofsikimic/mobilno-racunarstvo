import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Modal, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { Minus, Plus, Trash2, ShoppingBag, CreditCard, X, User, Phone, MapPin, ClipboardList } from 'lucide-react-native';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { useOrdersStore } from '../../stores/ordersStore';
import { colors, radius } from '../constants/theme';

function CheckoutModal({ visible, onClose, items, total, isLoading, error, onConfirm }) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);

  const canSubmit = useMemo(() => {
    if (!items?.length) return false;
    if (!customerName.trim()) return false;
    if (!phone.trim()) return false;
    if (!address.trim()) return false;
    return true;
  }, [items, customerName, phone, address]);

  async function submit() {
    setTouched(true);
    if (!canSubmit) return;
    await onConfirm({ customerName: customerName.trim(), phone: phone.trim(), address: address.trim(), note: note.trim() });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.container}>
          <View style={modal.header}>
            <View>
              <Text style={modal.title}>Checkout</Text>
              <Text style={modal.subtitle}>Confirm your order details.</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
              <X size={18} color={colors.slate700} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }}>
            {error ? <Text style={modal.error}>{error}</Text> : null}

            <Text style={modal.label}>Full name</Text>
            <View style={modal.inputRow}>
              <User size={16} color={colors.slate500} />
              <TextInput style={modal.input} value={customerName} onChangeText={setCustomerName} placeholder="e.g. John" placeholderTextColor={colors.slate500} />
            </View>
            {touched && !customerName.trim() ? <Text style={modal.fieldError}>Name is required.</Text> : null}

            <Text style={modal.label}>Phone</Text>
            <View style={modal.inputRow}>
              <Phone size={16} color={colors.slate500} />
              <TextInput style={modal.input} value={phone} onChangeText={setPhone} placeholder="e.g. +381..." placeholderTextColor={colors.slate500} keyboardType="phone-pad" />
            </View>
            {touched && !phone.trim() ? <Text style={modal.fieldError}>Phone is required.</Text> : null}

            <Text style={modal.label}>Address</Text>
            <View style={modal.inputRow}>
              <MapPin size={16} color={colors.slate500} />
              <TextInput style={modal.input} value={address} onChangeText={setAddress} placeholder="Street, number, city" placeholderTextColor={colors.slate500} />
            </View>
            {touched && !address.trim() ? <Text style={modal.fieldError}>Address is required.</Text> : null}

            <Text style={modal.label}>Note (optional)</Text>
            <View style={[modal.inputRow, { alignItems: 'flex-start', paddingTop: 10 }]}>
              <ClipboardList size={16} color={colors.slate500} />
              <TextInput style={[modal.input, { minHeight: 80 }]} value={note} onChangeText={setNote} placeholder="Delivery notes, door code, etc." placeholderTextColor={colors.slate500} multiline />
            </View>

            <View style={modal.summary}>
              <Text style={modal.summaryTitle}>Order summary</Text>
              <View style={modal.summaryRow}>
                <Text style={modal.summaryLabel}>Lines</Text>
                <Text style={modal.summaryValue}>{items.length}</Text>
              </View>
              <View style={modal.summaryRow}>
                <Text style={modal.summaryLabel}>Total</Text>
                <Text style={modal.summaryTotal}>{Number(total).toFixed(2)}</Text>
              </View>
            </View>

            <Text style={modal.disclaimer}>Payment is simulated for MVP (no external payments yet).</Text>

            <View style={modal.actions}>
              <TouchableOpacity style={modal.cancelBtn} onPress={onClose} disabled={isLoading}>
                <Text style={modal.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[modal.confirmBtn, (!canSubmit || isLoading) && { opacity: 0.6 }]} onPress={submit} disabled={!canSubmit || isLoading}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <>
                  <CreditCard size={16} color="#fff" />
                  <Text style={modal.confirmBtnText}>Place order</Text>
                </>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  container: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', borderWidth: 1, borderColor: colors.slate200 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.slate200 },
  title: { fontSize: 16, fontWeight: '800', color: colors.slate900 },
  subtitle: { fontSize: 13, color: colors.slate600, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  error: { backgroundColor: colors.redLight, borderWidth: 1, borderColor: '#fecaca', borderRadius: radius.sm, padding: 10, color: colors.redDark, fontSize: 13, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '700', color: colors.slate700, marginTop: 14, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 10 },
  input: { flex: 1, fontSize: 14, color: colors.slate900 },
  fieldError: { fontSize: 12, color: colors.redDark, fontWeight: '600', marginTop: 4 },
  summary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.md, padding: 14, marginTop: 16 },
  summaryTitle: { fontSize: 14, fontWeight: '800', color: colors.slate900, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  summaryLabel: { fontSize: 13, color: colors.slate700 },
  summaryValue: { fontSize: 13, fontWeight: '600', color: colors.slate900 },
  summaryTotal: { fontSize: 16, fontWeight: '800', color: colors.slate900 },
  disclaimer: { fontSize: 12, color: colors.slate500, marginTop: 12, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 24 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.sm, padding: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: colors.slate700 },
  confirmBtn: { flex: 1, backgroundColor: colors.green, borderRadius: radius.sm, padding: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  confirmBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});

export default function Cart() {
  const user = useAuthStore((s) => s.user);
  const role = (user?.role || '').toLowerCase();
  const isUser = role === 'user';

  const items = useCartStore((s) => s.items);
  const increase = useCartStore((s) => s.increase);
  const decrease = useCartStore((s) => s.decrease);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);
  const total = useCartStore((s) => s.totalPrice());
  const count = useCartStore((s) => s.totalItems());

  const createOrder = useOrdersStore((s) => s.createOrder);
  const isLoading = useOrdersStore((s) => s.isLoading);
  const error = useOrdersStore((s) => s.error);
  const clearMessages = useOrdersStore((s) => s.clearMessages);

  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const orderPayloadItems = useMemo(() => {
    return (items || []).map((it) => ({ product_id: it.productId, quantity: Number(it.quantity || 0) }));
  }, [items]);

  async function handleConfirmCheckout() {
    clearMessages();
    if (!isUser) return;
    try {
      await createOrder({ items: orderPayloadItems });
      clear();
      setCheckoutOpen(false);
      router.push('/profile');
    } catch {}
  }

  const canCheckout = isUser && items.length > 0 && !isLoading;

  if (!items.length) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <ShoppingBag size={24} color={colors.slate600} />
        </View>
        <Text style={styles.emptyTitle}>No items yet</Text>
        <Text style={styles.emptySubtitle}>Go to Products and add something to your cart.</Text>
        <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/products')}>
          <Text style={styles.browseBtnText}>Browse products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Cart</Text>
          <Text style={styles.subtitle}>{count > 0 ? `You have ${count} item(s) in your cart.` : 'Your cart is empty.'}</Text>
        </View>
        <TouchableOpacity style={styles.clearBtn} onPress={clear}>
          <Trash2 size={16} color={colors.slate700} />
          <Text style={styles.clearBtnText}>Clear cart</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.productId)}
        renderItem={({ item }) => {
          const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);
          return (
            <View style={styles.card}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardMeta}>Unit: {item.unit || '-'} • Price: {Number(item.price).toFixed(2)}</Text>
              <View style={styles.cardRow}>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => decrease(item.productId)}>
                    <Minus size={16} color={colors.slate700} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.qtyInput}
                    value={String(item.quantity)}
                    onChangeText={(v) => setQuantity(item.productId, v)}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => increase(item.productId)}>
                    <Plus size={16} color={colors.slate700} />
                  </TouchableOpacity>
                </View>
                <View style={styles.subtotalCol}>
                  <Text style={styles.subtotalLabel}>Subtotal</Text>
                  <Text style={styles.subtotalValue}>{lineTotal.toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.productId)}>
                  <Trash2 size={18} color={colors.slate700} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items</Text>
              <Text style={styles.summaryValue}>{count}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryTotal}>{Number(total).toFixed(2)}</Text>
            </View>

            {!user ? (
              <View style={styles.authBox}>
                <Text style={styles.authBoxText}>Please sign in to checkout.</Text>
                <View style={styles.authBoxBtns}>
                  <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
                    <Text style={styles.loginBtnText}>Login</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/register')}>
                    <Text style={styles.registerBtnText}>Register</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : !isUser ? (
              <View style={styles.adminBox}>
                <Text style={styles.adminBoxText}>Checkout is available only for <Text style={{ fontWeight: '700' }}>user</Text> accounts.</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.checkoutBtn, !canCheckout && { opacity: 0.6 }]}
              onPress={() => { clearMessages(); setCheckoutOpen(true); }}
              disabled={!canCheckout}
            >
              <CreditCard size={18} color="#fff" />
              <Text style={styles.checkoutBtnText}>{isLoading ? 'Processing...' : 'Checkout'}</Text>
            </TouchableOpacity>

            <Text style={styles.checkoutNote}>After checkout, your order will be created and you'll be redirected to order details.</Text>
          </View>
        }
      />

      <CheckoutModal
        visible={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={items}
        total={total}
        isLoading={isLoading}
        error={error}
        onConfirm={handleConfirmCheckout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.white },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: colors.white },
  emptyIcon: { width: 48, height: 48, backgroundColor: colors.slate50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.slate900, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: colors.slate600, textAlign: 'center', marginBottom: 20 },
  browseBtn: { backgroundColor: colors.red, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.sm },
  browseBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: colors.slate900 },
  subtitle: { fontSize: 13, color: colors.slate600, marginTop: 2 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm },
  clearBtnText: { fontSize: 13, fontWeight: '600', color: colors.slate700 },
  error: { backgroundColor: colors.redLight, borderWidth: 1, borderColor: '#fecaca', borderRadius: radius.sm, padding: 10, color: colors.redDark, fontSize: 13, marginBottom: 12 },
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.white, padding: 14, marginBottom: 10 },
  cardName: { fontSize: 15, fontWeight: '800', color: colors.slate900 },
  cardMeta: { fontSize: 13, color: colors.slate600, marginTop: 4 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.sm, padding: 4 },
  qtyBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  qtyInput: { width: 48, textAlign: 'center', fontSize: 14, fontWeight: '600', color: colors.slate900 },
  subtotalCol: { flex: 1, alignItems: 'flex-end' },
  subtotalLabel: { fontSize: 12, color: colors.slate500 },
  subtotalValue: { fontSize: 15, fontWeight: '800', color: colors.slate900 },
  removeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.white },
  summary: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.white, padding: 16, marginBottom: 24 },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: colors.slate900, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontSize: 13, color: colors.slate700 },
  summaryValue: { fontSize: 13, fontWeight: '600', color: colors.slate900 },
  summaryTotal: { fontSize: 18, fontWeight: '800', color: colors.slate900 },
  authBox: { backgroundColor: colors.redLight, borderWidth: 1, borderColor: '#fecaca', borderRadius: radius.md, padding: 12, marginTop: 12 },
  authBoxText: { fontSize: 13, color: colors.redDark },
  authBoxBtns: { flexDirection: 'row', gap: 8, marginTop: 8 },
  loginBtn: { backgroundColor: colors.red, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm },
  loginBtnText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  registerBtn: { borderWidth: 1, borderColor: '#fecaca', backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm },
  registerBtnText: { color: colors.redDark, fontWeight: '700', fontSize: 12 },
  adminBox: { backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.md, padding: 12, marginTop: 12 },
  adminBoxText: { fontSize: 13, color: colors.slate700 },
  checkoutBtn: { flexDirection: 'row', backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: radius.sm, marginTop: 16 },
  checkoutBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  checkoutNote: { fontSize: 12, color: colors.slate500, marginTop: 10, textAlign: 'center' },
});