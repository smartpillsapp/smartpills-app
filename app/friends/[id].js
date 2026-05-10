import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal500:"#1d9e87", teal300:"#6dcfc0", teal100:"#d4f0eb", teal50:"#edf8f6",
  coral500:"#d4522a", coral100:"#fae8e2", coral50:"#fdf4f1",
  amber500:"#d97706", amber100:"#fef3c7",
  cream:"#f7f5f0", white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)",
};

const REACTION_EMOJIS = ["👏", "🔥", "💪", "🎉", "❤️"];

function capitalize(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : ""; }

export default function FriendProfile() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [myProfileId, setMyProfileId] = useState(null);
  const [friend, setFriend] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [loading, setLoading] = useState(true);

  // Reacciones agrupadas por contexto
  const [streakReactions, setStreakReactions] = useState([]);   // [{ emoji, reactor_id }]
  const [leagueReactions, setLeagueReactions] = useState([]);
  const [myStreakReaction, setMyStreakReaction] = useState(null);  // emoji o null
  const [myLeagueReaction, setMyLeagueReaction] = useState(null);

  useEffect(() => { loadAll(); }, [id]);

  async function loadAll() {
    setLoading(true);
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if(!user) return;
      const { data:me } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).single();
      if(!me) return;
      setMyProfileId(me.id);

      // Verificar amistad
      const { data:rel } = await supabase.from("friendships")
        .select("status")
        .or(`and(requester_id.eq.${me.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${me.id})`)
        .eq("status","accepted")
        .maybeSingle();
      setIsFriend(!!rel);

      // Cargar perfil del amigo
      const { data:friendData } = await supabase.from("profiles")
        .select("id, username, full_name, profession, specialty, current_league, racha_dias, total_xp, weekly_xp")
        .eq("id", id).single();
      setFriend(friendData);

      // Reacciones SOBRE el amigo (de cualquier amigo suyo)
      if(friendData) {
        const { data:rxs } = await supabase.from("friend_reactions")
          .select("reactor_id, context, context_value, emoji")
          .eq("target_id", id);

        const streakKey = String(friendData.racha_dias ?? 0);
        const leagueKey = friendData.current_league || "Estudiantes";

        const sR = (rxs || []).filter(r => r.context === "streak" && r.context_value === streakKey);
        const lR = (rxs || []).filter(r => r.context === "league" && r.context_value === leagueKey);
        setStreakReactions(sR);
        setLeagueReactions(lR);

        const mineS = sR.find(r => r.reactor_id === me.id);
        const mineL = lR.find(r => r.reactor_id === me.id);
        setMyStreakReaction(mineS?.emoji || null);
        setMyLeagueReaction(mineL?.emoji || null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function react(context, emoji) {
    if(!myProfileId || !friend || !isFriend) return;
    const contextValue = context === "streak"
      ? String(friend.racha_dias ?? 0)
      : (friend.current_league || "Estudiantes");

    const currentMine = context === "streak" ? myStreakReaction : myLeagueReaction;

    if(currentMine === emoji) {
      // Toggle off → eliminar reacción
      await supabase.from("friend_reactions").delete()
        .eq("reactor_id", myProfileId).eq("target_id", friend.id)
        .eq("context", context).eq("context_value", contextValue);
    } else {
      // Upsert: una sola reacción mía por (target, context, context_value)
      await supabase.from("friend_reactions").upsert({
        reactor_id: myProfileId, target_id: friend.id,
        context, context_value: contextValue, emoji,
      }, { onConflict: "reactor_id,target_id,context,context_value" });
    }
    loadAll();
  }

  if(loading) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor:C.cream, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator size="large" color={C.teal600}/>
      </SafeAreaView>
    );
  }

  if(!friend) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor:C.cream, alignItems:"center", justifyContent:"center", padding:24 }}>
        <Text style={{ fontSize:14, color:C.muted, marginBottom:16 }}>Perfil no encontrado</Text>
        <Pressable onPress={() => router.back()}
          style={{ backgroundColor:C.teal600, paddingHorizontal:24, paddingVertical:10, borderRadius:18 }}>
          <Text style={{ color:"white", fontSize:13 }}>Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.teal800 }} edges={["top"]}>
      <StatusBar style="light"/>

      <View style={{ backgroundColor:C.teal800, paddingHorizontal:16, paddingVertical:14 }}>
        <Pressable onPress={() => router.back()}
          style={{ alignSelf:"flex-start", backgroundColor:"rgba(255,255,255,0.12)", borderWidth:1, borderColor:"rgba(255,255,255,0.2)", borderRadius:8, paddingHorizontal:10, paddingVertical:4, marginBottom:10 }}>
          <Text style={{ fontSize:12, color:"white" }}>← Volver</Text>
        </Pressable>
      </View>

      <ScrollView style={{ backgroundColor:C.cream }} contentContainerStyle={{ paddingBottom:32 }}>

        {/* Cabecera del amigo */}
        <View style={{ backgroundColor:C.teal800, paddingHorizontal:24, paddingBottom:32, alignItems:"center" }}>
          <View style={{ width:80, height:80, borderRadius:40, backgroundColor:"rgba(255,255,255,0.15)", borderWidth:2, borderColor:"rgba(255,255,255,0.3)", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
            <Text style={{ fontFamily:"Georgia", fontSize:32, color:"white" }}>
              {(friend.username || "?").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={{ fontFamily:"Georgia", fontSize:22, color:"white", marginBottom:4 }}>
            {friend.full_name || friend.username}
          </Text>
          <Text style={{ fontSize:12, color:"rgba(255,255,255,0.65)" }}>
            {friend.username ? `@${friend.username} · ` : ""}{capitalize(friend.profession)}
            {friend.specialty ? ` · ${friend.specialty}` : ""}
          </Text>
        </View>

        <View style={{ padding:20, gap:16 }}>

          {!isFriend && (
            <View style={{ backgroundColor:C.amber100, borderRadius:10, padding:12 }}>
              <Text style={{ fontSize:12, color:"#7a4a00" }}>
                No sois amigos. Solo verás los datos públicos y no podrás reaccionar.
              </Text>
            </View>
          )}

          {/* Tarjeta de RACHA */}
          <View style={{ backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:14, padding:18 }}>
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <View>
                <Text style={{ fontSize:11, fontWeight:"600", letterSpacing:1, textTransform:"uppercase", color:C.muted2, marginBottom:2 }}>
                  Racha
                </Text>
                <Text style={{ fontFamily:"Georgia", fontSize:32, color:C.amber500 }}>
                  {friend.racha_dias || 0} 🔥
                </Text>
                <Text style={{ fontSize:12, color:C.muted2, marginTop:2 }}>días consecutivos</Text>
              </View>
            </View>

            {isFriend && (
              <ReactionRow
                emojis={REACTION_EMOJIS}
                reactions={streakReactions}
                myReaction={myStreakReaction}
                onReact={(emoji) => react("streak", emoji)}
              />
            )}
          </View>

          {/* Tarjeta de LIGA */}
          <View style={{ backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:14, padding:18 }}>
            <View style={{ marginBottom:14 }}>
              <Text style={{ fontSize:11, fontWeight:"600", letterSpacing:1, textTransform:"uppercase", color:C.muted2, marginBottom:2 }}>
                Liga actual
              </Text>
              <Text style={{ fontFamily:"Georgia", fontSize:24, color:C.teal600 }}>
                {friend.current_league || "Estudiantes"}
              </Text>
            </View>

            {isFriend && (
              <ReactionRow
                emojis={REACTION_EMOJIS}
                reactions={leagueReactions}
                myReaction={myLeagueReaction}
                onReact={(emoji) => react("league", emoji)}
              />
            )}
          </View>

          {/* Tarjeta de XP (solo lectura, sin reacciones por ahora) */}
          <View style={{ backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:14, padding:18 }}>
            <Text style={{ fontSize:11, fontWeight:"600", letterSpacing:1, textTransform:"uppercase", color:C.muted2, marginBottom:8 }}>
              Experiencia
            </Text>
            <View style={{ flexDirection:"row", gap:12 }}>
              <View style={{ flex:1, backgroundColor:C.cream, borderRadius:8, padding:12, alignItems:"center" }}>
                <Text style={{ fontFamily:"Georgia", fontSize:20, color:C.teal600 }}>{friend.total_xp ?? 0}</Text>
                <Text style={{ fontSize:11, color:C.muted2, marginTop:2 }}>XP total</Text>
              </View>
              <View style={{ flex:1, backgroundColor:C.cream, borderRadius:8, padding:12, alignItems:"center" }}>
                <Text style={{ fontFamily:"Georgia", fontSize:20, color:C.amber500 }}>{friend.weekly_xp ?? 0}</Text>
                <Text style={{ fontSize:11, color:C.muted2, marginTop:2 }}>esta semana</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ReactionRow({ emojis, reactions, myReaction, onReact }) {
  // Agrupa: { emoji: count }
  const counts = {};
  reactions.forEach(r => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });

  return (
    <View style={{ borderTopWidth:1, borderTopColor:C.border, paddingTop:14 }}>
      <Text style={{ fontSize:11, color:C.muted2, marginBottom:8 }}>Reacciona:</Text>
      <View style={{ flexDirection:"row", flexWrap:"wrap", gap:6 }}>
        {emojis.map(e => {
          const count = counts[e] || 0;
          const isMine = myReaction === e;
          return (
            <Pressable key={e} onPress={() => onReact(e)}
              style={({pressed}) => ({
                flexDirection:"row", alignItems:"center", gap:4,
                paddingHorizontal:10, paddingVertical:6, borderRadius:18,
                backgroundColor: isMine ? C.teal50 : "transparent",
                borderWidth:1, borderColor: isMine ? C.teal100 : C.border,
                opacity: pressed ? 0.7 : 1,
              })}>
              <Text style={{ fontSize:16 }}>{e}</Text>
              {count > 0 && (
                <Text style={{ fontSize:12, color: isMine ? C.teal600 : C.muted, fontWeight: isMine ? "700" : "500" }}>
                  {count}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
