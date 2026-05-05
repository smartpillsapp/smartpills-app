import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { getTimeUntilReset, getLeagueImage } from "../../lib/leagues";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal500:"#1d9e87", teal300:"#6dcfc0", teal100:"#d4f0eb", teal50:"#edf8f6",
  coral500:"#d4522a", coral300:"#e8967e", coral100:"#fae8e2",
  amber500:"#d97706",
  green700:"#15803d", green500:"#22c55e", green100:"#dcfce7", green50:"#f0fdf4",
  red700:"#b91c1c", red500:"#ef4444", red100:"#fee2e2", red50:"#fef2f2",
  cream:"#f7f5f0",
  white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)", borderMd:"rgba(28,43,38,0.16)",
};

const AVATAR_COLORS = ["#155c50","#3c3489","#993c1d","#633806","#1a7a69","#607068","#d4522a","#1d9e87","#7c2d12","#1e3a8a"];

function capitalize(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : ""; }

function getInitials(username, fullName) {
  const source = (username || fullName || "?").trim();
  const parts = source.split(/\s+/);
  if(parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function getColor(seed) {
  if(!seed) return AVATAR_COLORS[0];
  let hash = 0;
  for(let i=0; i<seed.length; i++) hash = ((hash<<5) - hash + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function buildUserRow(profile, position, currentProfileId, xpField) {
  return {
    id:         profile.id,
    pos:        position,
    name:       profile.username || profile.full_name || "Usuario",
    profession: capitalize(profile.profession || ""),
    workplace:  profile.workplace || "",
    province:   profile.city || "",
    xp:         profile[xpField] || 0,
    avatar:     getInitials(profile.username, profile.full_name),
    color:      getColor(profile.username || profile.id),
    isMe:       profile.id === currentProfileId,
  };
}

function getZoneStyle(position, totalInLeague, mode) {
  if(mode !== "league") return null;
  if(position <= 5) return "promote";
  if(position > totalInLeague - 3) return "demote";
  return null;
}

function Medal({ pos }) {
  if(pos === 1) return <Text style={{ fontSize:20 }}>🥇</Text>;
  if(pos === 2) return <Text style={{ fontSize:20 }}>🥈</Text>;
  if(pos === 3) return <Text style={{ fontSize:20 }}>🥉</Text>;
  return <Text style={{ fontSize:13, fontWeight:"500", color:C.muted2, textAlign:"center", minWidth:24 }}>{pos}</Text>;
}

function RankRow({ user, highlight, zone }) {
  const subtitle = [user.profession, user.workplace, user.province].filter(Boolean).join(" · ");
  let bg          = C.white;
  let borderColor = C.border;
  let xpColor     = user.pos <= 3 ? C.teal600 : C.ink;
  if(zone === "promote") { bg = C.green50;  borderColor = C.green100; xpColor = C.green700; }
  if(zone === "demote")  { bg = C.red50;    borderColor = C.red100;   xpColor = C.red700;   }
  if(highlight) { borderColor = "#6dcfc0"; if(!zone) bg = C.teal50; }

  return (
    <View style={{ backgroundColor:bg, borderWidth:1, borderColor:borderColor, borderRadius:10, padding:11, flexDirection:"row", alignItems:"center", gap:10, marginBottom:6 }}>
      <View style={{ minWidth:28, alignItems:"center" }}><Medal pos={user.pos}/></View>
      <View style={{ width:32, height:32, borderRadius:16, backgroundColor:user.color, alignItems:"center", justifyContent:"center" }}>
        <Text style={{ color:"white", fontSize:12, fontWeight:"500" }}>{user.avatar}</Text>
      </View>
      <View style={{ flex:1, minWidth:0 }}>
        <View style={{ flexDirection:"row", alignItems:"center", gap:5 }}>
          <Text style={{ fontSize:13, fontWeight:"500", color:C.ink }}>{user.name}</Text>
          {user.isMe && (
            <View style={{ backgroundColor:C.teal50, paddingHorizontal:6, paddingVertical:1, borderRadius:6 }}>
              <Text style={{ fontSize:10, fontWeight:"500", color:C.teal600 }}>tú</Text>
            </View>
          )}
          {zone === "promote" && <Text style={{ fontSize:10, color:C.green700 }}>↑</Text>}
          {zone === "demote"  && <Text style={{ fontSize:10, color:C.red700 }}>↓</Text>}
        </View>
        {subtitle ? (
          <Text numberOfLines={1} style={{ fontSize:11, color:C.muted2 }}>{subtitle}</Text>
        ) : null}
      </View>
      <View style={{ alignItems:"flex-end" }}>
        <Text style={{ fontSize:14, fontWeight:"500", color:xpColor }}>
          {user.xp} <Text style={{ fontSize:10, color:C.muted2, fontWeight:"400" }}>XP</Text>
        </Text>
      </View>
    </View>
  );
}

export default function Ranking() {
  const router = useRouter();
  const [mode, setMode]               = useState("league");
  const [loading, setLoading]         = useState(true);
  const [users, setUsers]             = useState([]);
  const [profileId, setProfileId]     = useState(null);
  const [userLeague, setUserLeague]   = useState(null);
  const [timeLeft, setTimeLeft]       = useState(getTimeUntilReset());

  useEffect(() => { loadProfile(); }, []);
  useEffect(() => {
    if(profileId !== null) loadRanking();
  }, [mode, profileId, userLeague]);

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeUntilReset()), 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadProfile() {
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if(!user) return;
      const { data:profile } = await supabase
        .from("profiles")
        .select("id, current_league")
        .eq("auth_user_id", user.id)
        .single();
      if(profile) {
        setProfileId(profile.id);
        setUserLeague(profile.current_league || "Estudiantes");
      }
    } catch(err) {
      console.error("Error perfil:", err);
    }
  }

  async function loadRanking() {
    setLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select("id, username, full_name, profession, workplace, city, current_league, total_xp, weekly_xp")
        .limit(100);

      if(mode === "league") {
        query = query.eq("current_league", userLeague).order("weekly_xp", { ascending:false });
      } else if(mode === "week") {
        query = query.order("weekly_xp", { ascending:false });
      } else {
        query = query.order("total_xp", { ascending:false });
      }

      const { data } = await query;
      setUsers(data || []);
    } catch(err) {
      console.error("Error ranking:", err);
    } finally {
      setLoading(false);
    }
  }

  const xpField   = mode === "history" ? "total_xp" : "weekly_xp";
  const myIndex   = users.findIndex(u => u.id === profileId);
  const myPos     = myIndex >= 0 ? myIndex + 1 : null;
  const myProfile = myIndex >= 0 ? users[myIndex] : null;
  const myRow     = myProfile ? buildUserRow(myProfile, myPos, profileId, xpField) : null;

  const top10   = users.slice(0, 10).map((u, i) => buildUserRow(u, i+1, profileId, xpField));
  const meInTop = top10.some(u => u.isMe);

  const tabs = [
    { key:"league",  label:"Mi Liga" },
    { key:"week",    label:"Esta semana" },
    { key:"history", label:"Histórico" },
  ];

  const headerSubtitle =
    mode === "league"  ? "" :
    mode === "week"    ? "XP de esta semana · todos los usuarios" :
                         "XP histórico · todos los usuarios";

  const listHeader =
    mode === "league"  ? `Top 10 · ${userLeague || "Mi Liga"}` :
    mode === "week"    ? "Top 10 · Esta semana" :
                         "Top 10 · Histórico";

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.teal800 }} edges={["top"]}>
      <StatusBar style="light"/>

      {/* Cabecera */}
      <View style={{ backgroundColor:C.teal800, paddingHorizontal:16, paddingTop:14, paddingBottom:14 }}>
        <Text style={{ fontFamily:"Georgia", fontSize:20, color:"white", marginBottom:2 }}>
          Smart<Text style={{ color:C.teal300 }}>Pills</Text>
        </Text>
        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:4, marginTop:8 }}>
          <Text style={{ fontFamily:"Georgia", fontSize:22, color:"white" }}>Ranking</Text>
          {userLeague === "Gerentes" ? (
            <LinearGradient
              colors={["#B9F2FF", "#FFFFFF", "#A0E7FF"]}
              start={{x:0, y:0}} end={{x:1, y:1}}
              style={{
                flexDirection:"row", alignItems:"center", gap:10,
                borderRadius:20, paddingHorizontal:14, paddingVertical:10,
                shadowColor:"#B9F2FF", shadowOpacity:1, shadowRadius:14, shadowOffset:{width:0, height:0}, elevation:12,
              }}>
              <Image source={getLeagueImage(userLeague)} style={{ width:45, height:45 }} resizeMode="contain"/>
              <View>
                <Text style={{ fontSize:10, color:"#0f3d35", fontWeight:"700", letterSpacing:1.2, textTransform:"uppercase", opacity:0.7 }}>Liga</Text>
                <Text style={{ fontSize:18, color:"#0f3d35", fontWeight:"700", letterSpacing:0.3 }}>{userLeague}</Text>
              </View>
              <Ionicons name="sparkles" size={16} color="#FFC700"/>
            </LinearGradient>
          ) : userLeague ? (
            <View style={{ flexDirection:"row", alignItems:"center", gap:10, backgroundColor:C.green100, borderWidth:1, borderColor:C.green500, borderRadius:14, paddingHorizontal:12, paddingVertical:8, transform:[{translateY:-30}] }}>
              <Image source={getLeagueImage(userLeague)} style={{ width:51, height:51 }} resizeMode="contain"/>
              <View>
                <Text style={{ fontSize:11, color:C.green700, fontWeight:"600", letterSpacing:1.2, textTransform:"uppercase" }}>Liga</Text>
                <Text style={{ fontSize:19, color:C.ink, fontWeight:"600" }}>{userLeague}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {userLeague && userLeague !== "Gerentes" && (
          <Pressable onPress={() => router.push("/leagues-info")} hitSlop={8}
            style={{ alignSelf:"flex-end", flexDirection:"row", alignItems:"center", gap:4, marginTop:-30 }}>
            <Text style={{ fontSize:10, fontWeight:"500", letterSpacing:1.4, textTransform:"uppercase", color:"rgba(255,255,255,0.55)" }}>
              Acerca de las ligas
            </Text>
            <Ionicons name="help-circle-outline" size={14} color="rgba(255,255,255,0.55)"/>
          </Pressable>
        )}

        {headerSubtitle ? (
          <Text style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginBottom:6 }}>{headerSubtitle}</Text>
        ) : null}

        {mode !== "history" && (
          <View style={{ alignSelf:"flex-start", flexDirection:"row", alignItems:"center", gap:5, backgroundColor:"rgba(255,255,255,0.12)", borderWidth:1, borderColor:"rgba(255,255,255,0.2)", borderRadius:12, paddingHorizontal:10, paddingVertical:3, marginBottom:12 }}>
            <Text style={{ fontSize:11, color:C.teal300 }}>⏱</Text>
            <Text style={{ fontSize:11, color:"white", fontWeight:"500" }}>Faltan {timeLeft}</Text>
          </View>
        )}

        <View style={{ flexDirection:"row", backgroundColor:"rgba(255,255,255,0.1)", borderRadius:20, padding:3, gap:2, alignSelf:"flex-start" }}>
          {tabs.map(opt => {
            const active = mode === opt.key;
            return (
              <Pressable key={opt.key} onPress={() => setMode(opt.key)}
                style={{ paddingHorizontal:14, paddingVertical:5, borderRadius:16, backgroundColor: active?"white":"transparent" }}>
                <Text style={{ fontSize:12, fontWeight:"500", color: active?C.teal700:"rgba(255,255,255,0.6)" }}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ flex:1, backgroundColor:C.cream }}>

      {/* Tarjeta destacada del usuario */}
      {myRow && (
        <View style={{ paddingHorizontal:14, paddingTop:12 }}>
          <View style={{ backgroundColor:C.white, borderWidth:1, borderColor:C.borderMd, borderRadius:12, padding:13, flexDirection:"row", alignItems:"center", gap:12, marginBottom:6 }}>
            <Text style={{ fontFamily:"Georgia", fontStyle:"italic", fontSize:30, color:C.teal600, minWidth:42, textAlign:"center" }}>#{myRow.pos}</Text>
            <View style={{ width:40, height:40, borderRadius:20, backgroundColor:myRow.color, alignItems:"center", justifyContent:"center" }}>
              <Text style={{ color:"white", fontSize:14, fontWeight:"500" }}>{myRow.avatar}</Text>
            </View>
            <View style={{ flex:1, minWidth:0 }}>
              <Text numberOfLines={1} style={{ fontSize:14, fontWeight:"500", color:C.ink }}>{myRow.name}</Text>
              <Text numberOfLines={1} style={{ fontSize:11, color:C.muted2 }}>
                {[myRow.profession, myRow.workplace, myRow.province].filter(Boolean).join(" · ") || "—"}
              </Text>
            </View>
            <View style={{ alignItems:"flex-end" }}>
              <Text style={{ fontFamily:"Georgia", fontSize:22, color:C.teal600 }}>{myRow.xp}</Text>
              <Text style={{ fontSize:10, color:C.muted2 }}>XP</Text>
            </View>
          </View>
        </View>
      )}

      {/* Cabecera de la lista */}
      <View style={{ paddingHorizontal:14, paddingTop:8 }}>
        <Text style={{ fontSize:10, fontWeight:"500", letterSpacing:1.2, textTransform:"uppercase", color:C.muted2, marginBottom:8 }}>
          {listHeader}
        </Text>

        {mode === "league" && users.length > 0 && (
          <View style={{ flexDirection:"row", gap:10, marginBottom:10 }}>
            <View style={{ flexDirection:"row", alignItems:"center", gap:4 }}>
              <View style={{ width:10, height:10, borderRadius:3, backgroundColor:C.green100, borderWidth:1, borderColor:C.green500 }}/>
              <Text style={{ fontSize:10, color:C.muted }}>Top 5 sube</Text>
            </View>
            <View style={{ flexDirection:"row", alignItems:"center", gap:4 }}>
              <View style={{ width:10, height:10, borderRadius:3, backgroundColor:C.red100, borderWidth:1, borderColor:C.red500 }}/>
              <Text style={{ fontSize:10, color:C.muted }}>Últimos 3 bajan</Text>
            </View>
          </View>
        )}
      </View>

      {/* Lista */}
      {loading ? (
        <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
          <ActivityIndicator size="large" color={C.teal600}/>
        </View>
      ) : top10.length === 0 ? (
        <View style={{ flex:1, alignItems:"center", justifyContent:"center", padding:24 }}>
          <Text style={{ fontSize:32, marginBottom:8 }}>🏆</Text>
          <Text style={{ fontSize:13, color:C.muted2, textAlign:"center" }}>
            {mode === "league"
              ? "Aún no hay nadie más en tu liga. ¡Sé el primero en sumar XP esta semana!"
              : "Aún no hay clasificación. Haz tests para entrar en el ranking."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={top10}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal:14, paddingBottom:14 }}
          renderItem={({ item }) => (
            <RankRow user={item} highlight={item.isMe}
              zone={getZoneStyle(item.pos, users.length, mode)}/>
          )}
          ListFooterComponent={
            myRow && !meInTop ? (
              <>
                <View style={{ flexDirection:"row", alignItems:"center", gap:8, marginVertical:8 }}>
                  <View style={{ flex:1, height:1, backgroundColor:C.border }}/>
                  <Text style={{ fontSize:11, color:C.muted2 }}>· · ·</Text>
                  <View style={{ flex:1, height:1, backgroundColor:C.border }}/>
                </View>
                <RankRow user={myRow} highlight={true}
                  zone={getZoneStyle(myRow.pos, users.length, mode)}/>
              </>
            ) : null
          }
        />
      )}

      </View>
    </SafeAreaView>
  );
}
