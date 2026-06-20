import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useOrdersStore } from '../../stores/ordersStore';
import { useEffect } from 'react';
import { FlatList } from 'react-native';

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { items: orders, isLoading, fetchOrders } = useOrdersStore();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    fetchOrders();
  }, [user]);

  async function handleLogout() {
    try {
      await logout();
      router.replace('/');
    } catch {}
  }

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.role}>{user.role}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Odjavi se</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Moje porudžbine</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#dc2626" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View>
                <Text style={styles.orderId}>Porudžbina #{item.id}</Text>
                <Text style={styles.orderStatus}>{item.status}</Text>
                <Text style={styles.orderDate}>{item.created_at}</Text>
              </View>
              <Text style={styles.orderTotal}>{item.total_price} RSD</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Nemate porudžbina.</Text>
          }
        />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  email: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  role: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  orderCard: {
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
  orderId: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  orderStatus: {
    fontSize: 13,
    color: '#16a34a',
    marginTop: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  empty: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 40,
    fontSize: 14,
  },
});