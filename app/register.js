import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { register } from '../services/api';
import { getDeviceHwid } from '../services/deviceIdentity';

const LOGIN_MIN_LENGTH = 3;
const PASSWORD_MIN_LENGTH = 8;

function normalizeLoginInput(value) {
  return value.replace(/\s/g, '');
}

function normalizePasswordInput(value) {
  return value.replace(/\s/g, '');
}

export default function Register() {
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const loginIsValid = loginValue.length >= LOGIN_MIN_LENGTH;
  const passwordsMatch = password.length > 0 && password === passwordConfirmation;
  const passwordRules = [
    {
      id: 'length',
      label: `Mínimo de ${PASSWORD_MIN_LENGTH} caracteres`,
      valid: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      id: 'uppercase',
      label: 'Pelo menos uma letra maiúscula',
      valid: /[A-Z]/.test(password),
    },
    {
      id: 'special',
      label: 'Pelo menos um caractere especial',
      valid: /[^A-Za-z0-9]/.test(password),
    },
    {
      id: 'spaces',
      label: 'Sem espaços',
      valid: password.length > 0 && !/\s/.test(password),
    },
  ];
  const passwordIsValid = passwordRules.every((rule) => rule.valid);
  const canSubmit = loginIsValid && passwordIsValid && passwordsMatch && !isLoading;

  async function handleRegister() {
    setErrorMessage('');

    if (!canSubmit) {
      setErrorMessage('Preencha usuário e senha seguindo as regras.');
      return;
    }

    setIsLoading(true);

    try {
      const hwid = await getDeviceHwid();
      await register(loginValue, password, hwid);
      router.replace('/login');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Criar conta</Text>

      <TextInput
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Login"
        placeholderTextColor="#777"
        value={loginValue}
        onChangeText={(value) => {
          setLoginValue(normalizeLoginInput(value));
        }}
      />

      <View style={styles.rulesBox}>
        <RuleLine
          label={`Usuário com mínimo de ${LOGIN_MIN_LENGTH} caracteres e sem espaços`}
          valid={loginIsValid}
        />
      </View>

      <TextInput
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Senha"
        placeholderTextColor="#777"
        secureTextEntry
        value={password}
        onChangeText={(value) => {
          setPassword(normalizePasswordInput(value));
        }}
      />

      <View style={styles.rulesBox}>
        {passwordRules.map((rule) => (
          <RuleLine key={rule.id} label={rule.label} valid={rule.valid} />
        ))}
      </View>

      <TextInput
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Confirmar senha"
        placeholderTextColor="#777"
        secureTextEntry
        value={passwordConfirmation}
        onChangeText={(value) => {
          setPasswordConfirmation(normalizePasswordInput(value));
        }}
      />

      <View style={styles.rulesBox}>
        <RuleLine label="As senhas precisam ser iguais" valid={passwordsMatch} />
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Pressable
        style={[styles.primaryButton, !canSubmit && styles.disabledButton]}
        disabled={!canSubmit}
        onPress={handleRegister}
      >
        <Text style={styles.primaryButtonText}>
          {isLoading ? 'Cadastrando...' : 'Cadastrar'}
        </Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonText}>Voltar para login</Text>
      </Pressable>
    </ScrollView>
  );
}

function RuleLine({ label, valid }) {
  return (
    <View style={styles.ruleLine}>
      <Text style={[styles.ruleIcon, valid ? styles.ruleValid : styles.ruleInvalid]}>
        {valid ? '✓' : '×'}
      </Text>
      <Text style={[styles.ruleText, valid ? styles.ruleValid : styles.ruleInvalid]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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

  rulesBox: {
    width: '100%',
    maxWidth: 280,
    marginBottom: 12,
  },

  ruleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  ruleIcon: {
    width: 20,
    fontSize: 16,
    fontWeight: '700',
  },

  ruleText: {
    flex: 1,
    fontSize: 13,
  },

  ruleValid: {
    color: '#22c55e',
  },

  ruleInvalid: {
    color: '#ff6b6b',
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
    backgroundColor: '#f6f6f6',
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
