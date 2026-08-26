import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useApp } from "../lib/app-context";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal500:"#1d9e87", teal300:"#6dcfc0", teal100:"#d4f0eb", teal50:"#edf8f6",
  coral500:"#d4522a", coral300:"#e8967e", coral50:"#fdf4f1",
  cream:"#f7f5f0", white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)", borderMd:"rgba(28,43,38,0.16)",
  success:"#1a7a69", danger:"#c8241a",
};

function validatePassword(pwd) {
  if(!pwd) return { valid:false, msg:"La contraseña es obligatoria" };
  if(pwd.length < 8) return { valid:false, msg:"Debe tener al menos 8 caracteres" };
  if(!/[\d\W_]/.test(pwd)) return { valid:false, msg:"Debe incluir un número o un símbolo" };
  return { valid:true };
}

export default function Login() {
  const { reloadProfile }                     = useApp();
  const [mode, setMode]                       = useState("login"); // "login" | "register"
  const [email, setEmail]                     = useState("");
  const [username, setUsername]               = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ageConfirmed, setAgeConfirmed]       = useState(false);
  const [colegiado, setColegiado]             = useState("");
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState(null);
  const [success, setSuccess]                 = useState(null);

  // Verificación por código de 6 dígitos
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [code, setCode]                 = useState("");
  const [resendIn, setResendIn]         = useState(0); // segundos de bloqueo del botón reenviar

  // Flujo "olvidé mi contraseña"
  const [forgotMode, setForgotMode]       = useState(false);
  const [forgotStep, setForgotStep]       = useState("email"); // "email" | "verify" | "newPassword"
  const [forgotEmail, setForgotEmail]     = useState("");
  const [newPassword, setNewPassword]     = useState("");
  const [confirmNew, setConfirmNew]       = useState("");

  useEffect(() => {
    if(resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const passwordCheck  = validatePassword(password);
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const canRegister = email.trim().includes("@")
    && username.trim().length >= 3
    && passwordCheck.valid
    && passwordsMatch
    && ageConfirmed;

  async function handleLogin() {
    setLoading(true); setError(null); setSuccess(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if(error) {
      // Si el email aún no está confirmado, ofrecemos reenviar el código en vez
      // de dejar al usuario bloqueado con un error críptico.
      if(/confirm/i.test(error.message)) {
        await supabase.auth.resend({ type: "signup", email: email.trim() });
        setAwaitingCode(true);
        setResendIn(30);
        setSuccess(`Tu correo aún no está verificado. Te hemos enviado un código a ${email.trim()}.`);
      } else {
        setError(error.message);
      }
    }
    setLoading(false);
  }

  async function handleRegister() {
    setLoading(true); setError(null); setSuccess(null);

    if(!canRegister) {
      setError("Revisa los campos del formulario.");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email:    email.trim(),
      password,
      options: {
        data: {
          username:         username.trim(),
          colegiado_number: colegiado.trim() || null,
          age_confirmed:    true,
        },
      },
    });
    if(signUpError) { setError(signUpError.message); setLoading(false); return; }

    // Supabase, por seguridad, devuelve un usuario con identities vacío cuando el
    // email YA existe y está confirmado (no reenvía nada). Lo tratamos como tal.
    if(data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setError("Ese correo ya tiene una cuenta. Inicia sesión.");
      setMode("login");
      setLoading(false);
      return;
    }

    // Usuario creado sin confirmar: pasamos a la pantalla del código.
    setCode("");
    setAwaitingCode(true);
    setResendIn(30);
    setSuccess(`Te hemos enviado un código de 6 dígitos a ${email.trim()}.`);
    setLoading(false);
  }

  async function handleVerifyCode() {
    setLoading(true); setError(null); setSuccess(null);

    const token = code.trim();
    if(token.length !== 6) {
      setError("El código tiene 6 dígitos.");
      setLoading(false);
      return;
    }

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type:  "signup",
    });
    if(verifyError) { setError("Código incorrecto o caducado. Revísalo o pide uno nuevo."); setLoading(false); return; }

    // Ya hay sesión: creamos el perfil (mismo insert de siempre, ahora con auth.uid()
    // disponible para las políticas RLS). upsert evita duplicar si ya existiera.
    const user = data.user || (await supabase.auth.getUser()).data.user;
    if(user) {
      const cleanUsername = username.trim();
      const { error: profileError } = await supabase.from("profiles").upsert({
        auth_user_id:     user.id,
        username:         cleanUsername,
        full_name:        cleanUsername,
        colegiado_number: colegiado.trim() || null,
        age_confirmed_at: new Date().toISOString(),
      }, { onConflict: "auth_user_id", ignoreDuplicates: true });
      if(profileError) { setError(profileError.message); setLoading(false); return; }
    }

    await reloadProfile(); // refresca el perfil en el layout para que navegue a onboarding
    setLoading(false);
  }

  async function handleResendCode() {
    if(resendIn > 0) return;
    setError(null); setSuccess(null);
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
    if(error) setError(error.message);
    else { setSuccess(`Código reenviado a ${email.trim()}.`); setResendIn(30); }
  }

  function backFromCode() {
    setAwaitingCode(false);
    setCode("");
    setError(null);
    setSuccess(null);
  }

  async function handleForgotSendOtp() {
    const trimmed = forgotEmail.trim();
    if(!trimmed.includes("@")) { setError("Introduce un email válido."); return; }
    setLoading(true); setError(null); setSuccess(null);
    const { error } = await supabase.auth.signInWithOtp({ email: trimmed, options: { shouldCreateUser: false } });
    if(error) { setError("No encontramos ninguna cuenta con ese email."); setLoading(false); return; }
    setForgotStep("verify");
    setResendIn(30);
    setSuccess(`Te hemos enviado un código a ${trimmed}.`);
    setLoading(false);
  }

  async function handleForgotVerifyOtp() {
    const token = code.trim();
    if(token.length !== 6) { setError("El código tiene 6 dígitos."); return; }
    setLoading(true); setError(null); setSuccess(null);
    const { error } = await supabase.auth.verifyOtp({ email: forgotEmail.trim(), token, type: "email" });
    if(error) { setError("Código incorrecto o caducado. Pide uno nuevo."); setLoading(false); return; }
    setForgotStep("newPassword");
    setSuccess(null);
    setLoading(false);
  }

  async function handleForgotResendOtp() {
    if(resendIn > 0) return;
    setError(null); setSuccess(null);
    const { error } = await supabase.auth.signInWithOtp({ email: forgotEmail.trim(), options: { shouldCreateUser: false } });
    if(error) setError(error.message);
    else { setSuccess(`Código reenviado a ${forgotEmail.trim()}.`); setResendIn(30); }
  }

  async function handleSetNewPassword() {
    const pwdCheck = validatePassword(newPassword);
    if(!pwdCheck.valid) { setError(pwdCheck.msg); return; }
    if(newPassword !== confirmNew) { setError("Las contraseñas no coinciden."); return; }
    setLoading(true); setError(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if(error) { setError(error.message); setLoading(false); return; }
    // Sesión activa → el layout detecta usuario y navega al home automáticamente
    setLoading(false);
  }

  function resetForgotFlow() {
    setForgotMode(false);
    setForgotStep("email");
    setForgotEmail("");
    setNewPassword("");
    setConfirmNew("");
    setCode("");
    setError(null);
    setSuccess(null);
  }

  function switchMode(newMode) {
    setMode(newMode);
    setAwaitingCode(false);
    setCode("");
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

            {/* Toggle Login / Registro — oculto durante la verificación y el flujo de recuperar contraseña */}
            {!awaitingCode && !forgotMode && (
            <View style={{ flexDirection:"row", backgroundColor:"white", borderWidth:1, borderColor:C.border, borderRadius:12, padding:4, marginBottom:24, gap:4 }}>
              {[{key:"login",label:"Iniciar sesión"},{key:"register",label:"Crear cuenta"}].map(opt=>(
                <Pressable key={opt.key} onPress={()=>switchMode(opt.key)}
                  style={{ flex:1, paddingVertical:8, borderRadius:8, backgroundColor:mode===opt.key?C.teal600:"transparent", alignItems:"center" }}>
                  <Text style={{ fontSize:13, fontWeight:"500", color:mode===opt.key?"white":C.muted }}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
            )}

            {error && (
              <View style={{ backgroundColor:C.coral50, borderWidth:1, borderColor:C.coral300, borderRadius:8, padding:10, marginBottom:16 }}>
                <Text style={{ fontSize:13, color:C.coral500 }}>{error}</Text>
              </View>
            )}
            {success && (
              <View style={{ backgroundColor:C.teal50, borderWidth:1, borderColor:C.teal300, borderRadius:10, padding:14, marginBottom:16, flexDirection:"row", gap:10 }}>
                <Ionicons name="mail-outline" size={20} color={C.teal600} style={{ marginTop:1 }}/>
                <Text style={{ fontSize:13, color:C.teal600, flex:1, lineHeight:18 }}>{success}</Text>
              </View>
            )}

            {/* Pantalla de verificación por código */}
            {awaitingCode && (
              <View style={{ gap:14 }}>
                <Text style={{ fontFamily:"Georgia", fontSize:20, color:C.ink }}>
                  Verifica tu correo
                </Text>
                <Text style={{ fontSize:13, color:C.muted, lineHeight:19 }}>
                  Escribe el código de 6 dígitos que hemos enviado a{" "}
                  <Text style={{ fontWeight:"700", color:C.ink }}>{email.trim()}</Text>. Revisa también la carpeta de spam.
                </Text>
                <TextInput value={code} onChangeText={t => setCode(t.replace(/\D/g,"").slice(0,6))}
                  placeholder="______"
                  placeholderTextColor={C.muted2}
                  keyboardType="number-pad" maxLength={6} autoFocus
                  style={[styles.input, { fontSize:24, letterSpacing:8, textAlign:"center" }]}/>

                <Pressable onPress={handleVerifyCode}
                  disabled={loading || code.trim().length !== 6}
                  style={({pressed}) => ({
                    backgroundColor: (loading || code.trim().length !== 6) ? C.muted2 : C.teal600,
                    paddingVertical:13, borderRadius:20, alignItems:"center",
                    opacity: pressed ? 0.85 : 1,
                  })}>
                  {loading
                    ? <ActivityIndicator color="white"/>
                    : <Text style={{ color:"white", fontSize:14, fontWeight:"500" }}>Verificar</Text>
                  }
                </Pressable>

                <Pressable onPress={handleResendCode} disabled={resendIn > 0} style={{ alignItems:"center", paddingVertical:6 }}>
                  <Text style={{ fontSize:13, color: resendIn > 0 ? C.muted2 : C.teal600, fontWeight:"600" }}>
                    {resendIn > 0 ? `Reenviar código (${resendIn}s)` : "Reenviar código"}
                  </Text>
                </Pressable>

                <Pressable onPress={backFromCode} style={{ alignItems:"center" }}>
                  <Text style={{ fontSize:12, color:C.muted2 }}>← Usar otro correo</Text>
                </Pressable>
              </View>
            )}

            {!awaitingCode && !forgotMode && (
            <View style={{ gap:12 }}>

              {/* Email */}
              <View>
                <Text style={styles.label}>Email</Text>
                <TextInput value={email} onChangeText={setEmail}
                  placeholder="tu@email.com"
                  placeholderTextColor={C.muted2}
                  keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                  style={styles.input}/>
              </View>

              {/* Nombre de usuario — solo registro */}
              {mode==="register" && (
                <View>
                  <Text style={styles.label}>Nombre de usuario</Text>
                  <TextInput value={username} onChangeText={setUsername}
                    placeholder="Ej. enfermero_garcia"
                    placeholderTextColor={C.muted2}
                    autoCapitalize="none" autoCorrect={false} maxLength={30}
                    style={styles.input}/>
                  <Text style={{ fontSize:11, color:C.muted, marginTop:6, lineHeight:15 }}>
                    Mínimo 3 caracteres. Este nombre será visible para otros usuarios en el ranking.
                  </Text>
                </View>
              )}

              {/* Contraseña */}
              <View>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput value={password} onChangeText={setPassword}
                  placeholder={mode==="register" ? "Mínimo 8 caracteres" : "Tu contraseña"}
                  placeholderTextColor={C.muted2}
                  secureTextEntry
                  style={styles.input}/>
                {mode==="register" && (
                  <Text style={{
                    fontSize:11, marginTop:6, lineHeight:15,
                    color: !password ? C.muted2 : (passwordCheck.valid ? C.success : C.danger),
                  }}>
                    {!password
                      ? "Debe tener al menos 8 caracteres e incluir un número o un símbolo"
                      : (passwordCheck.valid
                          ? "✓ Contraseña válida"
                          : `✗ ${passwordCheck.msg}`)
                    }
                  </Text>
                )}
              </View>

              {/* Olvidé mi contraseña — solo login */}
              {mode==="login" && (
                <Pressable onPress={() => { setForgotEmail(email); setForgotMode(true); setError(null); setSuccess(null); }}
                  style={{ alignSelf:"flex-end", marginTop:4 }}>
                  <Text style={{ fontSize:12, color:C.teal600, fontWeight:"600" }}>Olvidé mi contraseña</Text>
                </Pressable>
              )}

              {/* Repetir contraseña — solo registro */}
              {mode==="register" && (
                <View>
                  <Text style={styles.label}>Repetir contraseña</Text>
                  <TextInput value={confirmPassword} onChangeText={setConfirmPassword}
                    placeholder="Vuelve a escribir la contraseña"
                    placeholderTextColor={C.muted2}
                    secureTextEntry
                    style={styles.input}/>
                  {confirmPassword.length > 0 && (
                    <Text style={{
                      fontSize:11, marginTop:6,
                      color: passwordsMatch ? C.success : C.danger,
                    }}>
                      {passwordsMatch ? "✓ Las contraseñas coinciden" : "✗ Las contraseñas no coinciden"}
                    </Text>
                  )}
                </View>
              )}

              {/* +18 — solo registro */}
              {mode==="register" && (
                <Pressable onPress={() => setAgeConfirmed(v => !v)}
                  style={{ flexDirection:"row", alignItems:"center", gap:10, marginTop:6 }}>
                  <View style={{
                    width:22, height:22, borderRadius:6,
                    borderWidth:2, borderColor: ageConfirmed ? C.teal600 : C.muted2,
                    backgroundColor: ageConfirmed ? C.teal600 : "transparent",
                    alignItems:"center", justifyContent:"center",
                  }}>
                    {ageConfirmed && <Ionicons name="checkmark" size={14} color="white"/>}
                  </View>
                  <Text style={{ fontSize:13, color:C.ink, flex:1 }}>
                    Confirmo que soy mayor de 18 años
                  </Text>
                </Pressable>
              )}

              {/* Colegiado — solo registro */}
              {mode==="register" && (
                <View style={{ borderTopWidth:1, borderTopColor:C.border, paddingTop:18, marginTop:10 }}>
                  <Text style={styles.label}>Número de colegiado</Text>
                  <TextInput value={colegiado} onChangeText={setColegiado}
                    placeholder="Ej. 28/12345"
                    placeholderTextColor={C.muted2}
                    autoCapitalize="characters" autoCorrect={false}
                    style={styles.input}/>
                  <Text style={{ fontSize:11, color:C.muted, marginTop:6, lineHeight:15 }}>
                    Como SmartPills es una aplicación dedicada a profesionales sanitarios, te pedimos tu número de colegiado para poder verificarte. <Text style={{ fontWeight:"700" }}>Es de uso interno y privado: nadie más verá este dato.</Text>
                  </Text>
                  {colegiado.length === 0 ? (
                    <Pressable onPress={() => { /* el campo ya está vacío; visualmente confirma que se salta */ }}
                      style={{ alignSelf:"flex-start", marginTop:10, paddingVertical:6, paddingHorizontal:10, borderRadius:8, backgroundColor:C.teal50, borderWidth:1, borderColor:C.teal100 }}>
                      <Text style={{ fontSize:12, color:C.teal600, fontWeight:"600" }}>
                        Saltar este paso por ahora →
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable onPress={() => setColegiado("")}
                      style={{ alignSelf:"flex-start", marginTop:10 }}>
                      <Text style={{ fontSize:12, color:C.muted2 }}>
                        Borrar y saltar este paso
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Botón principal */}
              <Pressable onPress={mode==="login" ? handleLogin : handleRegister}
                disabled={loading || (mode==="register" && !canRegister)}
                style={({pressed}) => ({
                  marginTop:14,
                  backgroundColor: loading
                    ? C.muted2
                    : (mode==="register" && !canRegister ? C.muted2 : C.teal600),
                  paddingVertical:13, borderRadius:20, alignItems:"center",
                  opacity: pressed ? 0.85 : 1,
                })}>
                {loading
                  ? <ActivityIndicator color="white"/>
                  : <Text style={{ color:"white", fontSize:14, fontWeight:"500" }}>{mode==="login" ? "Entrar" : "Crear cuenta"}</Text>
                }
              </Pressable>
            </View>
            )}

            {/* ── Flujo "Olvidé mi contraseña" ── */}
            {forgotMode && (
              <View style={{ gap:14 }}>

                {forgotStep === "email" && (
                  <>
                    <Text style={{ fontFamily:"Georgia", fontSize:20, color:C.ink }}>Recuperar contraseña</Text>
                    <Text style={{ fontSize:13, color:C.muted, lineHeight:19 }}>
                      Escribe tu email y te enviaremos un código para crear una nueva contraseña.
                    </Text>
                    <View>
                      <Text style={styles.label}>Email</Text>
                      <TextInput value={forgotEmail} onChangeText={setForgotEmail}
                        placeholder="tu@email.com" placeholderTextColor={C.muted2}
                        keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                        style={styles.input}/>
                    </View>
                    <Pressable onPress={handleForgotSendOtp} disabled={loading}
                      style={({pressed}) => ({ backgroundColor: loading ? C.muted2 : C.teal600, paddingVertical:13, borderRadius:20, alignItems:"center", opacity: pressed ? 0.85 : 1 })}>
                      {loading ? <ActivityIndicator color="white"/> : <Text style={{ color:"white", fontSize:14, fontWeight:"500" }}>Enviar código</Text>}
                    </Pressable>
                    <Pressable onPress={resetForgotFlow} style={{ alignItems:"center" }}>
                      <Text style={{ fontSize:12, color:C.muted2 }}>← Volver al inicio de sesión</Text>
                    </Pressable>
                  </>
                )}

                {forgotStep === "verify" && (
                  <>
                    <Text style={{ fontFamily:"Georgia", fontSize:20, color:C.ink }}>Verifica tu correo</Text>
                    <Text style={{ fontSize:13, color:C.muted, lineHeight:19 }}>
                      Escribe el código de 6 dígitos que hemos enviado a{" "}
                      <Text style={{ fontWeight:"700", color:C.ink }}>{forgotEmail.trim()}</Text>.
                    </Text>
                    <TextInput value={code} onChangeText={t => setCode(t.replace(/\D/g,"").slice(0,6))}
                      placeholder="______" placeholderTextColor={C.muted2}
                      keyboardType="number-pad" maxLength={6} autoFocus
                      style={[styles.input, { fontSize:24, letterSpacing:8, textAlign:"center" }]}/>
                    <Pressable onPress={handleForgotVerifyOtp} disabled={loading || code.trim().length !== 6}
                      style={({pressed}) => ({ backgroundColor: (loading || code.trim().length !== 6) ? C.muted2 : C.teal600, paddingVertical:13, borderRadius:20, alignItems:"center", opacity: pressed ? 0.85 : 1 })}>
                      {loading ? <ActivityIndicator color="white"/> : <Text style={{ color:"white", fontSize:14, fontWeight:"500" }}>Verificar</Text>}
                    </Pressable>
                    <Pressable onPress={handleForgotResendOtp} disabled={resendIn > 0} style={{ alignItems:"center", paddingVertical:6 }}>
                      <Text style={{ fontSize:13, color: resendIn > 0 ? C.muted2 : C.teal600, fontWeight:"600" }}>
                        {resendIn > 0 ? `Reenviar código (${resendIn}s)` : "Reenviar código"}
                      </Text>
                    </Pressable>
                    <Pressable onPress={resetForgotFlow} style={{ alignItems:"center" }}>
                      <Text style={{ fontSize:12, color:C.muted2 }}>← Volver al inicio de sesión</Text>
                    </Pressable>
                  </>
                )}

                {forgotStep === "newPassword" && (
                  <>
                    <Text style={{ fontFamily:"Georgia", fontSize:20, color:C.ink }}>Nueva contraseña</Text>
                    <View>
                      <Text style={styles.label}>Nueva contraseña</Text>
                      <TextInput value={newPassword} onChangeText={setNewPassword}
                        placeholder="Mínimo 8 caracteres" placeholderTextColor={C.muted2}
                        secureTextEntry style={styles.input}/>
                      {newPassword.length > 0 && (
                        <Text style={{ fontSize:11, marginTop:6, color: validatePassword(newPassword).valid ? C.success : C.danger }}>
                          {validatePassword(newPassword).valid ? "✓ Contraseña válida" : `✗ ${validatePassword(newPassword).msg}`}
                        </Text>
                      )}
                    </View>
                    <View>
                      <Text style={styles.label}>Confirmar contraseña</Text>
                      <TextInput value={confirmNew} onChangeText={setConfirmNew}
                        placeholder="Repite la contraseña" placeholderTextColor={C.muted2}
                        secureTextEntry style={styles.input}/>
                      {confirmNew.length > 0 && (
                        <Text style={{ fontSize:11, marginTop:6, color: newPassword === confirmNew ? C.success : C.danger }}>
                          {newPassword === confirmNew ? "✓ Las contraseñas coinciden" : "✗ Las contraseñas no coinciden"}
                        </Text>
                      )}
                    </View>
                    <Pressable onPress={handleSetNewPassword} disabled={loading}
                      style={({pressed}) => ({ backgroundColor: loading ? C.muted2 : C.teal600, paddingVertical:13, borderRadius:20, alignItems:"center", opacity: pressed ? 0.85 : 1 })}>
                      {loading ? <ActivityIndicator color="white"/> : <Text style={{ color:"white", fontSize:14, fontWeight:"500" }}>Guardar nueva contraseña</Text>}
                    </Pressable>
                  </>
                )}
              </View>
            )}

            {!awaitingCode && !forgotMode && (
            <Text style={{ textAlign:"center", marginTop:24, fontSize:12, color:C.muted2, lineHeight:18 }}>
              Al registrarte aceptas los{" "}
              <Text style={{ color:C.teal600, fontWeight:"600", textDecorationLine:"underline" }}
                onPress={() => Linking.openURL("https://smartpills-legal.vercel.app/terminos-y-condiciones")}>
                términos y condiciones
              </Text>
              {" "}y la{" "}
              <Text style={{ color:C.teal600, fontWeight:"600", textDecorationLine:"underline" }}
                onPress={() => Linking.openURL("https://smartpills-legal.vercel.app/politica-de-privacidad")}>
                política de privacidad
              </Text>
              {" "}de SmartPills.
            </Text>
            )}
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
