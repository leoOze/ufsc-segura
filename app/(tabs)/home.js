import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>UFSC Segura</Text>

      <Pressable style={styles.button} onPress={() => router.push('/mainmap')}>
        <Text style={styles.buttonText}>Abrir mapa</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => router.push('/estatisticas')}>
        <Text style={styles.buttonText}>Ver estatisticas</Text>
      </Pressable>

      <StatusBar style="auto" />
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

  button: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: '#000',
    fontWeight: '700',
  },
});
