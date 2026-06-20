import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ShopTheStep</Text>
      <Text style={styles.subtitle}>Recipes • Cart • Orders</Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/products')}>
        <Text style={styles.buttonText}>Proizvodi</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.buttonGreen]} onPress={() => router.push('/login')}>
        <Text style={styles.buttonText}>Prijava</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 40,
    marginTop: 8,
  },
  button: {
    backgroundColor: '#dc2626',
    width: '100%',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonGreen: {
    backgroundColor: '#16a34a',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});