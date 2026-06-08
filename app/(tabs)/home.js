import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { deleteToken } from '../../services/authStorage';

export default function Home() {
  async function handleLogout() {
    await deleteToken();
    router.replace('/login');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>UFSC Segura</Text>
      <Image
        source={require('../../assets/brasao-ufsc-logo.png')}
        style={styles.brasao}
      />

      <Pressable style={styles.button} onPress={() => router.push('/mainmap')}>
        <Text style={styles.buttonText}>Abrir mapa</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => router.push('/estatisticas')}>
        <Text style={styles.buttonText}>Ver estatisticas</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={handleLogout}>
        <Text style={styles.secondaryButtonText}>Sair</Text>
      </Pressable>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 5,
  },

  brasao: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },

  button: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: '#f6f6f6',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: '#000',
    fontWeight: '700',
  },

  secondaryButton: {
    padding: 14,
    marginTop: 12,
  },

  secondaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
