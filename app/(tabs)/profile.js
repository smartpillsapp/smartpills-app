import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView, Image, Modal, Alert, Linking, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import UserAvatar from "../../components/UserAvatar";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal500:"#1d9e87", teal300:"#6dcfc0", teal100:"#d4f0eb", teal50:"#edf8f6",
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

const LEGAL_LINKS = [
  { key:"privacy",  label:"Política de privacidad",   url:"https://smartpills-legal.vercel.app/politica-de-privacidad" },
  { key:"terms",    label:"Términos y condiciones",   url:"https://smartpills-legal.vercel.app/terminos-y-condiciones" },
  { key:"legal",    label:"Aviso legal",              url:"https://smartpills-legal.vercel.app/aviso-legal" },
];

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

  // Editar perfil
  const [showEditModal, setShowEditModal]   = useState(false);
  const [editName, setEditName]             = useState("");
  const [editProfession, setEditProfession] = useState("");
  const [editSpecialty, setEditSpecialty]   = useState("");
  const [editWorkplace, setEditWorkplace]   = useState("");
  const [editCity, setEditCity]             = useState("");
  const [editAvatarId, setEditAvatarId]     = useState(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saving, setSaving]                 = useState(false);

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

  async function toggleStreakNotifications() {
    if(!profile?.id) return;
    const newValue = !(profile.streak_notifications_enabled !== false);
    setProfile(p => ({ ...p, streak_notifications_enabled: newValue }));
    const { error } = await supabase.from("profiles")
      .update({ streak_notifications_enabled: newValue })
      .eq("id", profile.id);
    if(error) {
      setProfile(p => ({ ...p, streak_notifications_enabled: !newValue }));
      Alert.alert("Error", "No se pudo guardar el cambio. Inténtalo de nuevo.");
    }
  }

  function openEditModal() {
    setEditName(profile?.full_name || "");
    setEditProfession(profile?.profession || "");
    setEditSpecialty(profile?.specialty || "");
    setEditWorkplace(profile?.workplace || "");
    setEditCity(profile?.city || "");
    setEditAvatarId(profile?.avatar_id || null);
    setShowEditModal(true);
  }

  async function handleSaveProfile() {
    if(!profile?.id) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name:  editName.trim() || null,
      profession: editProfession.trim() || null,
      specialty:  editSpecialty.trim() || null,
      workplace:  editWorkplace.trim() || null,
      city:       editCity.trim() || null,
      avatar_id:  editAvatarId || null,
    }).eq("id", profile.id);
    setSaving(false);
    if(error) { Alert.alert("Error", "No se pudo guardar. Inténtalo de nuevo."); return; }
    setProfile(p => ({ ...p, full_name: editName.trim(), profession: editProfession.trim(), specialty: editSpecialty.trim(), workplace: editWorkplace.trim(), city: editCity.trim(), avatar_id: editAvatarId || null }));
    setShowEditModal(false);
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
          <UserAvatar
            avatarId={profile?.avatar_id}
            initials={initials}
            size={94}
            color="rgba(255,255,255,0.15)"
            containerStyle={{ marginBottom:12, borderWidth:2, borderColor:"rgba(255,255,255,0.3)" }}
            initialsStyle={{ fontFamily:"Georgia", fontSize:34, color:"white" }}
          />
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

          <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <Text style={{ fontSize:11, fontWeight:"500", letterSpacing:1.2, textTransform:"uppercase", color:C.muted2 }}>
              Tu perfil
            </Text>
            <Pressable onPress={openEditModal}
              style={({pressed}) => ({ backgroundColor:C.teal50, borderWidth:1, borderColor:C.teal100, borderRadius:20, paddingHorizontal:14, paddingVertical:6, opacity:pressed?0.85:1 })}>
              <Text style={{ fontSize:11, fontWeight:"600", color:C.teal600 }}>Editar perfil</Text>
            </Pressable>
          </View>
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

            <View style={{ height:1, backgroundColor:C.border, marginVertical:14 }}/>

            <View style={{ flexDirection:"row", alignItems:"center", gap:12 }}>
              <View style={{ width:40, height:40, borderRadius:20, backgroundColor:C.teal50, alignItems:"center", justifyContent:"center" }}>
                <Ionicons name="notifications-outline" size={20} color={C.teal600}/>
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:14, fontWeight:"600", color:C.ink, marginBottom:2 }}>
                  Recordarme mi racha a las 20:30
                </Text>
                <Text style={{ fontSize:11, color:C.muted2, lineHeight:15 }}>
                  Te enviaremos una notificación cuando no hayas hecho aún el test del día.
                </Text>
              </View>
              <Pressable onPress={toggleStreakNotifications}
                style={{
                  width:48, height:28, borderRadius:14, padding:2,
                  backgroundColor: profile?.streak_notifications_enabled !== false ? C.teal600 : "#cfd6d2",
                  justifyContent:"center",
                }}>
                <View style={{
                  width:24, height:24, borderRadius:12, backgroundColor:"white",
                  alignSelf: profile?.streak_notifications_enabled !== false ? "flex-end" : "flex-start",
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

          {/* Información legal */}
          <Text style={{ fontSize:11, fontWeight:"500", letterSpacing:1.2, textTransform:"uppercase", color:C.muted2, marginBottom:8 }}>
            Información legal
          </Text>
          <View style={{ backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:12, marginBottom:24, overflow:"hidden" }}>
            {LEGAL_LINKS.map((item, idx) => (
              <Pressable key={item.key} onPress={() => Linking.openURL(item.url)}
                style={({pressed}) => ({
                  flexDirection:"row", alignItems:"center", paddingHorizontal:14, paddingVertical:14,
                  borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: C.border,
                  backgroundColor: pressed ? C.teal50 : "transparent",
                })}>
                <Ionicons name="document-text-outline" size={18} color={C.teal600} style={{ marginRight:12 }}/>
                <Text style={{ flex:1, fontSize:14, color:C.ink }}>{item.label}</Text>
                <Ionicons name="open-outline" size={16} color={C.muted2}/>
              </Pressable>
            ))}
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

      {/* Modal editar perfil */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => !saving && setShowEditModal(false)}>
        <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.45)", justifyContent:"flex-end" }}>
          <View style={{ backgroundColor:C.cream, borderTopLeftRadius:20, borderTopRightRadius:20, padding:24, paddingBottom:40 }}>
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <Text style={{ fontFamily:"Georgia", fontSize:20, color:C.ink }}>Editar perfil</Text>
              <Pressable onPress={() => setShowEditModal(false)}>
                <Text style={{ fontSize:13, color:C.muted2 }}>Cancelar</Text>
              </Pressable>
            </View>
            {/* Selector de foto de perfil */}
            <Pressable onPress={() => setShowAvatarPicker(true)}
              style={{ alignItems:"center", marginBottom:20 }}>
              <UserAvatar
                avatarId={editAvatarId}
                initials={initials}
                size={94}
                color="rgba(28,43,38,0.08)"
                containerStyle={{ borderWidth:2, borderColor: editAvatarId ? C.teal600 : C.border }}
                initialsStyle={{ fontFamily:"Georgia", fontSize:34, color:C.teal600 }}
              />
              <View style={{ marginTop:10, backgroundColor:C.teal50, borderWidth:1, borderColor:C.teal100, borderRadius:20, paddingHorizontal:18, paddingVertical:7 }}>
                <Text style={{ fontSize:12, color:C.teal600, fontWeight:"600" }}>
                  {editAvatarId ? "Cambiar foto" : "Elegir foto de perfil"}
                </Text>
              </View>
            </Pressable>

            {[
              { label:"Nombre", value:editName, setter:setEditName, placeholder:"Tu nombre completo" },
              { label:"Profesión", value:editProfession, setter:setEditProfession, placeholder:"Ej. enfermería" },
              { label:"Especialidad", value:editSpecialty, setter:setEditSpecialty, placeholder:"Ej. pediatría" },
              { label:"Centro", value:editWorkplace, setter:setEditWorkplace, placeholder:"Hospital o centro de salud" },
              { label:"Provincia", value:editCity, setter:setEditCity, placeholder:"Ej. Asturias" },
            ].map(field => (
              <View key={field.label} style={{ marginBottom:14 }}>
                <Text style={{ fontSize:11, fontWeight:"500", color:C.muted, marginBottom:5 }}>{field.label.toUpperCase()}</Text>
                <TextInput
                  value={field.value}
                  onChangeText={field.setter}
                  placeholder={field.placeholder}
                  placeholderTextColor={C.muted2}
                  style={{ backgroundColor:C.white, borderWidth:1, borderColor:"rgba(28,43,38,0.16)", borderRadius:8, paddingHorizontal:14, paddingVertical:10, fontSize:14, color:C.ink }}
                />
              </View>
            ))}
            <Pressable onPress={handleSaveProfile} disabled={saving}
              style={({pressed}) => ({ marginTop:8, backgroundColor: saving ? C.muted2 : C.teal600, paddingVertical:13, borderRadius:20, alignItems:"center", opacity: pressed ? 0.85 : 1 })}>
              {saving ? <ActivityIndicator color="white"/> : <Text style={{ color:"white", fontSize:14, fontWeight:"500" }}>Guardar cambios</Text>}
            </Pressable>
          </View>

          {/* Selector de avatar — dentro del modal de edición para que aparezca encima en iOS */}
          {showAvatarPicker && (
            <View style={{ position:"absolute", top:0, left:0, right:0, bottom:0, backgroundColor:"rgba(0,0,0,0.6)", justifyContent:"center", alignItems:"center", padding:24 }}>
              <View style={{ backgroundColor:C.cream, borderRadius:20, padding:20, width:"100%" }}>
                <Text style={{ fontFamily:"Georgia", fontSize:18, color:C.ink, marginBottom:4, textAlign:"center" }}>
                  Tu foto de perfil
                </Text>
                <Text style={{ fontSize:12, color:C.muted2, marginBottom:20, textAlign:"center" }}>
                  Elige uno de los avatares disponibles
                </Text>
                <View style={{ flexDirection:"row", flexWrap:"wrap", gap:12, justifyContent:"center" }}>
                  {Array.from({length:12}, (_,i) => i+1).map(n => (
                    <Pressable key={n} onPress={() => { setEditAvatarId(n); setShowAvatarPicker(false); }}
                      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
                      <UserAvatar
                        avatarId={n}
                        initials={String(n)}
                        size={64}
                        containerStyle={{
                          borderWidth: editAvatarId === n ? 3 : 1.5,
                          borderColor: editAvatarId === n ? C.teal600 : C.border,
                        }}
                      />
                    </Pressable>
                  ))}
                </View>
                {editAvatarId ? (
                  <Pressable onPress={() => { setEditAvatarId(null); setShowAvatarPicker(false); }}
                    style={{ marginTop:18, alignItems:"center", paddingVertical:8 }}>
                    <Text style={{ fontSize:13, color:C.muted2 }}>Quitar foto de perfil</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => setShowAvatarPicker(false)}
                  style={{ marginTop:8, alignItems:"center", paddingVertical:8 }}>
                  <Text style={{ fontSize:13, color:C.muted, fontWeight:"500" }}>Cancelar</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>

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
