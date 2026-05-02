import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { supabase } from "../lib/supabase";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal500:"#1d9e87", teal300:"#6dcfc0", teal50:"#edf8f6",
  coral500:"#d4522a", coral300:"#e8967e", coral50:"#fdf4f1",
  cream:"#f7f5f0", white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)", borderMd:"rgba(28,43,38,0.16)",
};

export default function Login() {
  const [mode, setMode]         = useState("login"); // "login" | "register"
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);

  async function handleLogin() {
    setLoading(true); setError(null); setSuccess(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if(error) setError(error.message);
    setLoading(false);
  }

  async function handleRegister() {
    setLoading(true); setError(null); setSuccess(null);
    if(!username.trim()) { setError("El nombre de usuario es obligatorio"); setLoading(false); return; }

    const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password });
    if(signUpError) { setError(signUpError.message); setLoading(false); return; }

    if(data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        auth_user_id: data.user.id,
        username:     username.trim(),
        full_name:    username.trim(),
      });
      if(profileError) setError(profileError.message);
      else { setSuccess("¡Cuenta creada! Revisa tu email para confirmar."); setMode("login"); }
    }
    setLoading(false);
  }

  function switchMode(newMode) {
    setMode(newMode);
    setError(null);
    setSuccess(null);
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.cream }} edges={["top","bottom"]}>
      <StatusBar style="light"/>
      <KeyboardAvoidingView behavior={Platform.OS==="ios" ? "padding" : undefined} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={{ flexGrow:1 }} keyboardShouldPersistTaps="handled">

          {/* Cabecera */}
          <View style={{ backgroundColor:C.teal800, paddingHorizontal:24, paddingTop:48, paddingBottom:32, alignItems:"center" }}>
            <Text style={{ fontFamily:"Georgia", fontSize:32, color:"white", marginBottom:8 }}>
              Smart<Text style={{ color:C.teal300 }}>Pills</Text>
            </Text>
            <Text style={{ fontSize:13, color:"rgba(255,255,255,0.55)" }}>
              Actualización sanitaria para profesionales
            </Text>
          </View>

          {/* Formulario */}
          <View style={{ flex:1, paddingHorizontal:24, paddingTop:32, paddingBottom:32 }}>

            {/* Toggle Login / Registro */}
            <View style={{ flexDirection:"row", backgroundColor:"white", borderWidth:1, borderColor:C.border, borderRadius:12, padding:4, marginBottom:24, gap:4 }}>
              {[{key:"login",label:"Iniciar sesión"},{key:"register",label:"Crear cuenta"}].map(opt=>(
                <Pressable key={opt.key} onPress={()=>switchMode(opt.key)}
                  style={{ flex:1, paddingVertical:8, borderRadius:8, backgroundColor:mode===opt.key?C.teal600:"transparent", alignItems:"center" }}>
                  <Text style={{ fontSize:13, fontWeight:"500", color:mode===opt.key?"white":C.muted }}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>

            {error && (
              <View style={{ backgroundColor:C.coral50, borderWidth:1, borderColor:C.coral300, borderRadius:8, padding:10, marginBottom:16 }}>
                <Text style={{ fontSize:13, color:C.coral500 }}>{error}</Text>
              </View>
            )}
            {success && (
              <View style={{ backgroundColor:C.teal50, borderWidth:1, borderColor:C.teal300, borderRadius:8, padding:10, marginBottom:16 }}>
                <Text style={{ fontSize:13, color:C.teal600 }}>{success}</Text>
              </View>
            )}

            <View style={{ gap:12 }}>
              {mode==="register" && (
                <View>
                  <Text style={styles.label}>Nombre de usuario</Text>
                  <TextInput value={username} onChangeText={setUsername}
                    placeholder="enfermero_garcia"
                    placeholderTextColor={C.muted2}
                    autoCapitalize="none" autoCorrect={false}
                    style={styles.input}/>
                </View>
              )}

              <View>
                <Text style={styles.label}>Email</Text>
                <TextInput value={email} onChangeText={setEmail}
                  placeholder="tu@email.com"
                  placeholderTextColor={C.muted2}
                  keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                  style={styles.input}/>
              </View>

              <View>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput value={password} onChangeText={setPassword}
                  placeholder="mínimo 6 caracteres"
                  placeholderTextColor={C.muted2}
                  secureTextEntry
                  style={styles.input}/>
              </View>

              <Pressable onPress={mode==="login"?handleLogin:handleRegister} disabled={loading}
                style={({pressed}) => ({ marginTop:8, backgroundColor:loading?C.muted2:C.teal600, paddingVertical:13, borderRadius:20, alignItems:"center", opacity:pressed?0.85:1 })}>
                {loading
                  ? <ActivityIndicator color="white"/>
                  : <Text style={{ color:"white", fontSize:14, fontWeight:"500" }}>{mode==="login" ? "Entrar" : "Crear cuenta"}</Text>
                }
              </Pressable>
            </View>

            <Text style={{ textAlign:"center", marginTop:24, fontSize:12, color:C.muted2 }}>
              Al registrarte aceptas los términos de uso de SmartPills
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = {
  label: { fontSize:12, fontWeight:"500", color:C.muted, marginBottom:5 },
  input: { width:"100%", paddingHorizontal:14, paddingVertical:11, borderRadius:8, borderWidth:1, borderColor:C.borderMd, fontSize:14, backgroundColor:C.white, color:C.ink },
};
