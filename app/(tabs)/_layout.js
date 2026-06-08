import { Tabs } from 'expo-router';
import { Image, StyleSheet } from 'react-native';

const tabIcons = {
  home: require('../../assets/icons/home.png'),
  mainmap: require('../../assets/icons/map.png'),
  estatisticas: require('../../assets/icons/chart.png'),
};

function TabIcon({ source, color, size }) {
  return (
    <Image
      source={source}
      style={{
        width: size,
        height: size,
        resizeMode: 'contain',
        tintColor: color,
      }}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#007aff',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabIcon source={tabIcons.home} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="mainmap"
        options={{
          title: 'Mapa',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabIcon source={tabIcons.mainmap} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="estatisticas"
        options={{
          title: 'Estatisticas',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabIcon source={tabIcons.estatisticas} color={color} size={size} />
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
