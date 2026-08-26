import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import UserAvatar from "../../components/UserAvatar";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal500:"#1d9e87", teal300:"#6dcfc0", teal100:"#d4f0eb", teal50:"#edf8f6",
  coral500:"#d4522a", coral100:"#fae8e2", coral50:"#fdf4f1",
  amber500:"#d97706", amber100:"#fef3c7",
  green600:"#16a34a", green50:"#f0fdf4",
  cream:"#f7f5f0", white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)",
};

const REACTION_EMOJIS = ["👏", "🔥", "💪", "🎉", "❤️"];
const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];


// Devuelve las últimas 7 fechas (hoy incluido), de más antigua a más reciente
function getLast7Days() {
  const days = [];
  for(let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

// Gráfico de barras semanal — puro View, sin librerías
// Colores: coral = perfil visitado, verde = tú
function XpWeekChart({ friendHistory, myHistory, friendName }) {
  const days = getLast7Days();
  const friendValues = days.map(d => friendHistory?.[d] || 0);
  const myValues     = days.map(d => myHistory?.[d] || 0);
  const friendTotal  = friendValues.reduce((a, b) => a + b, 0);
  const myTotal      = myValues.reduce((a, b) => a + b, 0);
  const maxVal       = Math.max(...friendValues, ...myValues, 1);
  const BAR_H        = 90;
  const noData       = friendTotal === 0 && myTotal === 0;

  return (
    <View style={{ backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:14, padding:18 }}>
      <Text style={{ fontSize:11, fontWeight:"600", letterSpacing:1, textTransform:"uppercase", color:C.muted2, marginBottom:14 }}>
        Progreso semanal
      </Text>

      {/* Leyenda */}
      <View style={{ flexDirection:"row", gap:16, marginBottom:16 }}>
        <View style={{ flexDirection:"row", alignItems:"center", gap:5 }}>
          <View style={{ width:10, height:10, borderRadius:5, backgroundColor:C.coral500 }}/>
          <Text style={{ fontSize:11, color:C.ink, fontWeight:"500" }}>{friendName}</Text>
        </View>
        <View style={{ flexDirection:"row", alignItems:"center", gap:5 }}>
          <View style={{ width:10, height:10, borderRadius:5, backgroundColor:C.green600 }}/>
          <Text style={{ fontSize:11, color:C.ink, fontWeight:"500" }}>Tú</Text>
        </View>
      </View>

      {noData ? (
        <View style={{ alignItems:"center", paddingVertical:28 }}>
          <Text style={{ fontSize:13, color:C.muted2, textAlign:"center" }}>
            Aún no hay datos de esta semana.{"\n"}Completa un test para ver tu progreso aquí.
          </Text>
        </View>
      ) : (
        /* Barras con valor encima */
        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"flex-end" }}>
          {days.map((_, i) => {
            const fVal = friendValues[i];
            const mVal = myValues[i];
            const fH   = fVal > 0 ? Math.max(6, Math.round((fVal / maxVal) * BAR_H)) : 0;
            const mH   = mVal > 0 ? Math.max(6, Math.round((mVal / maxVal) * BAR_H)) : 0;
            const dow   = new Date(days[i] + "T00:00:00Z").getUTCDay();
            const label = DAY_LABELS[dow === 0 ? 6 : dow - 1];
            const hasAny = fVal > 0 || mVal > 0;

            return (
              <View key={i} style={{ alignItems:"center", flex:1 }}>
                {/* Etiqueta XP encima de las barras */}
                {hasAny && (
                  <Text style={{ fontSize:8, color:C.muted2, marginBottom:2, textAlign:"center" }}>
                    {fVal > 0 ? fVal : ""}{fVal > 0 && mVal > 0 ? "/" : ""}{mVal > 0 ? mVal : ""}
                  </Text>
                )}
                {/* Par de barras */}
                <View style={{ flexDirection:"row", alignItems:"flex-end", gap:2, height:BAR_H }}>
                  <View style={{ width:9, height: fH || 2, backgroundColor: fVal > 0 ? C.coral500 : C.border, borderRadius:3 }}/>
                  <View style={{ width:9, height: mH || 2, backgroundColor: mVal > 0 ? C.green600  : C.border, borderRadius:3 }}/>
                </View>
                <Text style={{ fontSize:10, color:C.muted2, marginTop:4 }}>{label}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Totales semanales */}
      {!noData && (
        <View style={{ flexDirection:"row", justifyContent:"space-between", marginTop:16, paddingTop:12, borderTopWidth:1, borderTopColor:C.border }}>
          <View style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
            <View style={{ width:8, height:8, borderRadius:4, backgroundColor:C.coral500 }}/>
            <Text style={{ fontSize:13, color:C.coral500, fontWeight:"700" }}>{friendTotal} XP</Text>
            <Text style={{ fontSize:11, color:C.muted2 }}>{friendName}</Text>
          </View>
          <View style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
            <Text style={{ fontSize:11, color:C.muted2 }}>Tú</Text>
            <Text style={{ fontSize:13, color:C.green600, fontWeight:"700" }}>{myTotal} XP</Text>
            <View style={{ width:8, height:8, borderRadius:4, backgroundColor:C.green600 }}/>
          </View>
        </View>
      )}
    </View>
  );
}

export default function FriendProfile() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [myProfileId, setMyProfileId] = useState(null);
  const [friend, setFriend] = useState(null);
  const [myDailyXp, setMyDailyXp] = useState({});
  const [isFriend, setIsFriend] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(true);

  const [streakReactions, setStreakReactions] = useState([]);
  const [leagueReactions, setLeagueReactions] = useState([]);
  const [myStreakReaction, setMyStreakReaction] = useState(null);
  const [myLeagueReaction, setMyLeagueReaction] = useState(null);

  useEffect(() => { loadAll(); }, [id]);

  async function loadAll() {
    setLoading(true);
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if(!user) return;

      // Cargar perfil propio (para gráfico comparativo)
      const { data:me } = await supabase.from("profiles")
        .select("id, daily_xp_history")
        .eq("auth_user_id", user.id).single();
      if(!me) return;
      setMyProfileId(me.id);
      setMyDailyXp(me.daily_xp_history || {});

      // Verificar amistad / solicitud pendiente
      const { data:rel } = await supabase.from("friendships")
        .select("status")
        .or(`and(requester_id.eq.${me.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${me.id})`)
        .maybeSingle();
      setIsFriend(rel?.status === "accepted");
      setRequestSent(!!rel && rel.status !== "accepted");

      // Cargar perfil del amigo
      const { data:friendData } = await supabase.from("profiles")
        .select("id, username, full_name, profession, specialty, current_league, racha_dias, total_xp, weekly_xp, daily_xp_history, created_at, avatar_id")
        .eq("id", id).single();
      setFriend(friendData);

      // Reacciones
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
        setMyStreakReaction(sR.find(r => r.reactor_id === me.id)?.emoji || null);
        setMyLeagueReaction(lR.find(r => r.reactor_id === me.id)?.emoji || null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function sendRequest() {
    if(!myProfileId || requestSent || isFriend) return;
    const { error } = await supabase.from("friendships").insert({
      requester_id: myProfileId, addressee_id: id, status: "pending",
    });
    if(!error) {
      setRequestSent(true);
      // Notificar al destinatario por push
      supabase.functions.invoke("notify-friend-request", {
        body: { requester_profile_id: myProfileId, addressee_profile_id: id },
      }).catch(() => {}); // silencioso si falla
    }
  }

  async function react(context, emoji) {
    if(!myProfileId || !friend || !isFriend) return;
    const contextValue = context === "streak"
      ? String(friend.racha_dias ?? 0)
      : (friend.current_league || "Estudiantes");
    const currentMine = context === "streak" ? myStreakReaction : myLeagueReaction;

    if(currentMine === emoji) {
      await supabase.from("friend_reactions").delete()
        .eq("reactor_id", myProfileId).eq("target_id", friend.id)
        .eq("context", context).eq("context_value", contextValue);
    } else {
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

  const joinYear = friend.created_at
    ? new Date(friend.created_at).getFullYear()
    : null;
  const friendName = friend.full_name || friend.username || "Usuario";

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.teal800 }} edges={["top"]}>
      <StatusBar style="light"/>

      {/* Barra superior */}
      <View style={{ backgroundColor:C.teal800, paddingHorizontal:16, paddingVertical:14 }}>
        <Pressable onPress={() => router.back()}
          style={{ alignSelf:"flex-start", backgroundColor:"rgba(255,255,255,0.12)", borderWidth:1, borderColor:"rgba(255,255,255,0.2)", borderRadius:8, paddingHorizontal:10, paddingVertical:4 }}>
          <Text style={{ fontSize:12, color:"white" }}>← Volver</Text>
        </Pressable>
      </View>

      <ScrollView style={{ backgroundColor:C.cream }} contentContainerStyle={{ paddingBottom:40 }}>

        {/* ── Cabecera ── */}
        <View style={{ backgroundColor:C.teal800, paddingHorizontal:24, paddingBottom:28, alignItems:"center" }}>
          <UserAvatar
            avatarId={friend.avatar_id}
            initials={(friend.username || "?").charAt(0).toUpperCase()}
            size={88}
            color="rgba(255,255,255,0.15)"
            containerStyle={{ marginBottom:14, borderWidth:2, borderColor:"rgba(255,255,255,0.3)" }}
            initialsStyle={{ fontFamily:"Georgia", fontSize:36, color:"white" }}
          />
          <Text style={{ fontFamily:"Georgia", fontSize:22, color:"white", marginBottom:4 }}>
            {friendName}
          </Text>
          <Text style={{ fontSize:12, color:"rgba(255,255,255,0.65)", marginBottom:16 }}>
            {friend.username ? `@${friend.username}` : ""}
            {friend.username && joinYear ? " · " : ""}
            {joinYear ? `SE UNIÓ EN ${joinYear}` : ""}
          </Text>

          {/* Botón Seguir */}
          {isFriend ? (
            <View style={{ backgroundColor:"rgba(255,255,255,0.15)", borderRadius:24, paddingHorizontal:32, paddingVertical:12 }}>
              <Text style={{ color:"rgba(255,255,255,0.7)", fontSize:14, fontWeight:"600" }}>✓ SIGUIENDO</Text>
            </View>
          ) : requestSent ? (
            <View style={{ backgroundColor:"rgba(255,255,255,0.15)", borderRadius:24, paddingHorizontal:32, paddingVertical:12 }}>
              <Text style={{ color:"rgba(255,255,255,0.7)", fontSize:14, fontWeight:"600" }}>Solicitud enviada</Text>
            </View>
          ) : (
            <Pressable onPress={sendRequest}
              style={({ pressed }) => ({
                backgroundColor: pressed ? "#b83d1e" : C.coral500,
                borderRadius:24, paddingHorizontal:40, paddingVertical:12,
              })}>
              <Text style={{ color:"white", fontSize:14, fontWeight:"700", letterSpacing:0.5 }}>＋ SEGUIR</Text>
            </Pressable>
          )}
        </View>

        <View style={{ padding:20, gap:16 }}>

          {/* ── Gráfico XP semanal ── */}
          <XpWeekChart
            friendHistory={friend.daily_xp_history || {}}
            myHistory={myDailyXp}
            friendName={friend.username || friendName}
          />

          {/* ── Resumen ── */}
          <View style={{ backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:14, padding:18 }}>
            <Text style={{ fontSize:11, fontWeight:"600", letterSpacing:1, textTransform:"uppercase", color:C.muted2, marginBottom:14 }}>
              Resumen
            </Text>
            <View style={{ flexDirection:"row", flexWrap:"wrap", gap:10 }}>
              <StatCard icon="🔥" label="Racha" value={`${friend.racha_dias || 0} días`} />
              <StatCard icon="🏆" label="Liga" value={friend.current_league || "Estudiantes"} />
              <StatCard icon="⚡" label="XP total" value={(friend.total_xp ?? 0).toLocaleString()} />
              <StatCard icon="📅" label="Esta semana" value={`${friend.weekly_xp ?? 0} XP`} />
            </View>
          </View>

          {/* ── Reacciones (solo amigos) ── */}
          {isFriend && (
            <>
              <View style={{ backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:14, padding:18 }}>
                <Text style={{ fontSize:12, fontWeight:"600", color:C.ink, marginBottom:10 }}>
                  Reaccionar a la racha ({friend.racha_dias || 0} 🔥)
                </Text>
                <ReactionRow
                  emojis={REACTION_EMOJIS}
                  reactions={streakReactions}
                  myReaction={myStreakReaction}
                  onReact={(emoji) => react("streak", emoji)}
                />
              </View>

              <View style={{ backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:14, padding:18 }}>
                <Text style={{ fontSize:12, fontWeight:"600", color:C.ink, marginBottom:10 }}>
                  Reaccionar a la liga ({friend.current_league || "Estudiantes"})
                </Text>
                <ReactionRow
                  emojis={REACTION_EMOJIS}
                  reactions={leagueReactions}
                  myReaction={myLeagueReaction}
                  onReact={(emoji) => react("league", emoji)}
                />
              </View>
            </>
          )}

          {!isFriend && !requestSent && (
            <View style={{ backgroundColor:C.amber100, borderRadius:10, padding:12 }}>
              <Text style={{ fontSize:12, color:"#7a4a00" }}>
                Sigue a esta persona para ver sus reacciones y poder interactuar.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <View style={{ width:"47%", backgroundColor:C.cream, borderRadius:10, padding:12 }}>
      <Text style={{ fontSize:18, marginBottom:4 }}>{icon}</Text>
      <Text style={{ fontFamily:"Georgia", fontSize:16, color:C.ink, marginBottom:2 }}>{value}</Text>
      <Text style={{ fontSize:11, color:C.muted2 }}>{label}</Text>
    </View>
  );
}

function ReactionRow({ emojis, reactions, myReaction, onReact }) {
  const counts = {};
  reactions.forEach(r => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });

  return (
    <View style={{ flexDirection:"row", flexWrap:"wrap", gap:6 }}>
      {emojis.map(e => {
        const count = counts[e] || 0;
        const isMine = myReaction === e;
        return (
          <Pressable key={e} onPress={() => onReact(e)}
            style={({ pressed }) => ({
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
  );
}
