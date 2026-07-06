import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Image, Linking, ScrollView
} from 'react-native';
import { Search, X, ExternalLink } from 'lucide-react-native';
import { useExternalRecipesStore } from '../../stores/externalRecipesStore';
import { colors, radius } from '../constants/theme';

function pickQuery(recipe) {
  const name = String(recipe?.name || '').trim();
  if (!name) return '';
  const stop = new Set(['and','with','the','a','an','of','for','to','in','on','recipe','style','homemade','easy','quick','salad','sauce','soup','cake']);
  const words = name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const strong = words.find((w) => w.length >= 4 && !stop.has(w));
  return strong || words[0] || '';
}

function ExternalRecipeCard({ r }) {
  return (
    <View style={styles.card}>
      {r?.image ? (
        <Image source={{ uri: r.image }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{r?.title || 'Untitled'}</Text>
        <View style={styles.cardTags}>
          {r?.category ? <Text style={styles.tag}>{r.category}</Text> : null}
          {r?.area ? <Text style={styles.tag}>{r.area}</Text> : null}
        </View>
        {r?.youtube ? (
          <TouchableOpacity style={styles.watchBtn} onPress={() => Linking.openURL(r.youtube)}>
            <ExternalLink size={14} color="#fff" />
            <Text style={styles.watchBtnText}>Watch</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export default function ExternalRecipes() {
  const items = useExternalRecipesStore((s) => s.items);
  const isLoading = useExternalRecipesStore((s) => s.isLoading);
  const error = useExternalRecipesStore((s) => s.error);
  const q = useExternalRecipesStore((s) => s.q);
  const search = useExternalRecipesStore((s) => s.search);
  const clear = useExternalRecipesStore((s) => s.clear);

  const [draft, setDraft] = useState('');

  function onSearch() {
    if (draft.trim()) search(draft.trim());
  }

  function onClear() {
    setDraft('');
    clear();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>External Recipes</Text>
      <Text style={styles.subtitle}>Suggestions from TheMealDB.</Text>

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Search size={16} color={colors.slate500} />
          <TextInput
            style={styles.searchInput}
            value={draft}
            onChangeText={setDraft}
            placeholder="Search external recipes..."
            placeholderTextColor={colors.slate500}
            onSubmitEditing={onSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
          <X size={16} color={colors.slate700} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.searchBtn} onPress={onSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items.slice(0, 6)}
          keyExtractor={(r) => `${r.source}-${r.external_id}`}
          renderItem={({ item }) => <ExternalRecipeCard r={item} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No external recipes found. Try searching above.</Text>
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
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center' },
  searchInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.sm,
    backgroundColor: colors.slate50, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.slate900 },
  clearBtn: {
    borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.sm,
    padding: 10, backgroundColor: colors.white,
  },
  searchBtn: {
    backgroundColor: colors.red, paddingHorizontal: 14,
    paddingVertical: 10, borderRadius: radius.sm,
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  error: {
    backgroundColor: colors.redLight, borderWidth: 1, borderColor: '#fecaca',
    borderRadius: radius.sm, padding: 10, color: colors.redDark, fontSize: 13, marginBottom: 12,
  },
  card: {
    flexDirection: 'row', borderWidth: 1, borderColor: colors.slate200,
    borderRadius: radius.lg, padding: 12, marginBottom: 12, backgroundColor: colors.white, gap: 12,
  },
  cardImage: { width: 80, height: 80, borderRadius: radius.md, backgroundColor: colors.slate100 },
  cardImagePlaceholder: { backgroundColor: colors.slate100 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.slate900 },
  cardTags: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  tag: {
    fontSize: 11, fontWeight: '600', color: colors.slate700,
    backgroundColor: colors.slate50, borderRadius: 99,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: colors.slate200,
  },
  watchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.red, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: radius.sm, marginTop: 8, alignSelf: 'flex-start',
  },
  watchBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  empty: { textAlign: 'center', color: colors.slate500, marginTop: 40, fontSize: 14 },
});