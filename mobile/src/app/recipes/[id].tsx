import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ShoppingCart, Plus } from 'lucide-react-native';
import { useAuthStore } from '../../../stores/authStore';
import { useRecipesStore } from '../../../stores/recipesStore';
import { useRecipeIngredientsStore } from '../../../stores/recipeIngredientsStore';
import { useProductsStore } from '../../../stores/productsStore';
import { useCartStore } from '../../../stores/cartStore';
import { colors, radius } from '../../constants/theme';

export default function RecipeDetails() {
  const { id } = useLocalSearchParams();

  const user = useAuthStore((s) => s.user);
  const role = (user?.role || '').toLowerCase();
  const canAddToCart = role === 'user';

  const recipe = useRecipesStore((s) => s.recipe);
  const fetchRecipeById = useRecipesStore((s) => s.fetchRecipeById);

  const ingredients = useRecipeIngredientsStore((s) => s.items);
  const fetchByRecipeId = useRecipeIngredientsStore((s) => s.fetchByRecipeId);
  const setRecipeId = useRecipeIngredientsStore((s) => s.setRecipeId);

  const products = useProductsStore((s) => s.items);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);

  const addItem = useCartStore((s) => s.addItem);

  const [addedMsg, setAddedMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    setAddedMsg('');
    setRecipeId(id);
    fetchProducts();
    fetchRecipeById(id);
    fetchByRecipeId(id);
  }, [id]);

  const productsById = useMemo(() => {
    const map = new Map();
    for (const p of products || []) map.set(Number(p.id), p);
    return map;
  }, [products]);

  function addIngredientToCart(ri, product) {
    if (!canAddToCart || !product) return;
    addItem(product, Number(ri.quantity || 1));
    setAddedMsg(`Added ${ri.quantity}× ${product.name} to cart.`);
    setTimeout(() => setAddedMsg(''), 1200);
  }

  function addWholeRecipeToCart() {
    if (!canAddToCart || !ingredients?.length) return;
    let added = 0;
    for (const ri of ingredients) {
      const p = productsById.get(ri.product_id);
      if (!p) continue;
      const qty = Number(ri.quantity || 1);
      if (qty > 0) {
        addItem(p, qty);
        added += 1;
      }
    }
    setAddedMsg(added > 0 ? `Added ${added} ingredient(s) to cart.` : 'No matching products were added.');
    setTimeout(() => setAddedMsg(''), 1400);
  }

  if (!recipe) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={ingredients}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>{recipe.name}</Text>
            {recipe.description ? (
              <Text style={styles.description}>{recipe.description}</Text>
            ) : null}

            {addedMsg ? <Text style={styles.success}>{addedMsg}</Text> : null}

            {canAddToCart ? (
              <TouchableOpacity style={styles.addAllButton} onPress={addWholeRecipeToCart}>
                <ShoppingCart size={18} color="#fff" />
                <Text style={styles.addAllButtonText}>Add whole recipe to cart</Text>
              </TouchableOpacity>
            ) : null}

            <Text style={styles.sectionTitle}>Ingredients</Text>
          </>
        }
        renderItem={({ item }) => {
          const product = productsById.get(Number(item.product_id));
          return (
            <View style={styles.ingredientRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ingredientName}>{product?.name || 'Unknown product'}</Text>
                <Text style={styles.ingredientQty}>{item.quantity} {product?.unit || ''}</Text>
              </View>
              {canAddToCart ? (
                <TouchableOpacity
                  style={styles.addOneButton}
                  onPress={() => addIngredientToCart(item, product)}
                >
                  <Plus size={16} color="#fff" />
                </TouchableOpacity>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No ingredients listed.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.white },
  title: { fontSize: 24, fontWeight: '800', color: colors.slate900 },
  description: { fontSize: 14, color: colors.slate600, marginTop: 8, lineHeight: 20 },
  success: {
    marginTop: 12,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    color: colors.greenDark,
    padding: 10,
    borderRadius: radius.sm,
    fontSize: 13,
  },
  addAllButton: {
    flexDirection: 'row',
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.sm,
    marginTop: 16,
  },
  addAllButtonText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.slate900, marginTop: 24, marginBottom: 12 },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.slate50,
  },
  ingredientName: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  ingredientQty: { fontSize: 12, color: colors.slate600, marginTop: 2 },
  addOneButton: {
    backgroundColor: colors.green,
    padding: 8,
    borderRadius: radius.sm,
  },
  empty: { textAlign: 'center', color: colors.slate500, marginTop: 20, fontSize: 14 },
});