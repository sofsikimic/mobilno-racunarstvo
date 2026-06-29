import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Modal, ScrollView, Alert
} from 'react-native';
import { router } from 'expo-router';
import {
  RefreshCw, Plus, Pencil, Trash2, ExternalLink,
  Tag, Ruler, DollarSign, Boxes, X, Save, PlusCircle,
  BarChart2, Package, CookingPot, ShoppingBag
} from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { useOrdersStore } from '../../stores/ordersStore';
import { useProductsStore } from '../../stores/productsStore';
import { useRecipesStore } from '../../stores/recipesStore';
import { useAdminOverviewStore } from '../../stores/adminOverviewStore';
import { colors, radius } from '../constants/theme';

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'PAID', 'COMPLETED', 'CANCELLED'];

function getBadgeStyle(status) {
  switch (status) {
    case 'PENDING': return { bg: '#fef9c3', text: '#854d0e' };
    case 'PROCESSING': return { bg: '#dbeafe', text: '#1e40af' };
    case 'PAID': return { bg: '#dcfce7', text: '#166534' };
    case 'COMPLETED': return { bg: '#f0fdf4', text: '#15803d' };
    case 'CANCELLED': return { bg: '#fee2e2', text: '#991b1b' };
    default: return { bg: colors.slate50, text: colors.slate700 };
  }
}

// ─── OVERVIEW TAB ───────────────────────────────────────────────
function OverviewTab() {
  const data = useAdminOverviewStore((s) => s.data);
  const isLoading = useAdminOverviewStore((s) => s.isLoading);
  const error = useAdminOverviewStore((s) => s.error);
  const days = useAdminOverviewStore((s) => s.days);
  const fetchOverview = useAdminOverviewStore((s) => s.fetchOverview);
  const clearMessages = useAdminOverviewStore((s) => s.clearMessages);

  useEffect(() => { fetchOverview(); }, []);

  const kpis = data?.kpis || {};
  const tables = data?.tables || {};
  const lowStockItems = tables.low_stock_items || [];

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.tabHeader}>
        <View>
          <Text style={styles.tabTitle}>Overview</Text>
          <Text style={styles.tabSubtitle}>KPIs for the last {days} day(s).</Text>
        </View>
        <TouchableOpacity style={styles.smBtn} onPress={() => { clearMessages(); fetchOverview(); }} disabled={isLoading}>
          <RefreshCw size={16} color={colors.slate700} />
          <Text style={styles.smBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 20 }} /> : null}

      <View style={styles.kpiGrid}>
        {[
          { title: 'Users', value: kpis.users ?? 0 },
          { title: 'Products', value: kpis.products ?? 0 },
          { title: 'Recipes', value: kpis.recipes ?? 0 },
          { title: 'Orders', value: kpis.orders ?? 0 },
          { title: 'Low stock', value: kpis.low_stock_count ?? 0 },
          { title: 'Revenue', value: `$${Number(kpis.total_revenue || 0).toFixed(2)}` },
        ].map((k) => (
          <View key={k.title} style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>{k.title}</Text>
            <Text style={styles.kpiValue}>{k.value}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Low stock items</Text>
      {lowStockItems.length === 0 ? (
        <Text style={styles.empty}>No low stock products.</Text>
      ) : (
        lowStockItems.map((p) => (
          <View key={p.id} style={styles.card}>
            <Text style={styles.cardName}>{p.name}</Text>
            <Text style={styles.cardMeta}>Stock: {p.stock} • Unit: {p.unit || '-'} • ${Number(p.price || 0).toFixed(2)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ─── PRODUCT MODAL ───────────────────────────────────────────────
function ProductModal({ open, onClose, product }) {
  const createProduct = useProductsStore((s) => s.createProduct);
  const updateProduct = useProductsStore((s) => s.updateProduct);
  const isLoading = useProductsStore((s) => s.isLoading);
  const error = useProductsStore((s) => s.error);
  const clearMessages = useProductsStore((s) => s.clearMessages);

  const isEdit = Boolean(product?.id);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');

  useEffect(() => {
    if (!open) return;
    clearMessages();
    if (product) {
      setName(product.name || '');
      setUnit(product.unit || '');
      setPrice(String(product.price ?? ''));
      setStock(String(product.stock ?? 0));
    } else {
      setName(''); setUnit(''); setPrice(''); setStock('0');
    }
  }, [open, product?.id]);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) return false;
    const s = Number(stock);
    if (!Number.isInteger(s) || s < 0) return false;
    return true;
  }, [name, price, stock]);

  async function submit() {
    if (!canSubmit) return;
    clearMessages();
    const payload = { name: name.trim(), unit: unit.trim(), price: Number(price), stock: Number(stock) };
    try {
      if (isEdit) { await updateProduct(product.id, payload); }
      else { await createProduct(payload); }
      onClose();
    } catch {}
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.container}>
          <View style={modal.header}>
            <Text style={modal.title}>{isEdit ? 'Edit product' : 'Add new product'}</Text>
            <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
              <X size={18} color={colors.slate700} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 16 }}>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {[
              { label: 'Name', value: name, set: setName, placeholder: 'e.g. Tomatoes', Icon: Tag },
              { label: 'Unit', value: unit, set: setUnit, placeholder: 'e.g. 250g', Icon: Ruler },
              { label: 'Price', value: price, set: setPrice, placeholder: 'e.g. 1.99', Icon: DollarSign, keyboard: 'decimal-pad' },
              { label: 'Stock', value: stock, set: setStock, placeholder: '0', Icon: Boxes, keyboard: 'numeric' },
            ].map(({ label, value, set, placeholder, Icon, keyboard }) => (
              <View key={label} style={{ marginBottom: 14 }}>
                <Text style={styles.label}>{label}</Text>
                <View style={styles.inputRow}>
                  <Icon size={16} color={colors.slate500} />
                  <TextInput style={styles.input} value={value} onChangeText={set} placeholder={placeholder} placeholderTextColor={colors.slate500} keyboardType={keyboard || 'default'} />
                </View>
              </View>
            ))}
            <View style={modal.actions}>
              <TouchableOpacity style={modal.cancelBtn} onPress={onClose}>
                <Text style={modal.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[modal.confirmBtn, !canSubmit && { opacity: 0.6 }]} onPress={submit} disabled={!canSubmit || isLoading}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <>
                  {isEdit ? <Save size={16} color="#fff" /> : <PlusCircle size={16} color="#fff" />}
                  <Text style={modal.confirmBtnText}>{isEdit ? 'Save changes' : 'Create product'}</Text>
                </>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── RECIPE MODAL ────────────────────────────────────────────────
function RecipeModal({ open, onClose, recipe }) {
  const createRecipe = useRecipesStore((s) => s.createRecipe);
  const updateRecipe = useRecipesStore((s) => s.updateRecipe);
  const fetchRecipeById = useRecipesStore((s) => s.fetchRecipeById);
  const isLoading = useRecipesStore((s) => s.isLoading);
  const error = useRecipesStore((s) => s.error);
  const clearMessages = useRecipesStore((s) => s.clearMessages);

  const products = useProductsStore((s) => s.items);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);

  const isEdit = Boolean(recipe?.id);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [newPid, setNewPid] = useState('');
  const [newQty, setNewQty] = useState('1');

  useEffect(() => {
    if (!open) return;
    clearMessages();
    fetchProducts();

    (async () => {
      if (!recipe?.id) {
        setName(''); setDescription(''); setIngredients([]);
        setNewPid(''); setNewQty('1');
        return;
      }
      const full = await fetchRecipeById(recipe.id);
      setName(full?.name || recipe.name || '');
      setDescription(full?.description || recipe.description || '');
      const ings = Array.isArray(full?.ingredients) ? full.ingredients : [];
      setIngredients(ings.map((x) => ({ product_id: x.product_id, quantity: x.quantity })));
      setNewPid(''); setNewQty('1');
    })();
  }, [open, recipe?.id]);

  const productMap = useMemo(() => {
    const m = new Map();
    (products || []).forEach((p) => m.set(String(p.id), p));
    return m;
  }, [products]);

  const canSubmit = useMemo(() => {
    if (!name.trim() || name.trim().length > 100) return false;
    if (!ingredients.length) return false;
    const ids = ingredients.map((i) => String(i.product_id));
    if (new Set(ids).size !== ids.length) return false;
    for (const it of ingredients) {
      if (!it.product_id) return false;
      const q = Number(it.quantity);
      if (!Number.isInteger(q) || q <= 0) return false;
    }
    return true;
  }, [name, ingredients]);

  function addIngredient() {
    const pid = String(newPid || '').trim();
    const qty = Number(newQty);
    if (!pid || !Number.isInteger(qty) || qty <= 0) return;
    if (ingredients.some((x) => String(x.product_id) === pid)) return;
    setIngredients((prev) => [...prev, { product_id: Number(pid), quantity: qty }]);
    setNewPid(''); setNewQty('1');
  }

  function removeIngredient(pid) {
    setIngredients((prev) => prev.filter((x) => String(x.product_id) !== String(pid)));
  }

  function updateIngredient(pid, patch) {
    setIngredients((prev) => prev.map((x) => String(x.product_id) === String(pid) ? { ...x, ...patch } : x));
  }

  async function submit() {
    if (!canSubmit) return;
    clearMessages();
    const payload = {
      name: name.trim(),
      description: description || null,
      ingredients: ingredients.map((x) => ({ product_id: Number(x.product_id), quantity: Number(x.quantity) })),
    };
    try {
      if (isEdit) await updateRecipe(recipe.id, payload);
      else await createRecipe(payload);
      onClose();
    } catch {}
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.container}>
          <View style={modal.header}>
            <Text style={modal.title}>{isEdit ? 'Edit recipe' : 'Add new recipe'}</Text>
            <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
              <X size={18} color={colors.slate700} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 16 }} nestedScrollEnabled>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={styles.label}>Name</Text>
            <View style={styles.inputRow}>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Pasta Pomodoro" placeholderTextColor={colors.slate500} maxLength={100} />
            </View>

            <Text style={styles.label}>Description (optional)</Text>
            <View style={[styles.inputRow, { alignItems: 'flex-start', paddingTop: 10 }]}>
              <TextInput style={[styles.input, { minHeight: 80 }]} value={description} onChangeText={setDescription} placeholder="Short cooking instructions..." placeholderTextColor={colors.slate500} multiline />
            </View>

            <View style={recipeModalStyles.ingredientsBox}>
              <Text style={recipeModalStyles.ingredientsTitle}>Ingredients</Text>
              <Text style={recipeModalStyles.ingredientsSubtitle}>Add at least 1 ingredient. No duplicates.</Text>

              <View style={recipeModalStyles.addRow}>
                <View style={[styles.inputRow, { flex: 2 }]}>
                  <TextInput style={styles.input} value={newPid} onChangeText={setNewPid} placeholder="Product ID..." placeholderTextColor={colors.slate500} keyboardType="numeric" />
                </View>
                <View style={[styles.inputRow, { flex: 1 }]}>
                  <TextInput style={styles.input} value={newQty} onChangeText={setNewQty} placeholder="Qty" placeholderTextColor={colors.slate500} keyboardType="numeric" />
                </View>
                <TouchableOpacity style={recipeModalStyles.addBtn} onPress={addIngredient} disabled={!newPid}>
                  <Plus size={18} color="#fff" />
                </TouchableOpacity>
              </View>

              <Text style={recipeModalStyles.hintText}>Tap a product below to select it:</Text>

              <ScrollView style={recipeModalStyles.productList} nestedScrollEnabled>
                {(products || []).map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[recipeModalStyles.productItem, newPid === String(p.id) && recipeModalStyles.productItemActive]}
                    onPress={() => setNewPid(String(p.id))}
                  >
                    <Text style={recipeModalStyles.productItemText}>#{p.id} — {p.name} ({p.unit})</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {ingredients.length === 0 ? (
                <Text style={styles.empty}>No ingredients added yet.</Text>
              ) : (
                ingredients.map((it) => {
                  const p = productMap.get(String(it.product_id));
                  return (
                    <View key={it.product_id} style={recipeModalStyles.ingredientRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={recipeModalStyles.ingredientName}>{p?.name || `Product #${it.product_id}`}</Text>
                        <Text style={recipeModalStyles.ingredientUnit}>{p?.unit || '-'}</Text>
                      </View>
                      <TextInput
                        style={recipeModalStyles.qtyInput}
                        value={String(it.quantity)}
                        onChangeText={(v) => updateIngredient(it.product_id, { quantity: v })}
                        keyboardType="numeric"
                      />
                      <TouchableOpacity style={recipeModalStyles.removeBtn} onPress={() => removeIngredient(it.product_id)}>
                        <Trash2 size={14} color={colors.redDark} />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>

            <View style={modal.actions}>
              <TouchableOpacity style={modal.cancelBtn} onPress={onClose}>
                <Text style={modal.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[modal.confirmBtn, !canSubmit && { opacity: 0.6 }]} onPress={submit} disabled={!canSubmit || isLoading}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <>
                  {isEdit ? <Save size={16} color="#fff" /> : <PlusCircle size={16} color="#fff" />}
                  <Text style={modal.confirmBtnText}>{isEdit ? 'Save changes' : 'Create recipe'}</Text>
                </>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── PRODUCTS TAB ───────────────────────────────────────────────
function ProductsTab() {
  const items = useProductsStore((s) => s.items);
  const count = useProductsStore((s) => s.count);
  const isLoading = useProductsStore((s) => s.isLoading);
  const error = useProductsStore((s) => s.error);
  const success = useProductsStore((s) => s.success);
  const sort = useProductsStore((s) => s.sort);
  const dir = useProductsStore((s) => s.dir);
  const setQuery = useProductsStore((s) => s.setQuery);
  const clearMessages = useProductsStore((s) => s.clearMessages);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);
  const deleteProduct = useProductsStore((s) => s.deleteProduct);

  const [localSearch, setLocalSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => { fetchProducts(); }, []);

  async function onDelete(p) {
    const confirmed = window.confirm(`Delete "${p.name}"?`);
    if (!confirmed) return;
    clearMessages();
    try {
      await deleteProduct(p.id);
    } catch (e: any) {
      window.alert(e?.message || `Cannot delete "${p.name}". It may be referenced by existing orders.`);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabHeader}>
        <View>
          <Text style={styles.tabTitle}>Products</Text>
          <Text style={styles.tabSubtitle}>Create, update and delete products. ({count} total)</Text>
        </View>
        <TouchableOpacity style={[styles.smBtn, { backgroundColor: colors.red }]} onPress={() => { clearMessages(); setEditing(null); setModalOpen(true); }}>
          <Plus size={16} color="#fff" />
          <Text style={[styles.smBtnText, { color: '#fff' }]}>Add</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <View style={styles.searchRow}>
        <TextInput style={styles.searchInput} value={localSearch} onChangeText={setLocalSearch} placeholder="Search by name..." placeholderTextColor={colors.slate500} onSubmitEditing={() => { setQuery({ search: localSearch }); fetchProducts({ search: localSearch, sort, dir }); }} returnKeyType="search" />
        <TouchableOpacity style={styles.searchBtn} onPress={() => { setQuery({ search: localSearch }); fetchProducts({ search: localSearch, sort, dir }); }}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 20 }} /> : (
        <FlatList
          data={items}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item: p }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{p.name}</Text>
                <Text style={styles.cardMeta}>Unit: {p.unit || '—'} • Price: {Number(p.price).toFixed(2)} • Stock: {p.stock}</Text>
              </View>
              <View style={styles.cardBtns}>
                <TouchableOpacity style={styles.editBtn} onPress={() => { clearMessages(); setEditing(p); setModalOpen(true); }}>
                  <Pencil size={14} color={colors.slate700} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(p)}>
                  <Trash2 size={14} color={colors.redDark} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No products found.</Text>}
        />
      )}

      <ProductModal open={modalOpen} onClose={() => { setModalOpen(false); fetchProducts(); }} product={editing} />
    </View>
  );
}

// ─── RECIPES TAB ─────────────────────────────────────────────────
function RecipesTab() {
  const items = useRecipesStore((s) => s.items);
  const count = useRecipesStore((s) => s.count);
  const isLoading = useRecipesStore((s) => s.isLoading);
  const error = useRecipesStore((s) => s.error);
  const success = useRecipesStore((s) => s.success);
  const search = useRecipesStore((s) => s.search);
  const setQuery = useRecipesStore((s) => s.setQuery);
  const fetchRecipes = useRecipesStore((s) => s.fetchRecipes);
  const deleteRecipe = useRecipesStore((s) => s.deleteRecipe);
  const clearMessages = useRecipesStore((s) => s.clearMessages);

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchRecipes(); }, []);

  async function onDelete(r) {
    const confirmed = window.confirm(`Delete "${r.name}"?`);
    if (!confirmed) return;
    clearMessages();
    try {
      await deleteRecipe(r.id);
    } catch (e: any) {
      window.alert(e?.message || `Cannot delete "${r.name}". It may be referenced by existing orders.`);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabHeader}>
        <View>
          <Text style={styles.tabTitle}>Recipes</Text>
          <Text style={styles.tabSubtitle}>Manage recipes. ({count} total)</Text>
        </View>
        <TouchableOpacity style={[styles.smBtn, { backgroundColor: colors.green }]} onPress={() => { clearMessages(); setSelected(null); setModalOpen(true); }}>
          <Plus size={16} color="#fff" />
          <Text style={[styles.smBtnText, { color: '#fff' }]}>Add</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <View style={styles.searchRow}>
        <TextInput style={styles.searchInput} value={search} onChangeText={(v) => setQuery({ search: v })} placeholder="Search recipes..." placeholderTextColor={colors.slate500} onSubmitEditing={() => fetchRecipes({ search })} returnKeyType="search" />
        <TouchableOpacity style={styles.searchBtn} onPress={() => fetchRecipes({ search })}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 20 }} /> : (
        <FlatList
          data={items}
          keyExtractor={(r) => String(r.id)}
          renderItem={({ item: r }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{r.name}</Text>
                <Text style={styles.cardMeta} numberOfLines={2}>{r.description || '—'}</Text>
              </View>
              <View style={styles.cardBtns}>
                <TouchableOpacity style={styles.editBtn} onPress={() => { clearMessages(); setSelected(r); setModalOpen(true); }}>
                  <Pencil size={14} color={colors.slate700} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(r)}>
                  <Trash2 size={14} color={colors.redDark} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No recipes found.</Text>}
        />
      )}

      <RecipeModal open={modalOpen} onClose={() => { setModalOpen(false); fetchRecipes(); }} recipe={selected} />
    </View>
  );
}

// ─── ORDERS TAB ──────────────────────────────────────────────────
function OrdersTab() {
  const items = useOrdersStore((s) => s.items);
  const count = useOrdersStore((s) => s.count);
  const isLoading = useOrdersStore((s) => s.isLoading);
  const error = useOrdersStore((s) => s.error);
  const success = useOrdersStore((s) => s.success);
  const status = useOrdersStore((s) => s.status);
  const setQuery = useOrdersStore((s) => s.setQuery);
  const clearMessages = useOrdersStore((s) => s.clearMessages);
  const fetchOrders = useOrdersStore((s) => s.fetchOrders);
  const adminUpdateStatus = useOrdersStore((s) => s.adminUpdateStatus);

  const [userIdDraft, setUserIdDraft] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  async function changeStatus(orderId, nextStatus) {
    if (!nextStatus) return;
    clearMessages();
    setBusyId(orderId);
    try { await adminUpdateStatus(orderId, nextStatus); }
    catch {} finally { setBusyId(null); }
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabHeader}>
        <View>
          <Text style={styles.tabTitle}>Orders</Text>
          <Text style={styles.tabSubtitle}>View all orders and update status. ({count} total)</Text>
        </View>
        <TouchableOpacity style={styles.smBtn} onPress={() => { clearMessages(); fetchOrders(); }} disabled={isLoading}>
          <RefreshCw size={16} color={colors.slate700} />
          <Text style={styles.smBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <View style={styles.filterBox}>
        <View style={styles.searchRow}>
          <TextInput style={styles.searchInput} value={userIdDraft} onChangeText={setUserIdDraft} placeholder="Filter by User ID..." placeholderTextColor={colors.slate500} keyboardType="numeric" />
          <TouchableOpacity style={styles.searchBtn} onPress={() => { clearMessages(); setQuery({ userId: userIdDraft }); fetchOrders({ userId: userIdDraft }); }}>
            <Text style={styles.searchBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {['', ...STATUS_OPTIONS].map((s) => (
            <TouchableOpacity
              key={s || 'all'}
              style={[styles.statusChip, status === s && styles.statusChipActive]}
              onPress={() => { clearMessages(); setQuery({ status: s }); fetchOrders({ status: s }); }}
            >
              <Text style={[styles.statusChipText, status === s && styles.statusChipTextActive]}>{s || 'All'}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={[styles.smBtn, { marginTop: 8, alignSelf: 'flex-end' }]} onPress={() => { clearMessages(); setUserIdDraft(''); setQuery({ status: '', userId: '' }); fetchOrders({ status: '', userId: '' }); }}>
          <Text style={styles.smBtnText}>Reset filters</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? <ActivityIndicator size="large" color={colors.red} style={{ marginTop: 20 }} /> : (
        <FlatList
          data={items}
          keyExtractor={(o) => String(o.id)}
          renderItem={({ item: o }) => {
            const statusUp = String(o.status || '').toUpperCase();
            const badge = getBadgeStyle(statusUp);
            const isBusy = busyId === o.id || isLoading;
            return (
              <View style={styles.orderCard}>
                <View style={styles.orderCardTop}>
                  <Text style={styles.cardName}>Order #{o.id}</Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.text }]}>{statusUp}</Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>User #{o.user_id} • {Number(o.total_price).toFixed(2)} • {o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</Text>

                <View style={styles.orderActions}>
                  <TouchableOpacity style={styles.smBtn} onPress={() => router.push(`/orders/${o.id}`)}>
                    <ExternalLink size={14} color={colors.slate700} />
                    <Text style={styles.smBtnText}>View</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {STATUS_OPTIONS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.statusChip, statusUp === s && styles.statusChipActive, { marginRight: 6 }]}
                      onPress={() => changeStatus(o.id, s)}
                      disabled={isBusy || statusUp === s}
                    >
                      <Text style={[styles.statusChipText, statusUp === s && styles.statusChipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>No orders found.</Text>}
        />
      )}
    </View>
  );
}

// ─── MAIN ADMIN PAGE ─────────────────────────────────────────────
const TABS = [
  { key: 'overview', label: 'Overview', Icon: BarChart2 },
  { key: 'products', label: 'Products', Icon: Package },
  { key: 'recipes', label: 'Recipes', Icon: CookingPot },
  { key: 'orders', label: 'Orders', Icon: ShoppingBag },
];

export default function Admin() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    if (!user || (user.role || '').toLowerCase() !== 'admin') {
      router.replace('/');
    }
  }, [user]);

  if (!user || (user.role || '').toLowerCase() !== 'admin') return null;

  return (
    <View style={styles.container}>
      <View style={styles.adminHeader}>
        <Text style={styles.adminTitle}>Admin Dashboard</Text>
        <Text style={styles.adminSubtitle}>Overview, products, recipes and orders.</Text>
      </View>

      <View style={styles.tabBar}>
        {TABS.map(({ key, label, Icon }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tabBtn, tab === key && styles.tabBtnActive]}
            onPress={() => setTab(key)}
          >
            <Icon size={12} color={tab === key ? colors.red : colors.slate600} />
            <Text style={[styles.tabBtnText, tab === key && styles.tabBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tabContent}>
        {tab === 'overview' && <OverviewTab />}
        {tab === 'products' && <ProductsTab />}
        {tab === 'recipes' && <RecipesTab />}
        {tab === 'orders' && <OrdersTab />}
      </View>
    </View>
  );
}

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  container: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.slate200 },
  title: { fontSize: 16, fontWeight: '800', color: colors.slate900 },
  closeBtn: { width: 36, height: 36, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 24 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.sm, padding: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: colors.slate700 },
  confirmBtn: { flex: 1, backgroundColor: colors.green, borderRadius: radius.sm, padding: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  confirmBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});

const recipeModalStyles = StyleSheet.create({
  ingredientsBox: { borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.md, padding: 12, marginTop: 12 },
  ingredientsTitle: { fontSize: 14, fontWeight: '800', color: colors.slate900 },
  ingredientsSubtitle: { fontSize: 12, color: colors.slate500, marginTop: 2, marginBottom: 10 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6 },
  addBtn: { backgroundColor: colors.green, padding: 10, borderRadius: radius.sm },
  hintText: { fontSize: 11, color: colors.slate500, marginBottom: 6 },
  productList: { maxHeight: 120, borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.sm, marginBottom: 10 },
  productItem: { padding: 8, borderBottomWidth: 1, borderBottomColor: colors.slate200 },
  productItemActive: { backgroundColor: '#dcfce7' },
  productItemText: { fontSize: 13, color: colors.slate700 },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.sm, padding: 10, marginBottom: 6, gap: 8 },
  ingredientName: { fontSize: 13, fontWeight: '700', color: colors.slate900 },
  ingredientUnit: { fontSize: 12, color: colors.slate500 },
  qtyInput: { width: 50, borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.sm, padding: 6, textAlign: 'center', fontSize: 13 },
  removeBtn: { padding: 6, borderRadius: radius.sm, backgroundColor: colors.redLight },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  adminHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.slate200 },
  adminTitle: { fontSize: 22, fontWeight: '800', color: colors.slate900 },
  adminSubtitle: { fontSize: 13, color: colors.slate600, marginTop: 2 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.slate200, paddingHorizontal: 8, paddingVertical: 6, gap: 6 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.white, flex: 1 },
  tabBtnActive: { borderColor: colors.red, backgroundColor: '#fef2f2' },
  tabBtnText: { fontSize: 10, fontWeight: '600', color: colors.slate600 },
  tabBtnTextActive: { color: colors.red },
  tabContent: { flex: 1, padding: 16 },
  tabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  tabTitle: { fontSize: 18, fontWeight: '800', color: colors.slate900 },
  tabSubtitle: { fontSize: 13, color: colors.slate600, marginTop: 2 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  kpiCard: { width: '47%', borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.md, padding: 14, backgroundColor: colors.white },
  kpiTitle: { fontSize: 11, fontWeight: '700', color: colors.slate500, textTransform: 'uppercase' },
  kpiValue: { fontSize: 22, fontWeight: '800', color: colors.slate900, marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.slate900, marginBottom: 10 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: colors.slate50, color: colors.slate900 },
  searchBtn: { backgroundColor: colors.red, paddingHorizontal: 14, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  filterBox: { borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.md, padding: 12, marginBottom: 12 },
  smBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm },
  smBtnText: { fontSize: 13, fontWeight: '600', color: colors.slate700 },
  card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.lg, padding: 14, marginBottom: 10, backgroundColor: colors.white },
  orderCard: { borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.lg, padding: 14, marginBottom: 10, backgroundColor: colors.white },
  orderCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  orderActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  cardName: { fontSize: 15, fontWeight: '800', color: colors.slate900 },
  cardMeta: { fontSize: 12, color: colors.slate600, marginTop: 4 },
  cardBtns: { flexDirection: 'row', gap: 8 },
  editBtn: { borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.sm, padding: 8, backgroundColor: colors.white },
  deleteBtn: { borderWidth: 1, borderColor: '#fecaca', borderRadius: radius.sm, padding: 8, backgroundColor: colors.redLight },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  statusChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.white, marginRight: 6 },
  statusChipActive: { backgroundColor: colors.slate900, borderColor: colors.slate900 },
  statusChipText: { fontSize: 12, fontWeight: '600', color: colors.slate700 },
  statusChipTextActive: { color: colors.white },
  label: { fontSize: 13, fontWeight: '700', color: colors.slate700, marginBottom: 6, marginTop: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate200, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 10 },
  input: { flex: 1, fontSize: 14, color: colors.slate900 },
  error: { backgroundColor: colors.redLight, borderWidth: 1, borderColor: '#fecaca', borderRadius: radius.sm, padding: 10, color: colors.redDark, fontSize: 13, marginBottom: 12 },
  success: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: radius.sm, padding: 10, color: colors.greenDark, fontSize: 13, marginBottom: 12 },
  empty: { textAlign: 'center', color: colors.slate500, marginTop: 20, fontSize: 14 },
});