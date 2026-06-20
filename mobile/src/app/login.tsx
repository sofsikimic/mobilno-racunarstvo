import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearMessages = useAuthStore((s) => s.clearMessages);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function onSubmit() {
    clearMessages();
    try {
      await login({ email, password });
      router.replace('/');
    } catch {}
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prijava</Text>
      <Text style={styles.subtitle}>Prijavite se da upravljate korpom i porudžbinama.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Lozinka"
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={isLoading}
      >
        {isLoading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Prijavi se</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.link}>Nemate nalog? Registrujte se</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  error: {
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    backgroundColor: '#f8fafc',
  },
  button: {
    backgroundColor: '#dc2626',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    color: '#dc2626',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});