import { useCallback, useState } from "react";
import { View, Text, Pressable, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { ensureStreakState, MAX_VACCINES, VACCINE_ICON_URL, VACCINE_ICON_BW_URL } from "../../lib/streak";
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
  const [streakDays, setStreakDays] = useState([]);
  const [vaccineDays, setVaccineDays] = useState([]);
  const [iceDays, setIceDays] = useState([]);
  const [vaccines, setVaccines] = useState(MAX_VACCINES);

  // Recargar perfil cada vez que se entra a la pestaña Test
  // (necesario para que el calendario muestre el fuego al volver del reto diario)
  useFocusEffect(useCallback(() => { loadProfile(); }, []));

  async function loadProfile() {
    const { data:{ user } } = await supabase.auth.getUser();
    if(!user) return;
    let { data:profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();
    if(profile) {
      // Procesar racha pendiente (gastar vacunas o marcar hielo) antes de mostrar
      profile = await ensureStreakState(profile, user.id);
      setUserProfession(profile.profession);
      setStreak(profile.racha_dias || 0);
      setStreakDays(Array.isArray(profile.streak_days)     ? profile.streak_days     : []);
      setVaccineDays(Array.isArray(profile.streak_vaccines) ? profile.streak_vaccines : []);
      setIceDays(Array.isArray(profile.ice_days)            ? profile.ice_days        : []);
      setVaccines(profile.vaccines_remaining ?? MAX_VACCINES);
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
            <Text style={{ fontSize:12, color:"rgba(255,255,255,0.75)" }}>Repite cuando quieras · 5 XP por acierto</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)"/>
        </Pressable>

        {/* Calendario de racha */}
        <View style={{ marginTop:12 }}>
          <StreakCalendar
            streakDays={streakDays}
            vaccineDays={vaccineDays}
            iceDays={iceDays}
            streak={streak}
          />
        </View>

        {/* Vacunas disponibles — cada una en un marco verde suave, alineado a la derecha */}
        <View style={{
          flexDirection:"row", alignItems:"center", justifyContent:"flex-end",
          marginTop:8, marginRight:4, gap:8,
        }}>
          <Text style={{
            fontSize:14, fontWeight:"700", color:C.coral500,
            letterSpacing:0.3, marginRight:4,
          }}>
            Vacunas:
          </Text>
          {Array.from({ length: MAX_VACCINES }).map((_, i) => {
            const filled = i < vaccines;
            return (
              <View key={i} style={{
                width:46, height:46, borderRadius:14,
                backgroundColor: filled ? C.teal50 : "#f3f5f4",
                borderWidth:1.5, borderColor: filled ? C.teal300 : "#d9e0dd",
                alignItems:"center", justifyContent:"center",
              }}>
                <Image
                  source={{ uri: filled ? VACCINE_ICON_URL : VACCINE_ICON_BW_URL }}
                  style={{ width: 32, height: 32 }}
                  resizeMode="contain"
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
