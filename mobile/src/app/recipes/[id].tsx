import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ShoppingCart, Plus, Heart, Star } from 'lucide-react-native';
import { useAuthStore } from '../../../stores/authStore';
import { useRecipesStore } from '../../../stores/recipesStore';
import { useRecipeIngredientsStore } from '../../../stores/recipeIngredientsStore';
import { useProductsStore } from '../../../stores/productsStore';
import { useCartStore } from '../../../stores/cartStore';
import { colors, radius } from '../../constants/theme';
import { apiFetch } from '../../../lib/api';

function StarRating({ current, onRate }) {
  return (
    <View style={styles.starRatingRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity key={s} onPress={() => onRate(s)} style={styles.starBtn}>
          <Star
            size={28}
            color={s <= (current || 0) ? '#f59e0b' : colors.slate200}
            fill={s <= (current || 0) ? '#f59e0b' : 'transparent'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function AvgStars({ avg, count }) {
  if (!avg) return <Text style={styles.noRating}>No ratings yet — be the first!</Text>;
  return (
    <View style={styles.avgRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          color={s <= Math.round(avg) ? '#f59e0b' : colors.slate200}
          fill={s <= Math.round(avg) ? '#f59e0b' : 'transparent'}
        />
      ))}
      <Text style={styles.avgText}>{avg.toFixed(1)} average · {count} {count === 1 ? 'rating' : 'ratings'}</Text>
    </View>
  );
}

export default function RecipeDetails() {
  const { id } = useLocalSearchParams();

  const user = useAuthStore((s) => s.user);
  const role = (user?.role || '').toLowerCase();
  const canAddToCart = role === 'user';
  const isUser = role === 'user';

  const recipe = useRecipesStore((s) => s.recipe);
  const fetchRecipeById = useRecipesStore((s) => s.fetchRecipeById);
  const toggleFavorite = useRecipesStore((s) => s.toggleFavorite);
  const rateRecipe = useRecipesStore((s) => s.rateRecipe);

  const ingredients = useRecipeIngredientsStore((s) => s.items);
  const fetchByRecipeId = useRecipeIngredientsStore((s) => s.fetchByRecipeId);
  const setRecipeId = useRecipeIngredientsStore((s) => s.setRecipeId);

  const products = useProductsStore((s) => s.items);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);

  const addItem = useCartStore((s) => s.addItem);

  const [addedMsg, setAddedMsg] = useState('');
  const [favLoading, setFavLoading] = useState(false);
  const [rateLoading, setRateLoading] = useState(false);

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
      if (qty > 0) { addItem(p, qty); added += 1; }
    }
    setAddedMsg(added > 0 ? `Added ${added} ingredient(s) to cart.` : 'No matching products were added.');
    setTimeout(() => setAddedMsg(''), 1400);
  }

  async function handleFavorite() {
    if (!isUser || !recipe) return;
    setFavLoading(true);
    try { await toggleFavorite(recipe.id, recipe.is_favorited); }
    catch {}
    setFavLoading(false);
  }

  async function handleRate(stars) {
    if (!isUser || !recipe) return;
    // if tapping same star as current rating, remove rating
    if (stars === recipe.my_rating) {
      setRateLoading(true);
      try {
        await apiFetch(`/api/recipes/${recipe.id}/rating`, { method: 'DELETE' });
        await fetchRecipeById(recipe.id);
      } catch {}
      setRateLoading(false);
      return;
    }
    setRateLoading(true);
    try { await rateRecipe(recipe.id, stars); }
    catch {}
    setRateLoading(false);
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
            {/* Title row with favorite heart */}
            <View style={styles.titleRow}>
              <Text style={styles.title}>{recipe.name}</Text>
              {isUser && (
                <TouchableOpacity onPress={handleFavorite} disabled={favLoading} style={styles.heartBtn}>
                  <Heart
                    size={26}
                    color={recipe.is_favorited ? '#ef4444' : colors.slate300}
                    fill={recipe.is_favorited ? '#ef4444' : 'transparent'}
                  />
                </TouchableOpacity>
              )}
            </View>

            {recipe.description ? (
              <Text style={styles.description}>{recipe.description}</Text>
            ) : null}

            {/* Average rating display */}
            <AvgStars avg={recipe.avg_rating} count={recipe.ratings_count} />

            {/* Star rating input for users */}
            {isUser && (
              <View style={styles.rateBox}>
                <Text style={styles.rateLabel}>
                  {recipe.my_rating ? `Your rating: ${recipe.my_rating}/5` : 'Rate this recipe:'}
                </Text>
                <StarRating current={recipe.my_rating} onRate={handleRate} />
                {rateLoading && <ActivityIndicator size="small" color={colors.red} style={{ marginTop: 4 }} />}
                {recipe.my_rating && (
                  <Text style={styles.rateHint}>Tap the same star to remove your rating.</Text>
                )}
              </View>
            )}

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
                <TouchableOpacity style={styles.addOneButton} onPress={() => addIngredientToCart(item, product)}>
                  <Plus size={16} color="#fff" />
                </TouchableOpacity>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No ingredients listed.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.white },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { fontSize: 24, fontWeight: '800', color: colors.slate900, flex: 1 },
  heartBtn: { paddingTop: 2 },
  description: { fontSize: 14, color: colors.slate600, marginTop: 8, lineHeight: 20 },
  avgRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  avgText: { fontSize: 12, color: colors.slate500, marginLeft: 6 },
  noRating: { fontSize: 12, color: colors.slate400, marginTop: 10 },
  rateBox: {
    borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.md,
    padding: 12, marginTop: 14, backgroundColor: colors.slate50,
  },
  rateLabel: { fontSize: 13, fontWeight: '700', color: colors.slate700, marginBottom: 6 },
  starRatingRow: { flexDirection: 'row', gap: 6 },
  starBtn: { padding: 2 },
  rateHint: { fontSize: 11, color: colors.slate400, marginTop: 6 },
  success: {
    marginTop: 12, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0',
    color: colors.greenDark, padding: 10, borderRadius: radius.sm, fontSize: 13,
  },
  addAllButton: {
    flexDirection: 'row', backgroundColor: colors.green, alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 12,
    borderRadius: radius.sm, marginTop: 16,
  },
  addAllButtonText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.slate900, marginTop: 24, marginBottom: 12 },
  ingredientRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.slate200,
    borderRadius: radius.md, padding: 12, marginBottom: 8, backgroundColor: colors.slate50,
  },
  ingredientName: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  ingredientQty: { fontSize: 12, color: colors.slate600, marginTop: 2 },
  addOneButton: { backgroundColor: colors.green, padding: 8, borderRadius: radius.sm },
  empty: { textAlign: 'center', color: colors.slate500, marginTop: 20, fontSize: 14 },
});