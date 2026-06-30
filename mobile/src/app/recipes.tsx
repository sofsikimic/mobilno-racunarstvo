import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { router } from 'expo-router';
import { CookingPot, ArrowRight, Heart, Star } from 'lucide-react-native';
import { useRecipesStore } from '../../stores/recipesStore';
import { useAuthStore } from '../../stores/authStore';
import { colors, radius } from '../constants/theme';

function StarRow({ avg, count }) {
  if (!avg) return <Text style={styles.noRating}>No ratings yet</Text>;
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          color={s <= Math.round(avg) ? '#f59e0b' : colors.slate200}
          fill={s <= Math.round(avg) ? '#f59e0b' : 'transparent'}
        />
      ))}
      <Text style={styles.ratingText}>{avg.toFixed(1)} ({count})</Text>
    </View>
  );
}

export default function Recipes() {
  const { items, isLoading, error, search, setQuery, fetchRecipes, toggleFavorite } = useRecipesStore();
  const user = useAuthStore((s) => s.user);
  const isUser = (user?.role || '').toLowerCase() === 'user';
  const [favLoading, setFavLoading] = useState(null);

  useEffect(() => {
    fetchRecipes();
  }, []);

  async function handleFavorite(item) {
    if (!isUser || favLoading) return;
    setFavLoading(item.id);
    try {
      await toggleFavorite(item.id, item.is_favorited);
    } catch (e) {
      console.warn('Favorite error:', e?.message);
    }
    setFavLoading(null);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recipes</Text>
      <Text style={styles.subtitle}>Search recipes by name, description, or ingredient.</Text>

      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={(v) => setQuery({ search: v })}
        placeholder="Search recipes..."
        placeholderTextColor={colors.slate500}
        onSubmitEditing={() => fetchRecipes({ search })}
        returnKeyType="search"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const desc = (item.description || '').trim();
            const short = desc.length > 140 ? `${desc.slice(0, 140).trim()}...` : desc || '—';
            const isFavLoading = favLoading === item.id;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <CookingPot size={18} color={colors.slate500} />
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  {isUser && (
                    <TouchableOpacity
                      onPress={() => handleFavorite(item)}
                      disabled={!!favLoading}
                      style={styles.heartBtn}
                    >
                      {isFavLoading
                        ? <ActivityIndicator size="small" color='#ef4444' />
                        : <Heart
                            size={18}
                            color={item.is_favorited ? '#ef4444' : colors.slate300}
                            fill={item.is_favorited ? '#ef4444' : 'transparent'}
                          />
                      }
                    </TouchableOpacity>
                  )}
                </View>

                <StarRow avg={item.avg_rating} count={item.ratings_count} />
                <Text style={styles.cardDesc}>{short}</Text>

                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => router.push(`/recipes/${item.id}`)}
                >
                  <Text style={styles.detailsButtonText}>View details</Text>
                  <ArrowRight size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>No recipes found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.white },
  title: { fontSize: 24, fontWeight: '800', color: colors.slate900 },
  subtitle: { fontSize: 13, color: colors.slate600, marginTop: 4, marginBottom: 16 },
  searchInput: {
    borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.sm,
    padding: 10, marginBottom: 12, fontSize: 14, backgroundColor: colors.slate50,
  },
  error: { color: colors.redDark, backgroundColor: colors.redLight, padding: 12, borderRadius: radius.sm, marginBottom: 12 },
  card: {
    borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.lg,
    padding: 14, marginBottom: 12, backgroundColor: colors.white,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { fontSize: 16, fontWeight: '800', color: colors.slate900, flex: 1 },
  heartBtn: { padding: 4, minWidth: 26, alignItems: 'center' },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
  noRating: { fontSize: 11, color: colors.slate400, marginTop: 6 },
  ratingText: { fontSize: 11, color: colors.slate500, marginLeft: 4 },
  cardDesc: { fontSize: 13, color: colors.slate600, marginTop: 8, lineHeight: 18 },
  detailsButton: {
    flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', gap: 6,
    backgroundColor: colors.green, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: radius.sm, marginTop: 12,
  },
  detailsButtonText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  empty: { textAlign: 'center', color: colors.slate500, marginTop: 40, fontSize: 14 },
});