import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView, Image, Modal, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal500:"#1d9e87", teal300:"#6dcfc0", teal50:"#edf8f6",
  coral500:"#d4522a", coral100:"#fae8e2", coral50:"#fdf4f1",
  amber500:"#d97706",
  cream:"#f7f5f0", white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)",
  danger:"#c8241a", success:"#1a7a69",
};

function capitalize(text) {
  if(!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function StatRow({ label, value, color }) {
  return (
    <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingVertical:10, borderBottomWidth:1, borderBottomColor:C.border }}>
      <Text style={{ fontSize:13, color:C.muted2 }}>{label}</Text>
      <Text style={{ fontSize:14, fontWeight:"500", color: color || C.ink }}>{value || "—"}</Text>
    </View>
  );
}

export default function Profile() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if(!user) return;
      setEmail(user.email);
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();
      setProfile(data);
    } catch(err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  async function togglePersonalized() {
    if(!profile?.id) return;
    const newValue = !(profile.personalized_feed_enabled !== false);
    setProfile(p => ({ ...p, personalized_feed_enabled: newValue }));
    const { error } = await supabase.from("profiles")
      .update({ personalized_feed_enabled: newValue })
      .eq("id", profile.id);
    if(error) {
      // revertir si falla
      setProfile(p => ({ ...p, personalized_feed_enabled: !newValue }));
      Alert.alert("Error", "No se pudo guardar el cambio. Inténtalo de nuevo.");
    }
  }

  async function toggleEmailSearch() {
    if(!profile?.id) return;
    const newValue = !(profile.allow_email_search === true);
    setProfile(p => ({ ...p, allow_email_search: newValue }));
    const { error } = await supabase.from("profiles")
      .update({ allow_email_search: newValue })
      .eq("id", profile.id);
    if(error) {
      setProfile(p => ({ ...p, allow_email_search: !newValue }));
      Alert.alert("Error", "No se pudo guardar el cambio. Inténtalo de nuevo.");
    }
  }

  async function handleDeleteAccount() {
    if(!profile?.id) return;
    setDeleting(true);
    try {
      // 1. Borrar reacciones del usuario (likes/dislikes)
      await supabase.from("reel_reactions").delete().eq("user_id", profile.id);

      // 2. Borrar contenido guardado (botiquín)
      await supabase.from("user_saved_content").delete().eq("user_id", profile.id);

      // 3. Borrar el perfil — el trigger en Supabase elimina también auth.users
      const { error } = await supabase.from("profiles").delete().eq("id", profile.id);
      if(error) throw error;

      // 4. Cerrar sesión por si la cuenta auth tarda en propagarse
      await supabase.auth.signOut();

      // 5. Navegar a login (el _layout detectará que no hay sesión)
      setShowDeleteModal(false);
    } catch(err) {
      setDeleting(false);
      Alert.alert("Error al eliminar la cuenta", err.message || "Inténtalo de nuevo en unos minutos.");
    }
  }

  if(loading) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor:C.cream, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator size="large" color={C.teal600}/>
      </SafeAreaView>
    );
  }

  const initials = (profile?.username || profile?.full_name || email || "?").charAt(0).toUpperCase();

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.teal800 }} edges={["top"]}>
      <StatusBar style="light"/>
      <ScrollView style={{ backgroundColor:C.cream }} contentContainerStyle={{ flexGrow:1 }}>

        <View style={{ backgroundColor:C.teal800, paddingHorizontal:24, paddingTop:24, paddingBottom:32, alignItems:"center" }}>
          <Text style={{ fontFamily:"Georgia", fontSize:18, color:"white", alignSelf:"flex-start", marginBottom:20 }}>
            Smart<Text style={{ color:C.teal300 }}>Pills</Text>
          </Text>
          <View style={{ width:72, height:72, borderRadius:36, backgroundColor:"rgba(255,255,255,0.15)", borderWidth:2, borderColor:"rgba(255,255,255,0.3)", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
            <Text style={{ fontFamily:"Georgia", fontSize:28, color:"white" }}>{initials}</Text>
          </View>
          <Text style={{ fontFamily:"Georgia", fontSize:20, color:"white", marginBottom:4 }}>
            {profile?.full_name || profile?.username || "Mi perfil"}
          </Text>
          <Text style={{ fontSize:12, color:"rgba(255,255,255,0.55)" }}>
            {capitalize(profile?.profession) || "Profesión no definida"}
          </Text>
        </View>

        <View style={{ padding:20 }}>

          {/* Mi Botiquín */}
          <Pressable onPress={() => router.push("/saved")}
            style={({pressed}) => ({
              backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:12,
              padding:14, marginBottom:12, flexDirection:"row", alignItems:"center", gap:12,
              opacity: pressed ? 0.85 : 1,
            })}>
            <View style={{ width:44, height:44, borderRadius:22, backgroundColor:C.teal50, alignItems:"center", justifyContent:"center" }}>
              <Image source={require("../../assets/pildo-botiquin.png")} style={{ width:57, height:57 }} resizeMode="contain"/>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ fontSize:15, fontWeight:"500", color:C.ink, marginBottom:2 }}>Mi Botiquín</Text>
              <Text style={{ fontSize:12, color:C.muted2 }}>Artículos, noticias y guías guardadas</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted2}/>
          </Pressable>

          {/* Amigos */}
          <Pressable onPress={() => router.push("/friends")}
            style={({pressed}) => ({
              backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:12,
              padding:14, marginBottom:12, flexDirection:"row", alignItems:"center", gap:12,
              opacity: pressed ? 0.85 : 1,
            })}>
            <View style={{ width:44, height:44, borderRadius:22, backgroundColor:C.teal50, alignItems:"center", justifyContent:"center" }}>
              <Image
                source={{ uri:"https://utzwotmcocrrkldhcknd.supabase.co/storage/v1/object/public/assets/Pildo%20amistadd.PNG" }}
                style={{ width:57, height:57 }}
                resizeMode="contain"/>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ fontSize:15, fontWeight:"500", color:C.ink, marginBottom:2 }}>Amigos</Text>
              <Text style={{ fontSize:12, color:C.muted2 }}>Tu equipo y solicitudes pendientes</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted2}/>
          </Pressable>

          {/* Panel admin (solo si es admin) */}
          {profile?.is_admin && (
            <Pressable onPress={() => router.push("/admin")}
              style={({pressed}) => ({
                backgroundColor:C.teal800, borderRadius:12,
                padding:14, marginBottom:20, flexDirection:"row", alignItems:"center", gap:12,
                opacity: pressed ? 0.9 : 1,
              })}>
              <View style={{ width:44, height:44, borderRadius:22, backgroundColor:"rgba(255,255,255,0.12)", alignItems:"center", justifyContent:"center" }}>
                <Ionicons name="construct" size={22} color="white"/>
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:15, fontWeight:"600", color:"white", marginBottom:2 }}>Panel admin</Text>
                <Text style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>Guías, pills e infografías</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)"/>
            </Pressable>
          )}

          <Text style={{ fontSize:11, fontWeight:"500", letterSpacing:1.2, textTransform:"uppercase", color:C.muted2, marginBottom:8 }}>
            Tu perfil
          </Text>
          <View style={{ backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:12, padding:16, marginBottom:20 }}>
            <StatRow label="Nombre"      value={profile?.full_name}/>
            <StatRow label="Usuario"     value={profile?.username}/>
            <StatRow label="Email"       value={email}/>
            <StatRow label="Profesión"   value={capitalize(profile?.profession)}/>
            <StatRow label="Especialidad" value={profile?.specialty}/>
            <StatRow label="Centro"      value={profile?.workplace}/>
            <StatRow label="Provincia"   value={profile?.city}/>
          </View>

          {/* Privacidad / Personalización */}
          <Text style={{ fontSize:11, fontWeight:"500", letterSpacing:1.2, textTransform:"uppercase", color:C.muted2, marginBottom:8 }}>
            Privacidad
          </Text>
          <View style={{ backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:12, padding:14, marginBottom:20 }}>
            <View style={{ flexDirection:"row", alignItems:"center", gap:12 }}>
              <View style={{ width:40, height:40, borderRadius:20, backgroundColor:C.teal50, alignItems:"center", justifyContent:"center" }}>
                <Ionicons name="sparkles-outline" size={20} color={C.teal600}/>
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:14, fontWeight:"600", color:C.ink, marginBottom:2 }}>
                  Recomendar contenido a mi medida
                </Text>
                <Text style={{ fontSize:11, color:C.muted2, lineHeight:15 }}>
                  Usamos tus likes y dislikes para mostrarte primero contenido de las categorías que más te interesan.
                </Text>
              </View>
              <Pressable onPress={togglePersonalized}
                style={{
                  width:48, height:28, borderRadius:14, padding:2,
                  backgroundColor: profile?.personalized_feed_enabled !== false ? C.teal600 : "#cfd6d2",
                  justifyContent:"center",
                }}>
                <View style={{
                  width:24, height:24, borderRadius:12, backgroundColor:"white",
                  alignSelf: profile?.personalized_feed_enabled !== false ? "flex-end" : "flex-start",
                }}/>
              </Pressable>
            </View>

            <View style={{ height:1, backgroundColor:C.border, marginVertical:14 }}/>

            <View style={{ flexDirection:"row", alignItems:"center", gap:12 }}>
              <View style={{ width:40, height:40, borderRadius:20, backgroundColor:C.teal50, alignItems:"center", justifyContent:"center" }}>
                <Ionicons name="mail-outline" size={20} color={C.teal600}/>
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:14, fontWeight:"600", color:C.ink, marginBottom:2 }}>
                  Permitir que me encuentren por email
                </Text>
                <Text style={{ fontSize:11, color:C.muted2, lineHeight:15 }}>
                  Si lo activas, otros usuarios podrán encontrarte buscando tu email para enviarte solicitud de amistad.
                </Text>
              </View>
              <Pressable onPress={toggleEmailSearch}
                style={{
                  width:48, height:28, borderRadius:14, padding:2,
                  backgroundColor: profile?.allow_email_search === true ? C.teal600 : "#cfd6d2",
                  justifyContent:"center",
                }}>
                <View style={{
                  width:24, height:24, borderRadius:12, backgroundColor:"white",
                  alignSelf: profile?.allow_email_search === true ? "flex-end" : "flex-start",
                }}/>
              </Pressable>
            </View>
          </View>

          <Text style={{ fontSize:11, fontWeight:"500", letterSpacing:1.2, textTransform:"uppercase", color:C.muted2, marginBottom:8 }}>
            Stats
          </Text>
          <View style={{ backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:12, padding:16, marginBottom:24 }}>
            <StatRow label="XP total"      value={profile?.total_xp ?? 0} color={C.teal600}/>
            <StatRow label="XP esta semana" value={profile?.weekly_xp ?? 0} color={C.amber500}/>
            <StatRow label="Liga actual"    value={profile?.current_league || "Estudiantes"} color={C.teal600}/>
            <StatRow label="Racha"          value={`${profile?.racha_dias ?? 0} días 🔥`}/>
          </View>

          <Pressable onPress={handleLogout}
            style={({pressed}) => ({ alignSelf:"center", backgroundColor:C.coral50, borderWidth:1, borderColor:C.coral100, borderRadius:20, paddingHorizontal:28, paddingVertical:10, opacity:pressed?0.85:1 })}>
            <Text style={{ fontSize:13, fontWeight:"500", color:C.coral500 }}>Cerrar sesión</Text>
          </Pressable>

          {/* Eliminar cuenta — abajo a la derecha, en rojo */}
          <Pressable onPress={() => setShowDeleteModal(true)}
            style={({pressed}) => ({
              alignSelf:"flex-end", marginTop:24, paddingHorizontal:8, paddingVertical:6,
              flexDirection:"row", alignItems:"center", gap:6,
              opacity: pressed ? 0.6 : 1,
            })}>
            <Ionicons name="ban-outline" size={16} color={C.danger}/>
            <Text style={{ fontSize:13, fontWeight:"600", color:C.danger }}>Eliminar cuenta</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Modal de doble confirmación */}
      <Modal visible={showDeleteModal} transparent animationType="fade"
        onRequestClose={() => !deleting && setShowDeleteModal(false)}>
        <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.55)", justifyContent:"center", padding:24 }}>
          <View style={{ backgroundColor:C.white, borderRadius:18, padding:24 }}>
            <View style={{ alignItems:"center", marginBottom:16 }}>
              <View style={{ width:56, height:56, borderRadius:28, backgroundColor:"#fde7e5", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
                <Ionicons name="ban" size={28} color={C.danger}/>
              </View>
              <Text style={{ fontFamily:"Georgia", fontSize:18, color:C.ink, textAlign:"center", lineHeight:24 }}>
                ¿Estás seguro de que quieres eliminar la cuenta para siempre?
              </Text>
              <Text style={{ fontSize:13, color:C.muted, textAlign:"center", marginTop:10, lineHeight:18 }}>
                Esta acción borrará todos tus datos (perfil, racha, XP, reacciones y contenido guardado) y no se puede deshacer.
              </Text>
            </View>

            {deleting ? (
              <View style={{ alignItems:"center", paddingVertical:14 }}>
                <ActivityIndicator size="large" color={C.danger}/>
                <Text style={{ fontSize:12, color:C.muted, marginTop:10 }}>Eliminando tu cuenta…</Text>
              </View>
            ) : (
              <View style={{ flexDirection:"row", gap:10, marginTop:8 }}>
                <Pressable onPress={handleDeleteAccount}
                  style={({pressed}) => ({
                    flex:1, backgroundColor:C.danger, borderRadius:12, paddingVertical:13,
                    alignItems:"center", opacity: pressed ? 0.85 : 1,
                  })}>
                  <Text style={{ fontSize:13, fontWeight:"700", color:"white" }}>Sí, eliminar</Text>
                </Pressable>
                <Pressable onPress={() => setShowDeleteModal(false)}
                  style={({pressed}) => ({
                    flex:1, backgroundColor:C.success, borderRadius:12, paddingVertical:13,
                    alignItems:"center", opacity: pressed ? 0.85 : 1,
                  })}>
                  <Text style={{ fontSize:13, fontWeight:"700", color:"white" }}>No, volver a la app</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
