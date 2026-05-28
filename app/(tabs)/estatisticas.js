import { StyleSheet, Text, View } from 'react-native';

export default function Estatisticas() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Estatisticas</Text>
      <View style={styles.box}>
        <Text style={styles.luz}>Locais com problema de luz : </Text>
        <Text style={styles.ocorrencias}>Número de ocorrências: </Text>
        <Text style={styles.buracos}>Locais com buracos: </Text>
      </View>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    alignItems:"center",
  },

  titulo: {
    color: '#fff',
    fontSize:36,
    padding:15,
  },
  box:{
    backgroundColor:"white",
    width:"80%",
    borderRadius:15,
    height:'45%',
    padding:10,
  },
  luz:{
    padding:15,
  },
  ocorrencias:{
    padding:15,
  },
  buracos:{
    padding:15,
  }
});
