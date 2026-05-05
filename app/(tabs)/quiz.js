import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import StreakCalendar from "../../components/StreakCalendar";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal300:"#6dcfc0", teal100:"#d4f0eb", teal50:"#edf8f6",
  coral500:"#d4522a", coral300:"#e8967e",
  amber500:"#d97706",
  cream:"#f7f5f0",
  white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)",
};

function capitalize(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : ""; }

export default function Quiz() {
  const router = useRouter();
  const [userProfession, setUserProfession] = useState(null);
  const [streak, setStreak] = useState(0);
  const [completedDates, setCompletedDates] = useState([]);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const { data:{ user } } = await supabase.auth.getUser();
    if(!user) return;
    const { data:profile } = await supabase
      .from("profiles")
      .select("profession, racha_dias, ultima_vez_test")
      .eq("auth_user_id", user.id)
      .single();
    if(profile) {
      setUserProfession(profile.profession);
      const racha = profile.racha_dias || 0;
      setStreak(racha);

      // Reconstruir días completados: cuenta atrás desde ultima_vez_test durante "racha" días
      const dates = [];
      if(profile.ultima_vez_test && racha > 0) {
        const last = new Date(profile.ultima_vez_test);
        for(let i = 0; i < racha; i++) {
          const d = new Date(last);
          d.setDate(d.getDate() - i);
          dates.push(d.toISOString().split("T")[0]);
        }
      }
      setCompletedDates(dates);
    }
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.teal800 }} edges={["top"]}>
      <StatusBar style="light"/>

      {/* Cabecera */}
      <View style={{ backgroundColor:C.teal800, paddingHorizontal:16, paddingTop:16, paddingBottom:22 }}>
        <Text style={{ fontFamily:"Georgia", fontSize:20, color:"white", marginBottom:8 }}>
          Smart<Text style={{ color:C.teal300 }}>Pills</Text>
        </Text>

        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"flex-end", marginTop:-12 }}>
          <View style={{ flex:1 }}>
            <Text style={{ fontSize:10, fontWeight:"500", letterSpacing:1.4, textTransform:"uppercase", color:C.teal300, marginBottom:4 }}>
              Tests semanales
            </Text>
            <Text style={{ fontFamily:"Georgia", fontSize:18, color:"white" }}>
              {userProfession ? `Tests para ${capitalize(userProfession)}` : "Elige tu test"}
            </Text>
          </View>

          <View style={{ alignItems:"center", marginLeft:16 }}>
            <Text style={{
              fontFamily:       "Georgia",
              fontSize:         68,
              fontStyle:        "italic",
              fontWeight:       "900",
              color:            "#FF6B35",
              textShadowColor:  "rgba(255,107,53,0.7)",
              textShadowRadius: 12,
              textShadowOffset: { width: 0, height: 0 },
              lineHeight:       70,
            }}>
              {streak}
            </Text>
            <Text style={{
              fontSize:        10,
              color:           C.coral300,
              fontWeight:      "700",
              textTransform:   "uppercase",
              letterSpacing:   1.3,
              marginTop:       2,
            }}>
              días de racha
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ backgroundColor:C.cream }} contentContainerStyle={{ padding:16, gap:12 }}>

        {!userProfession && (
          <View style={{ backgroundColor:C.teal50, borderWidth:1, borderColor:C.teal100, borderRadius:12, padding:14, alignItems:"center" }}>
            <Text style={{ fontSize:24, marginBottom:6 }}>👤</Text>
            <Text style={{ fontSize:14, fontWeight:"500", color:C.teal600, marginBottom:4, textAlign:"center" }}>
              Completa tu perfil
            </Text>
            <Text style={{ fontSize:13, color:C.muted, textAlign:"center" }}>
              Define tu profesión en el perfil para ver los tests específicos.
            </Text>
          </View>
        )}

        {/* Reto Diario */}
        <Pressable onPress={() => router.push({ pathname:"/test", params:{ kind:"daily" } })}
          style={({pressed}) => ({
            backgroundColor:C.coral500,
            borderRadius:12, padding:16,
            flexDirection:"row", alignItems:"center", gap:12,
            opacity: pressed ? 0.9 : 1,
          })}>
          <Text style={{ fontSize:32 }}>🔥</Text>
          <View style={{ flex:1 }}>
            <Text style={{ fontSize:15, fontWeight:"500", color:"white", marginBottom:2 }}>Reto Diario</Text>
            <Text style={{ fontSize:12, color:"rgba(255,255,255,0.85)" }}>5 preguntas · Mantén tu racha</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)"/>
        </Pressable>

        {/* Test General */}
        <Pressable onPress={() => router.push({ pathname:"/test", params:{ kind:"general" } })}
          style={({pressed}) => ({
            backgroundColor:C.teal600,
            borderRadius:12, padding:16,
            flexDirection:"row", alignItems:"center", gap:12,
            opacity: pressed ? 0.9 : 1,
          })}>
          <Text style={{ fontSize:32 }}>🌐</Text>
          <View style={{ flex:1 }}>
            <Text style={{ fontSize:15, fontWeight:"500", color:"white", marginBottom:2 }}>Test General</Text>
            <Text style={{ fontSize:12, color:"rgba(255,255,255,0.75)" }}>Todas las profesiones · Una vez al día</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)"/>
        </Pressable>

        {/* Calendario de racha */}
        <View style={{ marginTop:12 }}>
          <StreakCalendar completedDates={completedDates} streak={streak}/>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
