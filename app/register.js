import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function Register() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar conta</Text>

      <Pressable style={styles.primaryButton} onPress={() => router.replace('/home')}>
        <Text style={styles.primaryButtonText}>Cadastrar</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonText}>Voltar para login</Text>
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

  primaryButton: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
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
