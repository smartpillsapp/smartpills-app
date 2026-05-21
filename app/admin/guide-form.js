import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../lib/supabase";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal300:"#6dcfc0", teal50:"#edf8f6",
  coral500:"#d4522a", coral100:"#fae8e2",
  cream:"#f7f5f0",
  white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)", borderMd:"rgba(28,43,38,0.16)",
  langEnglish:"#4169E1", langSpanish:"#800000",
};

const BUCKET = "guide-images";

export default function GuideForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEdit = !!id;

  const [loading, setLoading]   = useState(isEdit);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUpload]  = useState(false);

  const [titulo, setTitulo]               = useState("");
  const [sociedad, setSociedad]           = useState("");
  const [idioma, setIdioma]               = useState("ingles");
  const [especialidades, setEspecialidades] = useState("");
  const [url, setUrl]                     = useState("");
  const [imagen, setImagen]               = useState("");
  const [resumen, setResumen]             = useState("");

  useEffect(() => { if(isEdit) load(); }, [id]);

  async function load() {
    const { data, error } = await supabase.from("clinical_guides_v2")
      .select("*").eq("id", id).single();
    if(error) {
      Alert.alert("Error", error.message);
      setLoading(false);
      return;
    }
    setTitulo(data.titulo || "");
    setSociedad(data.sociedad || "");
    setIdioma(data.idioma || "ingles");
    setEspecialidades((data.especialidades || []).join(", "));
    setUrl(data.url || "");
    setImagen(data.imagen || "");
    setResumen(data.resumen || "");
    setLoading(false);
  }

  async function pickAndUploadImage() {
    // Pedir permisos
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if(!perm.granted) {
      Alert.alert("Permiso necesario", "Necesitamos acceso a tu galería para subir imágenes.");
      return;
    }

    // Abrir galería
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:    ["images"],
      allowsEditing: true,
      quality:       0.8,
    });
    if(result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setUpload(true);
    try {
      // Subir a Supabase Storage
      const ext      = asset.uri.split(".").pop().toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const response = await fetch(asset.uri);
      const blob     = await response.blob();
      const arrayBuf = await new Response(blob).arrayBuffer();

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, arrayBuf, { contentType: blob.type || `image/${ext}` });

      if(upErr) throw upErr;

      // Obtener URL pública
      const { data:{ publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
      setImagen(publicUrl);
    } catch(err) {
      Alert.alert("Error subiendo imagen", err.message || String(err));
    } finally {
      setUpload(false);
    }
  }

  async function handleSave() {
    if(!titulo.trim() || !sociedad.trim() || !url.trim()) {
      Alert.alert("Campos obligatorios", "Título, sociedad y URL son obligatorios.");
      return;
    }
    setSaving(true);
    const espArr = especialidades
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      titulo:         titulo.trim(),
      sociedad:       sociedad.trim(),
      idioma,
      especialidades: espArr,
      url:            url.trim(),
      imagen:         imagen.trim() || null,
      resumen:        resumen.trim() || null,
      updated_at:     new Date().toISOString(),
    };

    let error;
    if(isEdit) {
      ({ error } = await supabase.from("clinical_guides_v2").update(payload).eq("id", id));
    } else {
      ({ error } = await supabase.from("clinical_guides_v2").insert(payload));
    }
    setSaving(false);

    if(error) {
      Alert.alert("Error al guardar", error.message);
    } else {
      router.back();
    }
  }

  if(loading) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor:C.cream, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator size="large" color={C.teal600}/>
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
        <Text style={{ fontSize:10, fontWeight:"500", letterSpacing:1.4, textTransform:"uppercase", color:C.teal300, marginBottom:4 }}>
          Panel admin
        </Text>
        <Text style={{ fontFamily:"Georgia", fontSize:22, color:"white" }}>
          {isEdit ? "Editar guía" : "Nueva guía"}
        </Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex:1, backgroundColor:C.cream }}>
        <ScrollView contentContainerStyle={{ padding:16, paddingBottom:32 }} keyboardShouldPersistTaps="handled">

          {/* Imagen */}
          <Text style={styles.label}>Imagen</Text>
          <Pressable onPress={pickAndUploadImage}
            style={{ height:160, borderRadius:12, backgroundColor:"#e6e6e6", overflow:"hidden", marginBottom:14, alignItems:"center", justifyContent:"center" }}>
            {imagen ? (
              <Image source={{ uri: imagen }} style={{ width:"100%", height:"100%" }} resizeMode="cover"/>
            ) : (
              <>
                <Ionicons name="image-outline" size={32} color={C.muted2}/>
                <Text style={{ marginTop:6, fontSize:12, color:C.muted }}>Toca para subir una imagen</Text>
              </>
            )}
            {uploading && (
              <View style={{ position:"absolute", inset:0, alignItems:"center", justifyContent:"center", backgroundColor:"rgba(255,255,255,0.7)" }}>
                <ActivityIndicator size="large" color={C.teal600}/>
              </View>
            )}
          </Pressable>
          {imagen ? (
            <Pressable onPress={() => setImagen("")} style={{ alignSelf:"flex-end", marginTop:-6, marginBottom:10 }}>
              <Text style={{ fontSize:12, color:C.coral500, fontWeight:"600" }}>Quitar imagen</Text>
            </Pressable>
          ) : null}

          {/* Título */}
          <Text style={styles.label}>Título *</Text>
          <TextInput value={titulo} onChangeText={setTitulo}
            placeholder="ESC Guidelines for Heart Failure 2023"
            placeholderTextColor={C.muted2}
            style={styles.input}/>

          {/* Sociedad */}
          <Text style={styles.label}>Sociedad *</Text>
          <TextInput value={sociedad} onChangeText={setSociedad}
            placeholder="ESC, AHA, GOLD, NICE..."
            placeholderTextColor={C.muted2}
            style={styles.input}/>

          {/* Idioma */}
          <Text style={styles.label}>Idioma</Text>
          <View style={{ flexDirection:"row", gap:8, marginBottom:12 }}>
            {[
              { key:"ingles",     label:"Inglés",     color:C.langEnglish },
              { key:"castellano", label:"Castellano", color:C.langSpanish },
            ].map(opt => {
              const active = idioma === opt.key;
              return (
                <Pressable key={opt.key} onPress={() => setIdioma(opt.key)}
                  style={{
                    flex:1, paddingVertical:11, borderRadius:10, alignItems:"center",
                    backgroundColor: active ? opt.color : "transparent",
                    borderWidth: active ? 0 : 1, borderColor: C.borderMd,
                  }}>
                  <Text style={{ fontSize:13, fontWeight:"700",
                    color: active ? "white" : opt.color,
                  }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Especialidades */}
          <Text style={styles.label}>Especialidades</Text>
          <TextInput value={especialidades} onChangeText={setEspecialidades}
            placeholder="Cardiología, Urgencias, Atención Primaria"
            placeholderTextColor={C.muted2}
            style={styles.input}/>
          <Text style={{ fontSize:11, color:C.muted2, marginTop:-8, marginBottom:14 }}>
            Separadas por comas
          </Text>

          {/* URL */}
          <Text style={styles.label}>URL de la fuente *</Text>
          <TextInput value={url} onChangeText={setUrl}
            placeholder="https://www.escardio.org/..."
            placeholderTextColor={C.muted2}
            autoCapitalize="none" autoCorrect={false} keyboardType="url"
            style={styles.input}/>

          {/* Resumen */}
          <Text style={styles.label}>Resumen (60-80 palabras)</Text>
          <TextInput value={resumen} onChangeText={setResumen}
            placeholder="Describe los cambios y novedades de esta actualización..."
            placeholderTextColor={C.muted2}
            multiline numberOfLines={6} textAlignVertical="top"
            style={[styles.input, { height:140, paddingTop:12 }]}/>

          {/* Botón guardar */}
          <Pressable onPress={handleSave} disabled={saving}
            style={({pressed}) => ({
              backgroundColor: saving ? C.muted2 : C.teal600,
              borderRadius:14, paddingVertical:14, alignItems:"center", marginTop:18,
              opacity: pressed ? 0.85 : 1,
            })}>
            {saving ? (
              <ActivityIndicator color="white"/>
            ) : (
              <Text style={{ color:"white", fontSize:14, fontWeight:"600" }}>
                {isEdit ? "Guardar cambios" : "Crear guía"}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = {
  label: { fontSize:12, fontWeight:"600", color:C.muted, marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 },
  input: {
    width:"100%", paddingHorizontal:14, paddingVertical:11, borderRadius:10,
    borderWidth:1, borderColor:C.borderMd, fontSize:15, backgroundColor:C.white, color:C.ink,
    marginBottom:14,
  },
};
