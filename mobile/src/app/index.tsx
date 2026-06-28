import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { colors, radius } from '../constants/theme';
import { useAuthStore } from '../../stores/authStore';

export default function Home() {
  const debugUser = useAuthStore((s) => s.user);
  console.log('DEBUG USER:', debugUser);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>
          Find a recipe, build a cart, order ingredients.
        </Text>
        <Text style={styles.heroSubtitle}>
          Search recipes by ingredients and automatically generate a suggested cart you can edit before checkout.
        </Text>

        <View style={styles.heroButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/recipes')}>
            <Text style={styles.primaryButtonText}>Browse recipes</Text>
            <ArrowRight size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/products')}>
            <Text style={styles.secondaryButtonText}>View products</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cards}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recipe search</Text>
          <Text style={styles.cardText}>Find recipes by name, description, or ingredients.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Suggested cart</Text>
          <Text style={styles.cardText}>Generate a cart from a recipe and adjust quantities before ordering.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Orders</Text>
          <Text style={styles.cardText}>Track your orders and view order details anytime.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scrollContent: { padding: 16, paddingBottom: 40 },
  hero: {
    backgroundColor: colors.slate50,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.slate200,
    padding: 20,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: colors.slate900, lineHeight: 28 },
  heroSubtitle: { fontSize: 14, color: colors.slate600, marginTop: 10, lineHeight: 20 },
  heroButtons: { marginTop: 18, gap: 10 },
  primaryButton: {
    flexDirection: 'row', backgroundColor: colors.red, paddingVertical: 12,
    borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  primaryButtonText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  secondaryButton: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate200,
    paddingVertical: 12, borderRadius: radius.sm, alignItems: 'center',
  },
  secondaryButtonText: { color: colors.slate700, fontWeight: '700', fontSize: 14 },
  cards: { marginTop: 16, gap: 12 },
  card: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate200,
    borderRadius: radius.lg, padding: 16,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  cardText: { fontSize: 13, color: colors.slate600, marginTop: 6, lineHeight: 18 },
});