import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { LEAGUES, getLeagueImage } from "../lib/leagues";

const C = {
  teal800:"#0f3d35", teal600:"#1a7a69", teal300:"#6dcfc0",
  cream:"#f7f5f0",
  white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)",
};

export default function LeaguesInfo() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.teal800 }} edges={["top"]}>
      <StatusBar style="light"/>

      {/* Cabecera verde */}
      <View style={{ backgroundColor:C.teal800, paddingHorizontal:16, paddingTop:16, paddingBottom:22 }}>
        <Pressable onPress={() => router.back()}
          style={{ alignSelf:"flex-start", backgroundColor:"rgba(255,255,255,0.12)", borderWidth:1, borderColor:"rgba(255,255,255,0.2)", borderRadius:8, paddingHorizontal:10, paddingVertical:4, marginBottom:12 }}>
          <Text style={{ fontSize:12, color:"white" }}>← Volver</Text>
        </Pressable>
        <Text style={{ fontSize:10, fontWeight:"500", letterSpacing:1.4, textTransform:"uppercase", color:C.teal300, marginBottom:4 }}>
          Las 10 ligas de SmartPills
        </Text>
        <Text style={{ fontFamily:"Georgia", fontSize:22, color:"white" }}>
          Sistema de ligas
        </Text>
      </View>

      {/* Listado de ligas */}
      <ScrollView style={{ flex:1, backgroundColor:C.cream }} contentContainerStyle={{ padding:16 }}>
        {LEAGUES.map((league, idx) => (
          <View key={league}
            style={{ flexDirection:"row", alignItems:"center", gap:12,
                     backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:12,
                     padding:12, marginBottom:10 }}>
            <Text style={{ fontFamily:"Georgia", fontSize:22, color:C.teal600, minWidth:34, textAlign:"center" }}>
              {idx + 1}
            </Text>
            <View style={{ flex:1, minWidth:0 }}>
              <Text style={{ fontFamily:"Georgia", fontSize:16, color:C.ink }}>
                Liga {league}
              </Text>
            </View>
            <Image source={getLeagueImage(league)} style={{ width:56, height:56 }} resizeMode="contain"/>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
