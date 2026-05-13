import { Tabs } from "expo-router";
import { Image } from "react-native";

const C = {
  teal600: "#1a7a69",
  muted2:  "#96a89f",
  border:  "rgba(28,43,38,0.09)",
  white:   "#ffffff",
};

function PillIcon({ focused }) {
  return (
    <Image
      source={require("../../assets/pildo-base.png")}
      style={{ width: 36, height: 36, opacity: focused ? 1 : 0.55 }}
      resizeMode="contain"
    />
  );
}

function ImageTabIcon({ source, focused }) {
  return (
    <Image
      source={source}
      style={{ width: 36, height: 36, opacity: focused ? 1 : 0.55 }}
      resizeMode="contain"
    />
  );
}

const ICON_GUIDES  = require("../../assets/icono-guias.png");
const ICON_TEST    = require("../../assets/icono-test.png");
const ICON_GAMES   = require("../../assets/icono-juegos.png");
const ICON_RANKING = require("../../assets/icono-ranking.png");
const ICON_PROFILE = require("../../assets/icono-perfil.png");

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
          height: 74,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "500", marginTop: 4 },
      }}>
      <Tabs.Screen name="index"   options={{ title:"Pills",    tabBarIcon: (p)=><PillIcon {...p}/> }}/>
      <Tabs.Screen name="guides"  options={{ title:"Guías",    tabBarIcon: (p)=><ImageTabIcon source={ICON_GUIDES}  {...p}/> }}/>
      <Tabs.Screen name="quiz"    options={{ title:"Test",     tabBarIcon: (p)=><ImageTabIcon source={ICON_TEST}    {...p}/> }}/>
      <Tabs.Screen name="games"   options={{ title:"Juegos",   tabBarIcon: (p)=><ImageTabIcon source={ICON_GAMES}   {...p}/> }}/>
      <Tabs.Screen name="ranking" options={{ title:"Ranking",  tabBarIcon: (p)=><ImageTabIcon source={ICON_RANKING} {...p}/> }}/>
      <Tabs.Screen name="profile" options={{ title:"Perfil",   tabBarIcon: (p)=><ImageTabIcon source={ICON_PROFILE} {...p}/> }}/>
      {/* Pantalla oculta: dentro del grupo (mantiene la barra), pero no aparece como pestaña */}
      <Tabs.Screen name="saved"   options={{ href: null }}/>
    </Tabs>
  );
}
