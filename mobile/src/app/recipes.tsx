import { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { router } from 'expo-router';
import { CookingPot, ArrowRight } from 'lucide-react-native';
import { useRecipesStore } from '../../stores/recipesStore';
import { colors, radius } from '../constants/theme';

export default function Recipes() {
  const { items, isLoading, error, search, setQuery, fetchRecipes } = useRecipesStore();

  useEffect(() => {
    fetchRecipes();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recipes</Text>
      <Text style={styles.subtitle}>
        Search recipes by name, description, or ingredient.
      </Text>

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
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <CookingPot size={18} color={colors.slate500} />
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                </View>
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
          ListEmptyComponent={
            <Text style={styles.empty}>No recipes found.</Text>
          }
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
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
    backgroundColor: colors.slate50,
  },
  error: {
    color: colors.redDark,
    backgroundColor: colors.redLight,
    padding: 12,
    borderRadius: radius.sm,
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    backgroundColor: colors.white,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.slate900,
    flexShrink: 1,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.slate600,
    marginTop: 8,
    lineHeight: 18,
  },
  detailsButton: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.green,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    marginTop: 12,
  },
  detailsButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  empty: {
    textAlign: 'center',
    color: colors.slate500,
    marginTop: 40,
    fontSize: 14,
  },
});