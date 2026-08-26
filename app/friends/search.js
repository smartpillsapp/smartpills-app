import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal300:"#6dcfc0", teal50:"#edf8f6",
  coral500:"#d4522a", coral100:"#fae8e2", coral50:"#fdf4f1",
  amber500:"#d97706",
  cream:"#f7f5f0", white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)", borderMd:"rgba(28,43,38,0.16)",
};

function capitalize(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : ""; }
function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim()); }

export default function FriendsSearch() {
  const router = useRouter();
  const [profileId, setProfileId] = useState(null);
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched]   = useState(false);
  // Mapa profileId -> estado de la amistad: "none" | "pending_sent" | "pending_received" | "accepted"
  const [statusMap, setStatusMap] = useState({});

  useEffect(() => { loadMe(); }, []);

  async function loadMe() {
    const { data:{ user } } = await supabase.auth.getUser();
    if(!user) return;
    const { data:profile } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).single();
    if(profile) setProfileId(profile.id);
  }

  async function handleSearch() {
    const q = query.trim();
    if(!q || !profileId) return;
    setSearching(true);
    setSearched(true);
    setResults([]);

    try {
      let users = [];
      if(isEmail(q)) {
        // Buscar por email (RPC con SECURITY DEFINER)
        const { data, error } = await supabase.rpc("find_user_by_email", { search_email: q });
        if(error) throw error;
        users = data || [];
      } else {
        // Buscar por nombre de usuario
        const { data } = await supabase.from("profiles")
          .select("id, username, full_name, profession, current_league")
          .ilike("username", `%${q}%`)
          .neq("id", profileId)
          .limit(20);
        users = data || [];
      }
      setResults(users);

      // Para cada resultado, comprobar estado de amistad
      if(users.length > 0) {
        const ids = users.map(u => u.id);
        const { data:rels } = await supabase
          .from("friendships")
          .select("requester_id, addressee_id, status")
          .or(`and(requester_id.eq.${profileId},addressee_id.in.(${ids.join(",")})),and(addressee_id.eq.${profileId},requester_id.in.(${ids.join(",")}))`);
        const map = {};
        (rels || []).forEach(r => {
          const otherId = r.requester_id === profileId ? r.addressee_id : r.requester_id;
          if(r.status === "accepted") map[otherId] = "accepted";
          else if(r.status === "pending" && r.requester_id === profileId) map[otherId] = "pending_sent";
          else if(r.status === "pending" && r.addressee_id === profileId) map[otherId] = "pending_received";
        });
        setStatusMap(map);
      }
    } catch(err) {
      Alert.alert("Error en la búsqueda", err.message || "Inténtalo de nuevo.");
    } finally {
      setSearching(false);
    }
  }

  async function sendRequest(targetId) {
    if(!profileId) return;
    setStatusMap(m => ({ ...m, [targetId]:"pending_sent" }));
    const { error } = await supabase.from("friendships").insert({
      requester_id: profileId, addressee_id: targetId, status: "pending",
    });
    if(error) {
      setStatusMap(m => ({ ...m, [targetId]: undefined }));
      Alert.alert("No se pudo enviar la solicitud", error.message);
      return;
    }
    // Notificar al destinatario por push
    supabase.functions.invoke("notify-friend-request", {
      body: { requester_profile_id: profileId, addressee_profile_id: targetId },
    }).catch(() => {});
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.teal800 }} edges={["top"]}>
      <StatusBar style="light"/>

      <View style={{ backgroundColor:C.teal800, paddingHorizontal:16, paddingVertical:14 }}>
        <Pressable onPress={() => router.back()}
          style={{ alignSelf:"flex-start", backgroundColor:"rgba(255,255,255,0.12)", borderWidth:1, borderColor:"rgba(255,255,255,0.2)", borderRadius:8, paddingHorizontal:10, paddingVertical:4, marginBottom:10 }}>
          <Text style={{ fontSize:12, color:"white" }}>← Volver</Text>
        </Pressable>
        <Text style={{ fontSize:10, fontWeight:"500", letterSpacing:1.4, textTransform:"uppercase", color:C.teal300, marginBottom:4 }}>
          Amigos
        </Text>
        <Text style={{ fontFamily:"Georgia", fontSize:22, color:"white" }}>
          Buscar
        </Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined} style={{ flex:1, backgroundColor:C.cream }}>
        <View style={{ padding:16 }}>
          <View style={{ flexDirection:"row", gap:8, alignItems:"center" }}>
            <View style={{ flex:1, flexDirection:"row", alignItems:"center", backgroundColor:C.white, borderWidth:1, borderColor:C.borderMd, borderRadius:10, paddingHorizontal:12, height:42, gap:8 }}>
              <Ionicons name="search" size={16} color={C.muted2}/>
              <TextInput value={query} onChangeText={setQuery}
                placeholder="Nombre de usuario o email"
                placeholderTextColor={C.muted2}
                autoCapitalize="none" autoCorrect={false}
                onSubmitEditing={handleSearch} returnKeyType="search"
                style={{ flex:1, fontSize:14, color:C.ink }}/>
            </View>
            <Pressable onPress={handleSearch} disabled={!query.trim()}
              style={({pressed}) => ({
                backgroundColor: query.trim() ? C.teal600 : C.muted2,
                paddingHorizontal:14, height:42, borderRadius:10, alignItems:"center", justifyContent:"center",
                opacity: pressed ? 0.85 : 1,
              })}>
              <Text style={{ color:"white", fontSize:13, fontWeight:"600" }}>Buscar</Text>
            </Pressable>
          </View>
          <Text style={{ fontSize:11, color:C.muted2, marginTop:8, lineHeight:15 }}>
            Por email solo aparecerán usuarios que han aceptado ser encontrados así.
          </Text>
        </View>

        <View style={{ flex:1 }}>
          {searching ? (
            <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
              <ActivityIndicator size="large" color={C.teal600}/>
            </View>
          ) : searched && results.length === 0 ? (
            <View style={{ alignItems:"center", padding:32 }}>
              <Text style={{ fontSize:32, marginBottom:10 }}>🔍</Text>
              <Text style={{ fontSize:14, color:C.muted, textAlign:"center" }}>
                No encontramos a nadie con ese {isEmail(query) ? "email" : "nombre de usuario"}.
              </Text>
              {isEmail(query) && (
                <Text style={{ fontSize:12, color:C.muted2, textAlign:"center", marginTop:8, lineHeight:16 }}>
                  Si conoces a esa persona, dile que active "Permitir que me encuentren por email" en su perfil.
                </Text>
              )}
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingHorizontal:14, paddingBottom:24 }}
              renderItem={({ item }) => {
                const status = statusMap[item.id];
                return (
                  <View style={{
                    backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:12,
                    padding:12, marginBottom:8, flexDirection:"row", alignItems:"center", gap:12,
                  }}>
                    <View style={{ width:44, height:44, borderRadius:22, backgroundColor:C.teal50, alignItems:"center", justifyContent:"center" }}>
                      <Text style={{ fontFamily:"Georgia", fontSize:18, color:C.teal600 }}>
                        {(item.username || "?").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex:1, minWidth:0 }}>
                      <Text style={{ fontSize:14, fontWeight:"600", color:C.ink }}>{item.full_name || item.username}</Text>
                      <Text style={{ fontSize:11, color:C.muted2, marginTop:2 }}>
                        {item.username ? `@${item.username} · ` : ""}{capitalize(item.profession)}
                      </Text>
                    </View>
                    {status === "accepted" ? (
                      <Pressable onPress={() => router.push(`/friends/${item.id}`)}
                        style={{ paddingHorizontal:10, paddingVertical:6 }}>
                        <Text style={{ fontSize:12, color:C.teal600, fontWeight:"600" }}>Amigos ✓</Text>
                      </Pressable>
                    ) : status === "pending_sent" ? (
                      <View style={{ paddingHorizontal:10, paddingVertical:6 }}>
                        <Text style={{ fontSize:12, color:C.muted2 }}>Pendiente…</Text>
                      </View>
                    ) : status === "pending_received" ? (
                      <Pressable onPress={() => router.push("/friends")}
                        style={{ paddingHorizontal:10, paddingVertical:6 }}>
                        <Text style={{ fontSize:12, color:C.amber500, fontWeight:"600" }}>Te ha invitado →</Text>
                      </Pressable>
                    ) : (
                      <Pressable onPress={() => sendRequest(item.id)}
                        style={({pressed}) => ({
                          backgroundColor: pressed ? "#bf4624" : C.coral500,
                          paddingHorizontal:12, paddingVertical:7, borderRadius:14,
                          flexDirection:"row", alignItems:"center", gap:5,
                        })}>
                        <Ionicons name="person-add" size={13} color="white"/>
                        <Text style={{ color:"white", fontSize:12, fontWeight:"600" }}>Añadir</Text>
                      </Pressable>
                    )}
                  </View>
                );
              }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
