import { Tabs } from 'expo-router';
import { Image, StyleSheet } from 'react-native';

function TabIcon({ source }) {
  return (
    <Image
      source={source}
      style={{ width: 28, height: 28, resizeMode: 'contain' }}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#aaa',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: () => (
            <TabIcon source={require('../../assets/home-icon.png')} />
          ),
        }}
      />
      <Tabs.Screen
        name="mainmap"
        options={{
          title: 'Mapa',
          headerShown: false,
          tabBarIcon: () => (
            <TabIcon source={require('../../assets/icon.png')} />
          ),
        }}
      />
      <Tabs.Screen
        name="estatisticas"
        options={{
          title: 'Estatisticas',
          headerShown: false,
          tabBarIcon: () => (
            <TabIcon source={require('../../assets/brasao-ufsc-logo.png')} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#111',
    borderTopColor: '#222',
  },
});
