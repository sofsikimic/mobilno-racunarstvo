import { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, TextInput
} from 'react-native';
import { useProductsStore } from '../../stores/productsStore';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';

export default function Products() {
  const user = useAuthStore((s) => s.user);
  const { items, isLoading, error, search, setQuery, fetchProducts } = useProductsStore();
  const addItem = useCartStore((s) => s.addItem);

  const canAddToCart = (user?.role || '').toLowerCase() === 'user';

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Proizvodi</Text>

      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={(v) => setQuery({ search: v })}
        placeholder="Pretraži proizvode..."
        onSubmitEditing={() => fetchProducts({ search })}
        returnKeyType="search"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <ActivityIndicator size="large" color="#dc2626" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardPrice}>{item.price} RSD / {item.unit}</Text>
                <Text style={styles.cardStock}>Na stanju: {item.stock}</Text>
              </View>
              {canAddToCart && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => addItem(item, 1)}
                >
                  <Text style={styles.addButtonText}>+ Dodaj</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Nema proizvoda.</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
    backgroundColor: '#f8fafc',
  },
  error: {
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  cardPrice: {
    fontSize: 14,
    color: '#dc2626',
    marginTop: 2,
  },
  cardStock: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  empty: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 40,
    fontSize: 14,
  },
});