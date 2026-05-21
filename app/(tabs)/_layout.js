import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="mainmap" options={{ title: 'Mapa' }} />
      <Tabs.Screen name="estatisticas" options={{ title: 'Estatisticas' }} />
    </Tabs>
  );
}
