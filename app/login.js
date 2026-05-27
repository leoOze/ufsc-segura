import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { login } from '../services/api';
import { saveToken } from '../services/authStorage';

export default function Login() {
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    setErrorMessage('');
    setIsLoading(true);

    try {
      const data = await login(loginValue, password);
      await saveToken(data.token);
      router.replace('/home');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Entrar</Text>

      <TextInput
        style={styles.input}
        autoCapitalize="none"
        placeholder="Login"
        placeholderTextColor="#777"
        value={loginValue}
        onChangeText={setLoginValue}
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#777"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Pressable
        style={[styles.primaryButton, isLoading && styles.disabledButton]}
        disabled={isLoading}
        onPress={handleLogin}
      >
        <Text style={styles.primaryButtonText}>
          {isLoading ? 'Entrando...' : 'Entrar no app'}
        </Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.push('/register')}>
        <Text style={styles.secondaryButtonText}>Criar conta</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },

  input: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: '#111',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 8,
    color: '#fff',
    padding: 14,
    marginBottom: 12,
  },

  errorText: {
    width: '100%',
    maxWidth: 280,
    color: '#ff6b6b',
    marginBottom: 12,
  },

  primaryButton: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.6,
  },

  primaryButtonText: {
    color: '#000',
    fontWeight: '700',
  },

  secondaryButton: {
    width: '100%',
    maxWidth: 280,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },

  secondaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
