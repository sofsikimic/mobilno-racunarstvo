import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { useOrdersStore } from '../../stores/ordersStore';

export default function Cart() {
  const user = useAuthStore((s) => s.user);
  const { entries, removeItem, updateQty, totalPrice, clearCart } = useCartStore();
  const createOrder = useOrdersStore((s) => s.createOrder);

  async function handleCheckout() {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      await createOrder(entries());
      clearCart();
      router.push('/profile');
    } catch {}
  }

  const cartItems = entries();
  const total = totalPrice();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Korpa</Text>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>Korpa je prazna.</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/products')}
          >
            <Text style={styles.buttonText}>Idi na proizvode</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => String(item.product.id)}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.product.name}</Text>
                  <Text style={styles.cardPrice}>
                    {item.product.price} RSD x {item.qty}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => updateQty(item.product.id, item.qty - 1)}
                  >
                    <Text style={styles.qtyButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qty}>{item.qty}</Text>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => updateQty(item.product.id, item.qty + 1)}
                  >
                    <Text style={styles.qtyButtonText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeItem(item.product.id)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          <View style={styles.footer}>
            <Text style={styles.total}>Ukupno: {total} RSD</Text>
            <TouchableOpacity style={styles.button} onPress={handleCheckout}>
              <Text style={styles.buttonText}>Poruči</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    color: '#64748b',
    fontSize: 16,
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  cardPrice: {
    fontSize: 13,
    color: '#dc2626',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    backgroundColor: '#e2e8f0',
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  qty: {
    fontSize: 15,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    backgroundColor: '#fef2f2',
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
    marginTop: 8,
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#dc2626',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});