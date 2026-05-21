import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="home" options={{ title: 'Home' ,headerShown : false }} />
      <Tabs.Screen name="mainmap" options={{ title: 'Mapa' ,headerShown : false }} />
      <Tabs.Screen name="estatisticas" options={{ title: 'Estatisticas' ,headerShown : false }} />
    </Tabs>
  );
}
