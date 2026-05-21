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
};

const BUCKET = "pill-images";

// Lista cerrada de categorías. Mantener sincronizada con las Edge Functions
// (news-processor/index.ts y rss-ingester/index.ts).
const SPECIALTIES = [
  "Medicina Familiar y Comunitaria",
  "Pediatría",
  "Medicina Interna",
  "Cardiología",
  "Cirugía General y Digestiva",
  "Cirugía Ortopédica y Traumatología",
  "Obstetricia y Ginecología",
  "Anestesiología y Dolor",
  "Radiodiagnóstico",
  "Dermatología",
  "Psiquiatría",
  "Oncología Médica",
  "Neurología",
  "Aparato Digestivo",
  "Oftalmología",
  "Enfermería",
  "Fisioterapia",
  "Farmacología",
];
const MAX_SPECIALTIES = 4;

export default function PillForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEdit = !!id;
  const table = "articles";

  const [loading, setLoading]   = useState(isEdit);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUpload]  = useState(false);

  const [title, setTitle]                       = useState("");
  const [category, setCategory]                 = useState("");
  const [sourceName, setSourceName]             = useState("");
  const [journal, setJournal]                   = useState("");
  const [sourceUrl, setSourceUrl]               = useState("");
  const [pdfUrl, setPdfUrl]                     = useState("");
  const [year, setYear]                         = useState("");
  const [aiSummary, setAiSummary]               = useState("");
  const [extendedSummary, setExtendedSummary]   = useState("");
  const [keyPoints, setKeyPoints]               = useState("");
  const [tags, setTags]                         = useState("");
  const [specialties, setSpecialties]           = useState([]);  // array de strings
  const [image, setImage]                       = useState("");
  const [pinPosition, setPinPosition]           = useState(null); // null | 1..10

  useEffect(() => { if(isEdit) load(); }, [id]);

  async function load() {
    const { data, error } = await supabase.from(table)
      .select("*").eq("id", id).single();
    if(error) {
      Alert.alert("Error", error.message);
      setLoading(false);
      return;
    }
    setTitle(data.title || "");
    setCategory(data.category || "");
    setSourceName(data.source_name || "");
    setJournal(data.journal || "");
    setSourceUrl(data.source_url || "");
    setPdfUrl(data.pdf_url || "");
    setYear(data.year ? String(data.year) : "");
    setAiSummary(data.ai_summary || "");
    setExtendedSummary(data.extended_summary || "");
    let kp = data.key_points;
    if(typeof kp === "string") {
      try { kp = JSON.parse(kp); } catch { kp = []; }
    }
    if(!Array.isArray(kp)) kp = [];
    setKeyPoints(kp.join("\n"));
    setTags((data.tags || []).join(", "));
    let sp = data.specialties;
    if(typeof sp === "string") {
      try { sp = JSON.parse(sp); } catch { sp = []; }
    }
    setSpecialties(Array.isArray(sp) ? sp.filter(s => SPECIALTIES.includes(s)) : []);
    setImage(data.image || "");
    setPinPosition(data.pin_position ?? null);
    setLoading(false);
  }

  async function pickAndUploadImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if(!perm.granted) {
      Alert.alert("Permiso necesario", "Necesitamos acceso a tu galería para subir imágenes.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:    ["images"],
      allowsEditing: true,
      quality:       0.8,
    });
    if(result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setUpload(true);
    try {
      const ext      = asset.uri.split(".").pop().toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const response = await fetch(asset.uri);
      const blob     = await response.blob();
      const arrayBuf = await new Response(blob).arrayBuffer();

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, arrayBuf, { contentType: blob.type || `image/${ext}` });

      if(upErr) throw upErr;

      const { data:{ publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
      setImage(publicUrl);
    } catch(err) {
      Alert.alert("Error subiendo imagen", err.message || String(err));
    } finally {
      setUpload(false);
    }
  }

  async function handleSave() {
    if(!title.trim()) {
      Alert.alert("Campo obligatorio", "El título es obligatorio.");
      return;
    }
    setSaving(true);

    const yearInt = year.trim() ? parseInt(year.trim(), 10) : null;
    if(year.trim() && (isNaN(yearInt) || yearInt < 1900 || yearInt > 2100)) {
      setSaving(false);
      Alert.alert("Año inválido", "Introduce un año válido (ej. 2025).");
      return;
    }

    const tagsArr = tags.split(",").map(s => s.trim()).filter(Boolean);
    const keyPointsArr = keyPoints
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      title:        title.trim(),
      category:     category.trim() || null,
      source_name:  sourceName.trim() || null,
      source_url:   sourceUrl.trim() || null,
      ai_summary:   aiSummary.trim() || null,
      pdf_url:      pdfUrl.trim() || null,
      year:         yearInt,
      image:        image.trim() || null,
      pin_position: pinPosition,
    };

    payload.journal          = journal.trim() || null;
    payload.extended_summary = extendedSummary.trim() || null;
    payload.key_points       = keyPointsArr.length ? keyPointsArr : null;
    payload.tags             = tagsArr.length ? tagsArr : null;
    payload.specialties      = specialties.slice(0, MAX_SPECIALTIES);

    if(!isEdit) {
      payload.published_at = new Date().toISOString();
    }

    let error;
    if(isEdit) {
      ({ error } = await supabase.from(table).update(payload).eq("id", id));
    } else {
      ({ error } = await supabase.from(table).insert(payload));
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

  const titleLabel = isEdit ? "Editar pill" : "Nuevo pill";

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
          {titleLabel}
        </Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex:1, backgroundColor:C.cream }}>
        <ScrollView contentContainerStyle={{ padding:16, paddingBottom:32 }} keyboardShouldPersistTaps="handled">

          {/* Imagen */}
          <Text style={styles.label}>Imagen (opcional)</Text>
          <Pressable onPress={pickAndUploadImage}
            style={{ height:160, borderRadius:12, backgroundColor:"#e6e6e6", overflow:"hidden", marginBottom:6, alignItems:"center", justifyContent:"center" }}>
            {image ? (
              <Image source={{ uri: image }} style={{ width:"100%", height:"100%" }} resizeMode="cover"/>
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
          <Text style={{ fontSize:11, color:C.muted2, marginBottom:10 }}>
            Si la dejas vacía, se usará la imagen automática según la categoría.
          </Text>
          {image ? (
            <Pressable onPress={() => setImage("")} style={{ alignSelf:"flex-end", marginBottom:10 }}>
              <Text style={{ fontSize:12, color:C.coral500, fontWeight:"600" }}>Quitar imagen personalizada</Text>
            </Pressable>
          ) : null}

          {/* Posición fija */}
          <Text style={styles.label}>Posición fija en el feed</Text>
          <View style={{ flexDirection:"row", flexWrap:"wrap", gap:6, marginBottom:6 }}>
            <Pressable onPress={() => setPinPosition(null)}
              style={{
                paddingVertical:8, paddingHorizontal:12, borderRadius:18,
                backgroundColor: pinPosition == null ? C.muted : "transparent",
                borderWidth:1, borderColor: pinPosition == null ? C.muted : C.borderMd,
              }}>
              <Text style={{ fontSize:12, fontWeight:"600", color: pinPosition == null ? "white" : C.muted }}>
                Sin fijar
              </Text>
            </Pressable>
            {[1,2,3,4,5,6,7,8,9,10].map(n => {
              const active = pinPosition === n;
              return (
                <Pressable key={n} onPress={() => setPinPosition(active ? null : n)}
                  style={{
                    paddingVertical:8, paddingHorizontal:12, borderRadius:18, minWidth:46, alignItems:"center",
                    backgroundColor: active ? C.coral500 : "transparent",
                    borderWidth:1, borderColor: active ? C.coral500 : C.borderMd,
                  }}>
                  <Text style={{ fontSize:12, fontWeight:"700", color: active ? "white" : C.muted }}>
                    📌 {n}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={{ fontSize:11, color:C.muted2, marginBottom:14 }}>
            Los pills fijados aparecen siempre los primeros, en el orden 1, 2, 3… Si dos tienen la misma posición, sale antes el más reciente.
          </Text>

          {/* Título */}
          <Text style={styles.label}>Título *</Text>
          <TextInput value={title} onChangeText={setTitle}
            placeholder="Título del pill"
            placeholderTextColor={C.muted2}
            multiline
            style={[styles.input, { minHeight:60 }]}/>

          {/* Categoría — multi-select (1-4 categorías) */}
          <Text style={styles.label}>Categoría ({specialties.length}/{MAX_SPECIALTIES})</Text>
          <View style={{ flexDirection:"row", flexWrap:"wrap", gap:6, marginBottom:6 }}>
            {SPECIALTIES.map(sp => {
              const active = specialties.includes(sp);
              const atMax  = specialties.length >= MAX_SPECIALTIES;
              const disabled = !active && atMax;
              return (
                <Pressable key={sp} disabled={disabled}
                  onPress={() => {
                    if(active) {
                      setSpecialties(specialties.filter(s => s !== sp));
                    } else if(!atMax) {
                      setSpecialties([...specialties, sp]);
                    }
                  }}
                  style={{
                    paddingVertical:8, paddingHorizontal:12, borderRadius:18,
                    backgroundColor: active ? C.coral500 : "transparent",
                    borderWidth:1, borderColor: active ? C.coral500 : C.borderMd,
                    opacity: disabled ? 0.4 : 1,
                  }}>
                  <Text style={{ fontSize:12, fontWeight:"600", color: active ? "white" : C.muted }}>
                    {sp}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={{ fontSize:11, color:C.muted2, marginBottom:14 }}>
            Toca para seleccionar/deseleccionar. Máximo {MAX_SPECIALTIES} categorías por pill.
          </Text>

          {/* Fuente / Source name */}
          <Text style={styles.label}>Fuente (medio)</Text>
          <TextInput value={sourceName} onChangeText={setSourceName}
            placeholder="El País, Medscape..."
            placeholderTextColor={C.muted2}
            style={styles.input}/>

          {/* Journal */}
          <Text style={styles.label}>Journal / Revista</Text>
          <TextInput value={journal} onChangeText={setJournal}
            placeholder="NEJM, The Lancet..."
            placeholderTextColor={C.muted2}
            style={styles.input}/>

          {/* URL fuente */}
          <Text style={styles.label}>Enlace al sitio web</Text>
          <TextInput value={sourceUrl} onChangeText={setSourceUrl}
            placeholder="https://..."
            placeholderTextColor={C.muted2}
            autoCapitalize="none" autoCorrect={false} keyboardType="url"
            style={styles.input}/>

          {/* PDF URL */}
          <Text style={styles.label}>URL del PDF (opcional)</Text>
          <TextInput value={pdfUrl} onChangeText={setPdfUrl}
            placeholder="https://.../documento.pdf"
            placeholderTextColor={C.muted2}
            autoCapitalize="none" autoCorrect={false} keyboardType="url"
            style={styles.input}/>

          {/* Año */}
          <Text style={styles.label}>Año</Text>
          <TextInput value={year} onChangeText={setYear}
            placeholder="2025"
            placeholderTextColor={C.muted2}
            keyboardType="number-pad" maxLength={4}
            style={styles.input}/>

          {/* Resumen corto */}
          <Text style={styles.label}>Resumen corto (feed)</Text>
          <TextInput value={aiSummary} onChangeText={setAiSummary}
            placeholder="Lo que se ve en el reel, debajo del título..."
            placeholderTextColor={C.muted2}
            multiline numberOfLines={4} textAlignVertical="top"
            style={[styles.input, { height:100, paddingTop:12 }]}/>

          {/* Resumen extendido */}
          <Text style={styles.label}>Resumen extendido (detalle)</Text>
          <TextInput value={extendedSummary} onChangeText={setExtendedSummary}
            placeholder="El resumen largo que se ve al abrir el pill..."
            placeholderTextColor={C.muted2}
            multiline numberOfLines={8} textAlignVertical="top"
            style={[styles.input, { height:160, paddingTop:12 }]}/>

          {/* Ideas clave */}
          <Text style={styles.label}>Ideas clave</Text>
          <TextInput value={keyPoints} onChangeText={setKeyPoints}
            placeholder={"Una idea por línea\nMáximo 3"}
            placeholderTextColor={C.muted2}
            multiline numberOfLines={5} textAlignVertical="top"
            style={[styles.input, { height:120, paddingTop:12 }]}/>
          <Text style={{ fontSize:11, color:C.muted2, marginTop:-8, marginBottom:14 }}>
            Una idea por línea. Solo se muestran las 3 primeras.
          </Text>

          {/* Tags */}
          <Text style={styles.label}>Tags</Text>
          <TextInput value={tags} onChangeText={setTags}
            placeholder="hipertensión, ECG, dosis"
            placeholderTextColor={C.muted2}
            style={styles.input}/>
          <Text style={{ fontSize:11, color:C.muted2, marginTop:-8, marginBottom:14 }}>
            Separados por comas
          </Text>

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
                {isEdit ? "Guardar cambios" : "Crear pill"}
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
