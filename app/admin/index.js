import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal300:"#6dcfc0", teal50:"#edf8f6", teal100:"#d4f0eb",
  coral500:"#d4522a", coral100:"#fae8e2",
  amber500:"#d97706", amber100:"#fef3c7", amber50:"#fffbeb",
  cream:"#f7f5f0",
  white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)",
};

const SECTIONS = [
  {
    key:"guides",
    route:"/admin/guides",
    title:"Guías clínicas",
    icon:"📖",
    desc:"Enlaces a guías oficiales de sociedades científicas",
    accent:C.teal600, accentLight:C.teal50, accentBorder:C.teal100,
  },
  {
    key:"pills",
    route:"/admin/pills",
    title:"Pills",
    icon:"💊",
    desc:"Artículos y noticias del feed principal",
    accent:C.coral500, accentLight:"#fdf4f1", accentBorder:C.coral100,
  },
  {
    key:"infographics",
    route:"/admin/infographics",
    title:"Resúmenes e infografías",
    icon:"🎨",
    desc:"Resúmenes visuales en PDF",
    accent:C.amber500, accentLight:C.amber50, accentBorder:C.amber100,
  },
];

export default function AdminHub() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.teal800 }} edges={["top"]}>
      <StatusBar style="light"/>

      <View style={{ backgroundColor:C.teal800, paddingHorizontal:16, paddingVertical:14 }}>
        <Pressable onPress={() => router.back()}
          style={{ alignSelf:"flex-start", backgroundColor:"rgba(255,255,255,0.12)", borderWidth:1, borderColor:"rgba(255,255,255,0.2)", borderRadius:8, paddingHorizontal:10, paddingVertical:4, marginBottom:10 }}>
          <Text style={{ fontSize:12, color:"white" }}>← Volver</Text>
        </Pressable>
        <Text style={{ fontSize:10, fontWeight:"500", letterSpacing:1.4, textTransform:"uppercase", color:C.teal300, marginBottom:4 }}>
          Panel admin
        </Text>
        <Text style={{ fontFamily:"Georgia", fontSize:22, color:"white", marginBottom:4 }}>
          ¿Qué quieres gestionar?
        </Text>
        <Text style={{ fontSize:12, color:"rgba(255,255,255,0.55)" }}>Elige una sección</Text>
      </View>

      <View style={{ flex:1, backgroundColor:C.cream, padding:16, gap:12 }}>
        {SECTIONS.map(sec => (
          <Pressable key={sec.key} onPress={() => router.push(sec.route)}
            style={({pressed}) => ({
              backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:14,
              padding:16, flexDirection:"row", alignItems:"center", gap:14,
              opacity: pressed ? 0.9 : 1, transform:[{ translateY: pressed ? -1 : 0 }],
            })}>
            <View style={{
              width:54, height:54, borderRadius:12,
              backgroundColor:sec.accentLight, borderWidth:1, borderColor:sec.accentBorder,
              alignItems:"center", justifyContent:"center",
            }}>
              <Text style={{ fontSize:28 }}>{sec.icon}</Text>
            </View>
            <View style={{ flex:1, minWidth:0 }}>
              <Text style={{ fontFamily:"Georgia", fontSize:17, color:C.ink, marginBottom:3 }}>{sec.title}</Text>
              <Text style={{ fontSize:12, color:C.muted, lineHeight:17 }}>{sec.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.muted2}/>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
