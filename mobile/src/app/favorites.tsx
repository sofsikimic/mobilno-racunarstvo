import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Heart, ArrowRight, Star, CookingPot } from 'lucide-react-native';
import { useRecipesStore } from '../../stores/recipesStore';
import { useAuthStore } from '../../stores/authStore';
import { colors, radius } from '../constants/theme';
import { apiFetch } from '../../lib/api';

export default function Favorites() {
  const user = useAuthStore((s) => s.user);
  const { items, isLoading, error, fetchRecipes } = useRecipesStore();
  const [favLoading, setFavLoading] = useState(null);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    fetchRecipes({ favoritesOnly: true });
  }, [user]);

  async function handleUnfavorite(item) {
    if (favLoading) return;
    setFavLoading(item.id);
    try {
      await apiFetch(`/api/recipes/${item.id}/favorite`, { method: 'DELETE' });
      await fetchRecipes({ favoritesOnly: true });
    } catch {}
    setFavLoading(null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Heart size={22} color='#ef4444' fill='#ef4444' />
        <Text style={styles.title}>My Favorites</Text>
      </View>
      <Text style={styles.subtitle}>Recipes you've saved for later.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const desc = (item.description || '').trim();
            const short = desc.length > 120 ? `${desc.slice(0, 120).trim()}...` : desc || '—';
            const isRemoving = favLoading === item.id;
            return (
              <View style={[styles.card, isRemoving && { opacity: 0.5 }]}>
                <View style={styles.cardHeader}>
                  <CookingPot size={16} color={colors.slate500} />
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  <TouchableOpacity
                    onPress={() => handleUnfavorite(item)}
                    disabled={!!favLoading}
                    style={styles.heartBtn}
                  >
                    {isRemoving
                      ? <ActivityIndicator size="small" color='#ef4444' />
                      : <Heart size={18} color='#ef4444' fill='#ef4444' />
                    }
                  </TouchableOpacity>
                </View>

                {item.avg_rating ? (
                  <View style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        color={s <= Math.round(item.avg_rating) ? '#f59e0b' : colors.slate200}
                        fill={s <= Math.round(item.avg_rating) ? '#f59e0b' : 'transparent'}
                      />
                    ))}
                    <Text style={styles.ratingText}>{item.avg_rating.toFixed(1)} ({item.ratings_count})</Text>
                  </View>
                ) : (
                  <Text style={styles.noRating}>No ratings yet</Text>
                )}

                {item.my_rating ? (
                  <Text style={styles.myRating}>Your rating: {'★'.repeat(item.my_rating)}{'☆'.repeat(5 - item.my_rating)}</Text>
                ) : null}

                <Text style={styles.cardDesc}>{short}</Text>

                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => router.push(`/recipes/${item.id}`)}
                >
                  <Text style={styles.viewBtnText}>View details</Text>
                  <ArrowRight size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Heart size={40} color={colors.slate200} />
              <Text style={styles.empty}>No favorites yet.</Text>
              <Text style={styles.emptySub}>Tap the heart icon on any recipe to save it here.</Text>
              <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/recipes')}>
                <Text style={styles.browseBtnText}>Browse recipes</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: '800', color: colors.slate900 },
  subtitle: { fontSize: 13, color: colors.slate600, marginTop: 4, marginBottom: 16 },
  error: { color: colors.redDark, backgroundColor: colors.redLight, padding: 12, borderRadius: radius.sm, marginBottom: 12 },
  card: {
    borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.lg,
    padding: 14, marginBottom: 12, backgroundColor: colors.white,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { fontSize: 16, fontWeight: '800', color: colors.slate900, flex: 1 },
  heartBtn: { padding: 4, minWidth: 26, alignItems: 'center' },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
  ratingText: { fontSize: 11, color: colors.slate500, marginLeft: 4 },
  noRating: { fontSize: 11, color: colors.slate400, marginTop: 6 },
  myRating: { fontSize: 12, color: '#f59e0b', fontWeight: '600', marginTop: 4 },
  cardDesc: { fontSize: 13, color: colors.slate600, marginTop: 8, lineHeight: 18 },
  viewBtn: {
    flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', gap: 6,
    backgroundColor: colors.green, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: radius.sm, marginTop: 12,
  },
  viewBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 8 },
  empty: { fontSize: 18, fontWeight: '800', color: colors.slate700 },
  emptySub: { fontSize: 13, color: colors.slate500, textAlign: 'center' },
  browseBtn: { backgroundColor: colors.red, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.sm, marginTop: 8 },
  browseBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});