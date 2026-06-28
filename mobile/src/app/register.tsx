import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Mail, Lock, User as UserIcon, UserPlus } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { colors, radius } from '../constants/theme';

export default function Register() {
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearMessages = useAuthStore((s) => s.clearMessages);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function onSubmit() {
    clearMessages();
    try {
      await register({ name, email, password, role: 'user' });
      router.replace('/');
    } catch {}
  }

  return (
    <KeyboardAvoidingView
      style={styles.outer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>
          Sign up to manage your cart and place orders.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <View style={styles.inputRow}>
            <UserIcon size={18} color={colors.slate500} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor={colors.slate500}
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputRow}>
            <Mail size={18} color={colors.slate500} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. user@test.com"
              placeholderTextColor={colors.slate500}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <Lock size={18} color={colors.slate500} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.slate500}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && { opacity: 0.6 }]}
          onPress={onSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <UserPlus size={18} color="#fff" />
              <Text style={styles.buttonText}>Create account</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: radius.lg,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.slate900,
  },
  subtitle: {
    fontSize: 13,
    color: colors.slate600,
    marginTop: 4,
  },
  error: {
    marginTop: 16,
    backgroundColor: colors.redLight,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: radius.sm,
    padding: 12,
    color: colors.redDark,
    fontSize: 13,
  },
  field: {
    marginTop: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate700,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.slate900,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: colors.green,
    paddingVertical: 12,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  footerText: {
    fontSize: 13,
    color: colors.slate600,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.red,
  },
});