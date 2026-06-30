import { create } from 'zustand';
import { apiFetch } from '../lib/api';

const msg = (e, fallback) => e?.message || fallback;

export const useRecipesStore = create((set, get) => ({
  items: [],
  recipe: null,

  isLoading: false,
  error: null,
  success: null,

  search: '',
  sort: 'name',
  dir: 'asc',
  productId: '',
  count: 0,

  setQuery: (patch) => set(patch),
  clearMessages: () => set({ error: null, success: null }),
  clearRecipe: () => set({ recipe: null }),

  fetchRecipes: async (params = {}) => {
    const search = params.search ?? get().search;
    const sort = params.sort ?? get().sort;
    const dir = params.dir ?? get().dir;
    const productId = params.productId ?? get().productId;
    const favoritesOnly = params.favoritesOnly ?? false;

    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (sort) qs.set('sort', sort);
    if (dir) qs.set('dir', dir);
    if (productId) qs.set('productId', productId);
    if (favoritesOnly) qs.set('favoritesOnly', '1');

    set({ isLoading: true, error: null });
    try {
      const data = await apiFetch(`/api/recipes?${qs.toString()}`);
      set({
        items: data.items || [],
        count: data.count ?? 0,
        search,
        sort,
        dir,
        productId,
        isLoading: false,
      });
      return data.items || [];
    } catch (e) {
      set({ isLoading: false, error: msg(e, 'Failed to fetch recipes.') });
      return [];
    }
  },

  fetchRecipeById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiFetch(`/api/recipes/${id}`);
      set({ recipe: data.recipe, isLoading: false });
      return data.recipe;
    } catch (e) {
      set({ isLoading: false, error: msg(e, 'Failed to fetch recipe.') });
      return null;
    }
  },

  createRecipe: async ({ name, description, ingredients }) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const data = await apiFetch('/api/recipes', {
        method: 'POST',
        body: JSON.stringify({ name, description, ingredients }),
      });
      set({ isLoading: false, success: data.message || 'Recipe created.' });
      await get().fetchRecipes();
      return data.recipe;
    } catch (e) {
      set({ isLoading: false, error: msg(e, 'Failed to create recipe.') });
      throw e;
    }
  },

  updateRecipe: async (id, patch) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const data = await apiFetch(`/api/recipes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(patch),
      });
      set({ isLoading: false, success: data.message || 'Recipe updated.' });
      await get().fetchRecipes();
      return data.recipe;
    } catch (e) {
      set({ isLoading: false, error: msg(e, 'Failed to update recipe.') });
      throw e;
    }
  },

  deleteRecipe: async (id) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const data = await apiFetch(`/api/recipes/${id}`, { method: 'DELETE' });
      set({ isLoading: false, success: data.message || 'Recipe deleted.' });
      await get().fetchRecipes();
      return true;
    } catch (e) {
      set({ isLoading: false, error: msg(e, 'Failed to delete recipe.') });
      throw e;
    }
  },

  // ─── Favorites ──────────────────────────────────────────────
  // `isFavorited` je TRENUTNO stanje pre togla (ovo očekuju ekrani:
  // toggleFavorite(item.id, item.is_favorited)).
  toggleFavorite: async (id, isFavorited) => {
    const patch = { is_favorited: !isFavorited };

    // optimistic update
    set((s) => ({
      recipe: s.recipe?.id === id ? { ...s.recipe, ...patch } : s.recipe,
      items: s.items.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));

    try {
      if (isFavorited) {
        await apiFetch(`/api/recipes/${id}/favorite`, { method: 'DELETE' });
      } else {
        await apiFetch(`/api/recipes/${id}/favorite`, { method: 'POST' });
      }
      return true;
    } catch (e) {
      // revert ako padne
      set((s) => ({
        recipe: s.recipe?.id === id ? { ...s.recipe, is_favorited: isFavorited } : s.recipe,
        items: s.items.map((r) => (r.id === id ? { ...r, is_favorited: isFavorited } : r)),
        error: msg(e, 'Failed to update favorite.'),
      }));
      throw e;
    }
  },

  // ─── Ratings ────────────────────────────────────────────────
  rateRecipe: async (id, stars) => {
    set({ error: null });
    try {
      const data = await apiFetch(`/api/recipes/${id}/rating`, {
        method: 'POST',
        body: JSON.stringify({ stars }),
      });

      const patch = {
        avg_rating: data.avg_rating,
        ratings_count: data.ratings_count,
        my_rating: data.my_rating,
      };

      set((s) => ({
        recipe: s.recipe?.id === id ? { ...s.recipe, ...patch } : s.recipe,
        items: s.items.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      }));

      return data;
    } catch (e) {
      set({ error: msg(e, 'Failed to save rating.') });
      throw e;
    }
  },

  deleteRating: async (id) => {
    set({ error: null });
    try {
      await apiFetch(`/api/recipes/${id}/rating`, { method: 'DELETE' });

      if (get().recipe?.id === id) {
        await get().fetchRecipeById(id);
      } else {
        set((s) => ({
          items: s.items.map((r) => (r.id === id ? { ...r, my_rating: null } : r)),
        }));
      }

      return true;
    } catch (e) {
      set({ error: msg(e, 'Failed to remove rating.') });
      throw e;
    }
  },
}));