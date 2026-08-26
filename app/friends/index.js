import { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import UserAvatar from "../../components/UserAvatar";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal500:"#1d9e87", teal300:"#6dcfc0", teal100:"#d4f0eb", teal50:"#edf8f6",
  coral500:"#d4522a", coral100:"#fae8e2", coral50:"#fdf4f1",
  amber500:"#d97706", amber100:"#fef3c7",
  cream:"#f7f5f0", white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)",
};

function capitalize(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : ""; }

export default function FriendsScreen() {
  const router = useRouter();
  const [profileId, setProfileId] = useState(null);
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]); // recibidas (yo soy addressee)
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    setLoading(true);
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if(!user) return;
      const { data:profile } = await supabase
        .from("profiles").select("id").eq("auth_user_id", user.id).single();
      if(!profile) return;
      setProfileId(profile.id);

      // Amistades aceptadas (en cualquier dirección)
      const { data:rels } = await supabase
        .from("friendships").select("*")
        .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)
        .neq("status","blocked");

      const acceptedRels = (rels || []).filter(r => r.status === "accepted");
      const pendingReceived = (rels || []).filter(r => r.status === "pending" && r.addressee_id === profile.id);

      // Sacar IDs de los amigos (la otra cara de cada amistad)
      const friendIds = acceptedRels.map(r => r.requester_id === profile.id ? r.addressee_id : r.requester_id);
      const pendingIds = pendingReceived.map(r => r.requester_id);

      const allIds = [...friendIds, ...pendingIds];
      let profilesMap = {};
      if(allIds.length > 0) {
        const { data:ps } = await supabase
          .from("profiles")
          .select("id, username, full_name, profession, current_league, racha_dias, total_xp, avatar_id")
          .in("id", allIds);
        (ps || []).forEach(p => { profilesMap[p.id] = p; });
      }

      setFriends(friendIds.map(id => profilesMap[id]).filter(Boolean));
      setPending(pendingReceived.map(r => ({ rel: r, profile: profilesMap[r.requester_id] })).filter(p => p.profile));
    } finally {
      setLoading(false);
    }
  }

  async function respondRequest(rel, accept) {
    const newStatus = accept ? "accepted" : "blocked";
    if(accept) {
      await supabase.from("friendships").update({ status:"accepted", updated_at:new Date().toISOString() }).eq("id", rel.id);
    } else {
      // Rechazar = eliminar la fila para no llenar la BD
      await supabase.from("friendships").delete().eq("id", rel.id);
    }
    load();
  }

  async function removeFriend(friendProfileId) {
    Alert.alert(
      "¿Eliminar amistad?",
      "Dejaréis de ver vuestros perfiles y reacciones.",
      [
        { text:"Cancelar", style:"cancel" },
        { text:"Eliminar", style:"destructive", onPress: async () => {
          await supabase.from("friendships").delete()
            .or(`and(requester_id.eq.${profileId},addressee_id.eq.${friendProfileId}),and(requester_id.eq.${friendProfileId},addressee_id.eq.${profileId})`);
          load();
        }},
      ]
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

        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
          <View style={{ flex:1 }}>
            <Text style={{ fontSize:10, fontWeight:"500", letterSpacing:1.4, textTransform:"uppercase", color:C.teal300, marginBottom:4 }}>
              Amigos
            </Text>
            <Text style={{ fontFamily:"Georgia", fontSize:22, color:"white" }}>
              Tu equipo
            </Text>
          </View>
          <Pressable onPress={() => router.push("/friends/search")}
            style={({pressed}) => ({
              backgroundColor: pressed ? "#bf4624" : C.coral500,
              borderRadius:24, paddingHorizontal:16, paddingVertical:10,
              flexDirection:"row", alignItems:"center", gap:6,
            })}>
            <Ionicons name="person-add" size={16} color="white"/>
            <Text style={{ color:"white", fontSize:13, fontWeight:"600" }}>Añadir</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ flex:1, backgroundColor:C.cream }}>
        {loading ? (
          <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
            <ActivityIndicator size="large" color={C.teal600}/>
          </View>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding:14 }}
            ListHeaderComponent={() => (
              <>
                {/* Solicitudes pendientes */}
                {pending.length > 0 && (
                  <View style={{ marginBottom:18 }}>
                    <Text style={{ fontSize:11, fontWeight:"600", letterSpacing:1.2, textTransform:"uppercase", color:C.muted2, marginBottom:8 }}>
                      Solicitudes recibidas ({pending.length})
                    </Text>
                    {pending.map(({ rel, profile }) => (
                      <View key={rel.id} style={{
                        backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:12,
                        padding:12, marginBottom:8, flexDirection:"row", alignItems:"center", gap:10,
                      }}>
                        <UserAvatar
                          avatarId={profile.avatar_id}
                          initials={(profile.username || "?").charAt(0).toUpperCase()}
                          size={42}
                          color={C.teal50}
                          initialsStyle={{ fontFamily:"Georgia", fontSize:18, color:C.teal600 }}
                        />
                        <View style={{ flex:1, minWidth:0 }}>
                          <Text style={{ fontSize:14, fontWeight:"600", color:C.ink }}>{profile.full_name || profile.username}</Text>
                          <Text style={{ fontSize:11, color:C.muted2 }}>
                            {profile.username ? `@${profile.username} · ` : ""}{capitalize(profile.profession)}
                          </Text>
                        </View>
                        <Pressable onPress={() => respondRequest(rel, true)}
                          style={({pressed}) => ({ backgroundColor:C.teal600, paddingHorizontal:10, paddingVertical:7, borderRadius:14, opacity:pressed?0.85:1 })}>
                          <Ionicons name="checkmark" size={16} color="white"/>
                        </Pressable>
                        <Pressable onPress={() => respondRequest(rel, false)}
                          style={({pressed}) => ({ backgroundColor:"#e6e6e6", paddingHorizontal:10, paddingVertical:7, borderRadius:14, opacity:pressed?0.85:1 })}>
                          <Ionicons name="close" size={16} color={C.coral500}/>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}

                {/* Etiqueta lista de amigos */}
                {friends.length > 0 && (
                  <Text style={{ fontSize:11, fontWeight:"600", letterSpacing:1.2, textTransform:"uppercase", color:C.muted2, marginBottom:8 }}>
                    Amigos ({friends.length})
                  </Text>
                )}
              </>
            )}
            ListEmptyComponent={() => pending.length === 0 ? (
              <View style={{ alignItems:"center", paddingVertical:60, paddingHorizontal:24 }}>
                <Text style={{ fontSize:42, marginBottom:14 }}>🤝</Text>
                <Text style={{ fontFamily:"Georgia", fontSize:17, color:C.ink, marginBottom:6, textAlign:"center" }}>
                  Aún no tienes amigos en SmartPills
                </Text>
                <Text style={{ fontSize:13, color:C.muted2, textAlign:"center", lineHeight:18 }}>
                  Pulsa "Añadir" arriba para buscarlos por nombre de usuario o email.
                </Text>
              </View>
            ) : null}
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/friends/${item.id}`)}
                onLongPress={() => removeFriend(item.id)}
                style={({pressed}) => ({
                  backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:12,
                  padding:12, marginBottom:8, flexDirection:"row", alignItems:"center", gap:12,
                  opacity: pressed ? 0.85 : 1,
                })}>
                <UserAvatar
                  avatarId={item.avatar_id}
                  initials={(item.username || "?").charAt(0).toUpperCase()}
                  size={48}
                  color={C.teal50}
                  initialsStyle={{ fontFamily:"Georgia", fontSize:20, color:C.teal600 }}
                />
                <View style={{ flex:1, minWidth:0 }}>
                  <Text style={{ fontSize:14, fontWeight:"600", color:C.ink }}>{item.full_name || item.username}</Text>
                  <Text style={{ fontSize:11, color:C.muted2, marginTop:2 }}>
                    {item.username ? `@${item.username} · ` : ""}{capitalize(item.profession)}
                  </Text>
                  <View style={{ flexDirection:"row", gap:10, marginTop:6 }}>
                    <Text style={{ fontSize:11, color:C.amber500, fontWeight:"600" }}>{item.racha_dias || 0} 🔥</Text>
                    <Text style={{ fontSize:11, color:C.teal600, fontWeight:"600" }}>{item.current_league || "Estudiantes"}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.muted2}/>
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
