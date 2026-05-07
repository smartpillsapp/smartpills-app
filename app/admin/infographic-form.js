import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal300:"#6dcfc0", teal50:"#edf8f6",
  coral500:"#d4522a",
  cream:"#f7f5f0",
  white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)", borderMd:"rgba(28,43,38,0.16)",
};

export default function InfographicForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);

  const [title, setTitle]               = useState("");
  const [organization, setOrganization] = useState("");
  const [year, setYear]                 = useState("");
  const [pdfUrl, setPdfUrl]             = useState("");

  useEffect(() => { if(isEdit) load(); }, [id]);

  async function load() {
    const { data, error } = await supabase.from("ai_infographics")
      .select("*").eq("id", id).single();
    if(error) {
      Alert.alert("Error", error.message);
      setLoading(false);
      return;
    }
    setTitle(data.title || "");
    setOrganization(data.organization || "");
    setYear(data.year ? String(data.year) : "");
    setPdfUrl(data.pdf_url || "");
    setLoading(false);
  }

  async function handleSave() {
    if(!title.trim() || !pdfUrl.trim()) {
      Alert.alert("Campos obligatorios", "Título y URL del PDF son obligatorios.");
      return;
    }

    const yearInt = year.trim() ? parseInt(year.trim(), 10) : null;
    if(year.trim() && (isNaN(yearInt) || yearInt < 1900 || yearInt > 2100)) {
      Alert.alert("Año inválido", "Introduce un año válido (ej. 2025).");
      return;
    }

    setSaving(true);
    const payload = {
      title:        title.trim(),
      organization: organization.trim() || null,
      year:         yearInt,
      pdf_url:      pdfUrl.trim(),
    };

    let error;
    if(isEdit) {
      ({ error } = await supabase.from("ai_infographics").update(payload).eq("id", id));
    } else {
      ({ error } = await supabase.from("ai_infographics").insert(payload));
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
          {isEdit ? "Editar infografía" : "Nueva infografía"}
        </Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex:1, backgroundColor:C.cream }}>
        <ScrollView contentContainerStyle={{ padding:16, paddingBottom:32 }} keyboardShouldPersistTaps="handled">

          {/* Título */}
          <Text style={styles.label}>Título *</Text>
          <TextInput value={title} onChangeText={setTitle}
            placeholder="Manejo de la insuficiencia cardíaca"
            placeholderTextColor={C.muted2}
            multiline
            style={[styles.input, { minHeight:60 }]}/>

          {/* Organización */}
          <Text style={styles.label}>Organización</Text>
          <TextInput value={organization} onChangeText={setOrganization}
            placeholder="ESC, AHA, SemFYC..."
            placeholderTextColor={C.muted2}
            style={styles.input}/>

          {/* Año */}
          <Text style={styles.label}>Año</Text>
          <TextInput value={year} onChangeText={setYear}
            placeholder="2025"
            placeholderTextColor={C.muted2}
            keyboardType="number-pad" maxLength={4}
            style={styles.input}/>

          {/* URL del PDF */}
          <Text style={styles.label}>URL del PDF *</Text>
          <TextInput value={pdfUrl} onChangeText={setPdfUrl}
            placeholder="https://.../infografia.pdf"
            placeholderTextColor={C.muted2}
            autoCapitalize="none" autoCorrect={false} keyboardType="url"
            style={styles.input}/>

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
                {isEdit ? "Guardar cambios" : "Crear infografía"}
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
