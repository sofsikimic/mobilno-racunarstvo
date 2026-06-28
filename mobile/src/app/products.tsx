import { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput
} from 'react-native';
import { ShoppingCart, ArrowUp, ArrowDown } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { useProductsStore } from '../../stores/productsStore';
import { useCartStore } from '../../stores/cartStore';
import { colors, radius } from '../constants/theme';

export default function Products() {
  const user = useAuthStore((s) => s.user);
  const role = (user?.role || '').toLowerCase();
  const canAddToCart = role === 'user';

  const items = useProductsStore((s) => s.items);
  const isLoading = useProductsStore((s) => s.isLoading);
  const error = useProductsStore((s) => s.error);
  const search = useProductsStore((s) => s.search);
  const sort = useProductsStore((s) => s.sort);
  const dir = useProductsStore((s) => s.dir);
  const setQuery = useProductsStore((s) => s.setQuery);
  const clearMessages = useProductsStore((s) => s.clearMessages);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    fetchProducts();
  }, []);

  function handleSearch() {
    clearMessages();
    fetchProducts({ search, sort, dir });
  }

  function handleAdd(product) {
    addItem(product, 1);
  }

  const SORT_OPTIONS = [
    { label: 'Name', value: 'name' },
    { label: 'Price', value: 'price' },
    { label: 'Stock', value: 'stock' },
    { label: 'Date', value: 'created_at' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Products</Text>
          <Text style={styles.subtitle}>
            {canAddToCart
              ? 'Add items directly to your cart.'
              : 'Log in as a user to add to cart.'}
          </Text>
        </View>
      </View>

      {/* Search + sort toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={(v) => setQuery({ search: v })}
            placeholder="Search products..."
            placeholderTextColor={colors.slate500}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.sortChip, sort === opt.value && styles.sortChipActive]}
              onPress={() => {
                setQuery({ sort: opt.value });
                fetchProducts({ sort: opt.value, dir });
              }}
            >
              <Text style={[styles.sortChipText, sort === opt.value && styles.sortChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.dirBtn}
            onPress={() => {
              const newDir = dir === 'asc' ? 'desc' : 'asc';
              setQuery({ dir: newDir });
              fetchProducts({ sort, dir: newDir });
            }}
          >
            {dir === 'asc'
              ? <ArrowUp size={16} color={colors.slate700} />
              : <ArrowDown size={16} color={colors.slate700} />
            }
          </TouchableOpacity>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardMeta}>
                  Unit: <Text style={styles.cardMetaBold}>{item.unit}</Text>
                  {'  •  '}
                  Price: <Text style={styles.cardMetaBold}>{Number(item.price).toFixed(2)}</Text>
                  {'  •  '}
                  Stock: <Text style={styles.cardMetaBold}>{item.stock}</Text>
                </Text>
              </View>
              {canAddToCart ? (
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => handleAdd(item)}
                >
                  <ShoppingCart size={16} color="#fff" />
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.empty}>No products found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.white },
  headerRow: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: colors.slate900 },
  subtitle: { fontSize: 13, color: colors.slate600, marginTop: 4 },
  toolbar: { marginBottom: 16, gap: 10 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1, borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    backgroundColor: colors.slate50, color: colors.slate900,
  },
  searchBtn: {
    backgroundColor: colors.red, paddingHorizontal: 16,
    borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center',
  },
  searchBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  sortChip: {
    borderWidth: 1, borderColor: colors.slate200, borderRadius: 99,
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.white,
  },
  sortChipActive: { backgroundColor: colors.slate900, borderColor: colors.slate900 },
  sortChipText: { fontSize: 12, fontWeight: '600', color: colors.slate700 },
  sortChipTextActive: { color: colors.white },
  dirBtn: {
    borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.sm,
    padding: 6, backgroundColor: colors.white,
  },
  error: {
    backgroundColor: colors.redLight, borderWidth: 1, borderColor: '#fecaca',
    borderRadius: radius.sm, padding: 10, color: colors.redDark, fontSize: 13, marginBottom: 12,
  },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.lg,
    padding: 14, marginBottom: 10, backgroundColor: colors.white,
  },
  cardInfo: { flex: 1, marginRight: 10 },
  cardName: { fontSize: 15, fontWeight: '800', color: colors.slate900 },
  cardMeta: { fontSize: 12, color: colors.slate600, marginTop: 4 },
  cardMetaBold: { fontWeight: '700', color: colors.slate800 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.red, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm,
  },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  empty: { fontSize: 14, color: colors.slate500 },
});