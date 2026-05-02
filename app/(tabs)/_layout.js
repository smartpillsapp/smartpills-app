import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const C = {
  teal600: "#1a7a69",
  muted2:  "#96a89f",
  border:  "rgba(28,43,38,0.09)",
  white:   "#ffffff",
};

function TabIcon({ name, focused, color }) {
  return <Ionicons name={focused ? name : `${name}-outline`} size={22} color={color}/>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   C.teal600,
        tabBarInactiveTintColor: C.muted2,
        tabBarStyle: {
          backgroundColor: C.white,
          borderTopColor:  C.border,
          borderTopWidth:  1,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "500" },
      }}>
      <Tabs.Screen name="index"   options={{ title:"Pills",    tabBarIcon: (p)=><TabIcon name="medical"    {...p}/> }}/>
      <Tabs.Screen name="news"    options={{ title:"Noticias", tabBarIcon: (p)=><TabIcon name="newspaper"  {...p}/> }}/>
      <Tabs.Screen name="guides"  options={{ title:"Guías",    tabBarIcon: (p)=><TabIcon name="book"       {...p}/> }}/>
      <Tabs.Screen name="quiz"    options={{ title:"Test",     tabBarIcon: (p)=><TabIcon name="school"     {...p}/> }}/>
      <Tabs.Screen name="ranking" options={{ title:"Ranking",  tabBarIcon: (p)=><TabIcon name="trophy"     {...p}/> }}/>
      <Tabs.Screen name="profile" options={{ title:"Perfil",   tabBarIcon: (p)=><TabIcon name="person"     {...p}/> }}/>
      {/* Pantalla oculta: dentro del grupo (mantiene la barra), pero no aparece como pestaña */}
      <Tabs.Screen name="saved"   options={{ href: null }}/>
    </Tabs>
  );
}
