import { StyleSheet, Text, View } from 'react-native';

export default function Estatisticas() {
  return (
    <View style={styles.container}>
      <Text style={styles.texto}>Estatisticas</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  texto: {
    color: '#fff',
  },
});
