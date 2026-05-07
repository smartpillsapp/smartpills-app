import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useCallback } from "react";
import MaintenanceView from "../../components/MaintenanceView";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal500:"#1d9e87", teal300:"#6dcfc0", teal100:"#d4f0eb", teal50:"#edf8f6",
  coral500:"#d4522a", coral100:"#fae8e2", coral50:"#fdf4f1",
  amber500:"#d97706", amber100:"#fef3c7", amber50:"#fffbeb",
  cream:"#f7f5f0",
  white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)", borderMd:"rgba(28,43,38,0.16)",
  langEnglish:"#4169E1",
  langSpanish:"#800000",
  tagBg:"#eef2f5", tagText:"#5a6b73",
};

const SECTIONS = {
  clinical: {
    contentType:"guide",
    title:"Guías clínicas", icon:"📖",
    accent:C.teal600, accentLight:C.teal50, accentBorder:C.teal100,
    desc:"Enlaces a guías oficiales de sociedades científicas",
  },
  infographic: {
    table:"ai_infographics", contentType:"infographic",
    title:"Resumen e infografías (IA)", icon:"🎨",
    accent:C.amber500, accentLight:C.amber50, accentBorder:C.amber100,
    desc:"Resúmenes visuales generados con IA",
  },
};

// ──────────────────────────────────────────────────────────────────
//  TARJETA NUEVA — Guías clínicas (enlaces externos)
// ──────────────────────────────────────────────────────────────────

function LanguageBadge({ idioma }) {
  const isEnglish = idioma === "ingles";
  const color = isEnglish ? C.langEnglish : C.langSpanish;
  return (
    <Text style={{ color, fontSize:11, fontWeight:"700", letterSpacing:0.6, textTransform:"uppercase" }}>
      {isEnglish ? "Inglés" : "Castellano"}
    </Text>
  );
}

function ClinicalGuideCard({ item, saved, onToggleSave, onOpen }) {
  return (
    <Pressable onPress={() => onOpen(item)}
      style={({pressed}) => ({
        backgroundColor:C.white, borderRadius:16,
        padding:16, marginBottom:12,
        flexDirection:"row", gap:12, alignItems:"flex-start",
        shadowColor:"#000", shadowOpacity:0.05, shadowRadius:6, shadowOffset:{ width:0, height:2 },
        elevation:2,
        opacity: pressed ? 0.92 : 1,
      })}>
      <View style={{ flex:1, minWidth:0 }}>
        {/* Título */}
        <Text style={{ fontSize:17, fontWeight:"bold", color:C.ink, marginBottom:6, lineHeight:22 }}>
          {item.titulo}
        </Text>

        {/* Sociedad */}
        <Text style={{ fontSize:12, fontWeight:"500", color:C.muted, textTransform:"uppercase", letterSpacing:0.6, marginBottom:10 }}>
          {item.sociedad}
        </Text>

        {/* Idioma + especialidades */}
        <View style={{ flexDirection:"row", flexWrap:"wrap", gap:6, alignItems:"center" }}>
          <LanguageBadge idioma={item.idioma}/>
          {item.especialidades?.map((esp, i) => (
            <View key={i} style={{ backgroundColor:C.tagBg, paddingHorizontal:9, paddingVertical:3, borderRadius:8 }}>
              <Text style={{ fontSize:11, color:C.tagText, fontWeight:"500" }}>#{esp}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Botón guardar */}
      <Pressable onPress={(e) => { e.stopPropagation?.(); onToggleSave(item.id); }} hitSlop={8}
        style={{
          width:36, height:36, borderRadius:18,
          borderWidth:1, borderColor: saved ? C.coral100 : C.border,
          backgroundColor: saved ? C.coral100 : "transparent",
          alignItems:"center", justifyContent:"center",
        }}>
        <Ionicons name={saved?"bookmark":"bookmark-outline"} size={16} color={saved?C.coral500:C.muted2}/>
      </Pressable>
    </Pressable>
  );
}

function ClinicalGuidesView({ onBack }) {
  const router = useRouter();
  const [profileId, setProfileId] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);

  // Recargar guías cada vez que se entra a la pantalla (para reflejar cambios de admin)
  useFocusEffect(useCallback(() => { loadAll(); }, []));

  async function loadAll() {
    setLoading(true);
    try {
      // 1) Cargar lista de guías
      const { data:list } = await supabase.from("clinical_guides_v2")
        .select("*").order("created_at", { ascending:false });
      setGuides(list || []);

      // 2) Cargar guardados del usuario
      const { data:{ user } } = await supabase.auth.getUser();
      if(user) {
        const { data:profile } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).single();
        if(profile) {
          setProfileId(profile.id);
          const { data:rows } = await supabase
            .from("user_saved_content").select("content_id")
            .eq("user_id", profile.id).eq("content_type", "guide");
          setSavedIds(new Set((rows || []).map(r => r.content_id)));
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleSave(itemId) {
    if(!profileId) return;
    const wasSaved = savedIds.has(itemId);
    setSavedIds(prev => {
      const next = new Set(prev);
      wasSaved ? next.delete(itemId) : next.add(itemId);
      return next;
    });
    try {
      if(wasSaved) {
        await supabase.from("user_saved_content").delete()
          .eq("user_id", profileId).eq("content_id", itemId).eq("content_type", "guide");
      } else {
        await supabase.from("user_saved_content").insert({
          user_id:profileId, content_id:itemId, content_type:"guide",
        });
      }
    } catch(err) {
      setSavedIds(prev => {
        const next = new Set(prev);
        wasSaved ? next.add(itemId) : next.delete(itemId);
        return next;
      });
    }
  }

  function handleOpen(item) {
    router.push({ pathname:"/guide-detail", params:{ id: item.id } });
  }

  const q = search.toLowerCase();
  const filtered = !q ? guides : guides.filter(g =>
    (g.titulo || "").toLowerCase().includes(q) ||
    (g.sociedad || "").toLowerCase().includes(q) ||
    (g.especialidades || []).some(e => e.toLowerCase().includes(q))
  );

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.teal700 }} edges={["top"]}>
      <StatusBar style="light"/>

      <View style={{ backgroundColor:C.teal700, paddingHorizontal:16, paddingVertical:14 }}>
        <Pressable onPress={onBack}
          style={{ alignSelf:"flex-start", backgroundColor:"rgba(255,255,255,0.12)", borderWidth:1, borderColor:"rgba(255,255,255,0.2)", borderRadius:8, paddingHorizontal:10, paddingVertical:4, marginBottom:10 }}>
          <Text style={{ fontSize:12, color:"white" }}>← Volver</Text>
        </Pressable>
        <Text style={{ fontFamily:"Georgia", fontSize:20, color:"white", marginBottom:12 }}>
          📖 Guías clínicas
        </Text>
        <View style={{ flexDirection:"row", alignItems:"center", backgroundColor:"rgba(255,255,255,0.12)", borderWidth:1, borderColor:"rgba(255,255,255,0.18)", borderRadius:10, paddingHorizontal:12, height:40, gap:8 }}>
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.6)"/>
          <TextInput value={search} onChangeText={setSearch}
            placeholder="Buscar por título, sociedad o especialidad..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={{ flex:1, color:"white", fontSize:14 }}/>
        </View>
      </View>

      <View style={{ flex:1, backgroundColor:C.cream }}>
        {loading ? (
          <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
            <ActivityIndicator size="large" color={C.teal600}/>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ flex:1, alignItems:"center", justifyContent:"center", padding:24 }}>
            <Text style={{ fontSize:38, marginBottom:12 }}>📖</Text>
            <Text style={{ fontFamily:"Georgia", fontSize:16, color:C.ink, marginBottom:6 }}>
              {search ? "Sin resultados" : "Aún no hay guías"}
            </Text>
            <Text style={{ fontSize:13, color:C.muted2, textAlign:"center" }}>
              {search ? "Prueba con otra búsqueda" : "Pronto añadiremos contenido."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding:16, paddingBottom:24 }}
            renderItem={({ item }) => (
              <ClinicalGuideCard item={item}
                saved={savedIds.has(item.id)} onToggleSave={handleToggleSave} onOpen={handleOpen}/>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────────────────────────
//  TARJETA ANTIGUA — Infografías (siguen cargándose desde supabase)
// ──────────────────────────────────────────────────────────────────

function PdfPlaceholder({ accent, accentLight, accentBorder }) {
  return (
    <View style={{
      width:56, height:74, borderRadius:8,
      backgroundColor:"white", borderWidth:1, borderColor:accentBorder,
      alignItems:"center", justifyContent:"center",
      shadowColor:"#000", shadowOpacity:0.06, shadowRadius:3, shadowOffset:{width:0, height:1}, elevation:2,
      position:"relative", overflow:"hidden",
    }}>
      <View style={{ position:"absolute", top:0, right:0, width:13, height:13, backgroundColor:accentLight, borderBottomLeftRadius:3 }}/>
      <View style={{ position:"absolute", top:0, right:0, width:0, height:0,
        borderTopWidth:0, borderLeftWidth:13, borderBottomWidth:13,
        borderLeftColor:"transparent", borderBottomColor:accentBorder, borderTopColor:"transparent",
      }}/>
      <Ionicons name="document-text" size={26} color={accent} style={{ marginTop:4 }}/>
      <Text style={{ fontSize:9, fontWeight:"700", color:accent, letterSpacing:0.6, marginTop:3 }}>PDF</Text>
    </View>
  );
}

function InfographicCard({ item, accent, accentLight, accentBorder, saved, onToggleSave, onOpen }) {
  return (
    <Pressable onPress={() => onOpen(item)}
      style={({pressed}) => ({
        backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:11,
        padding:14, marginBottom:8, flexDirection:"row", gap:12, alignItems:"flex-start",
        opacity: pressed ? 0.9 : 1,
      })}>
      <PdfPlaceholder accent={accent} accentLight={accentLight} accentBorder={accentBorder}/>
      <View style={{ flex:1, minWidth:0 }}>
        <Text style={{ fontSize:10, fontWeight:"500", letterSpacing:0.5, textTransform:"uppercase", color:C.muted2, marginBottom:3 }}>
          {item.organization}
        </Text>
        <Text style={{ fontFamily:"Georgia", fontSize:14, lineHeight:19, color:C.ink, marginBottom:6 }}>
          {item.title}
        </Text>
        <Text style={{ fontSize:11, color:C.muted2 }}>{item.year}</Text>
      </View>
      <Pressable onPress={(e) => { e.stopPropagation?.(); onToggleSave(item.id); }} hitSlop={8}
        style={{ width:28, height:28, borderRadius:14, borderWidth:1, borderColor:saved?C.coral100:C.border, backgroundColor:saved?C.coral100:"transparent", alignItems:"center", justifyContent:"center" }}>
        <Ionicons name={saved?"bookmark":"bookmark-outline"} size={14} color={saved?C.coral500:C.muted2}/>
      </Pressable>
    </Pressable>
  );
}

function InfographicsView({ section, onBack }) {
  const router = useRouter();
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [profileId, setProfileId] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [search, setSearch]     = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if(user) {
        const { data:profile } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).single();
        if(profile) {
          setProfileId(profile.id);
          const { data:rows } = await supabase
            .from("user_saved_content").select("content_id")
            .eq("user_id", profile.id).eq("content_type", section.contentType);
          setSavedIds(new Set((rows || []).map(r => r.content_id)));
        }
      }
      const { data } = await supabase.from(section.table).select("*")
        .order("year", { ascending:false })
        .order("created_at", { ascending:false });
      setItems(data || []);
    } catch(err) {
      console.error("Error cargando:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleSave(itemId) {
    if(!profileId) return;
    const wasSaved = savedIds.has(itemId);
    setSavedIds(prev => {
      const next = new Set(prev);
      wasSaved ? next.delete(itemId) : next.add(itemId);
      return next;
    });
    try {
      if(wasSaved) {
        await supabase.from("user_saved_content").delete()
          .eq("user_id", profileId).eq("content_id", itemId).eq("content_type", section.contentType);
      } else {
        await supabase.from("user_saved_content").insert({
          user_id:profileId, content_id:itemId, content_type:section.contentType,
        });
      }
    } catch(err) {
      setSavedIds(prev => {
        const next = new Set(prev);
        wasSaved ? next.add(itemId) : next.delete(itemId);
        return next;
      });
    }
  }

  function handleOpen(item) {
    router.push({
      pathname:"/pdf-viewer",
      params: { url: item.pdf_url, title: item.title, organization: item.organization },
    });
  }

  const q = search.toLowerCase();
  const filtered = !q ? items : items.filter(it =>
    (it.title || "").toLowerCase().includes(q) ||
    (it.organization || "").toLowerCase().includes(q)
  );

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.teal700 }} edges={["top"]}>
      <StatusBar style="light"/>

      <View style={{ backgroundColor:C.teal700, paddingHorizontal:16, paddingVertical:14 }}>
        <Pressable onPress={onBack}
          style={{ alignSelf:"flex-start", backgroundColor:"rgba(255,255,255,0.12)", borderWidth:1, borderColor:"rgba(255,255,255,0.2)", borderRadius:8, paddingHorizontal:10, paddingVertical:4, marginBottom:10 }}>
          <Text style={{ fontSize:12, color:"white" }}>← Volver</Text>
        </Pressable>
        <Text style={{ fontFamily:"Georgia", fontSize:20, color:"white", marginBottom:12 }}>
          {section.icon} {section.title}
        </Text>
        <View style={{ flexDirection:"row", alignItems:"center", backgroundColor:"rgba(255,255,255,0.12)", borderWidth:1, borderColor:"rgba(255,255,255,0.18)", borderRadius:10, paddingHorizontal:12, height:40, gap:8 }}>
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.6)"/>
          <TextInput value={search} onChangeText={setSearch}
            placeholder="Buscar..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={{ flex:1, color:"white", fontSize:14 }}/>
        </View>
      </View>

      <View style={{ flex:1, backgroundColor:C.cream }}>
        {loading ? (
          <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
            <ActivityIndicator size="large" color={C.teal600}/>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ flex:1, alignItems:"center", justifyContent:"center", padding:24 }}>
            <Text style={{ fontSize:38, marginBottom:12 }}>{section.icon}</Text>
            <Text style={{ fontFamily:"Georgia", fontSize:16, color:C.ink, marginBottom:6 }}>
              {search ? "Sin resultados" : "Aún no hay contenido"}
            </Text>
            <Text style={{ fontSize:13, color:C.muted2, textAlign:"center" }}>
              {search ? "Prueba con otra búsqueda" : "Vuelve pronto, estamos preparando contenido."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding:14 }}
            renderItem={({ item }) => (
              <InfographicCard item={item}
                accent={section.accent} accentLight={section.accentLight} accentBorder={section.accentBorder}
                saved={savedIds.has(item.id)} onToggleSave={handleToggleSave} onOpen={handleOpen}/>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────────────────────────
//  Pantalla de selección
// ──────────────────────────────────────────────────────────────────

function EntryView({ onSelect }) {
  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.teal800 }} edges={["top"]}>
      <StatusBar style="light"/>

      <View style={{ backgroundColor:C.teal800, paddingHorizontal:16, paddingTop:18, paddingBottom:22 }}>
        <Text style={{ fontSize:10, fontWeight:"500", letterSpacing:1.4, textTransform:"uppercase", color:C.teal300, marginBottom:6 }}>
          Biblioteca
        </Text>
        <Text style={{ fontFamily:"Georgia", fontSize:22, color:"white", marginBottom:4 }}>
          Guías y resúmenes
        </Text>
        <Text style={{ fontSize:12, color:"rgba(255,255,255,0.55)" }}>Elige qué quieres consultar</Text>
      </View>

      <View style={{ flex:1, backgroundColor:C.cream, padding:16, gap:12 }}>
        {Object.entries(SECTIONS).map(([key, sec]) => (
          <Pressable key={key} onPress={() => onSelect(key)}
            style={({pressed}) => ({
              backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:14,
              padding:16, flexDirection:"row", alignItems:"center", gap:14,
              opacity: pressed ? 0.9 : 1, transform:[{ translateY: pressed ? -1 : 0 }],
            })}>
            <View style={{ width:54, height:54, borderRadius:12, backgroundColor:sec.accentLight, borderWidth:1, borderColor:sec.accentBorder, alignItems:"center", justifyContent:"center" }}>
              <Text style={{ fontSize:28 }}>{sec.icon}</Text>
            </View>
            <View style={{ flex:1, minWidth:0 }}>
              <Text style={{ fontFamily:"Georgia", fontSize:17, color:C.ink, marginBottom:3 }}>{sec.title}</Text>
              <Text style={{ fontSize:12, color:C.muted, lineHeight:17 }}>{sec.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.muted2}/>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function Guides() {
  const [view, setView] = useState("entry"); // "entry" | "clinical" | "infographic"

  if(view === "clinical")    return <ClinicalGuidesView onBack={() => setView("entry")}/>;
  if(view === "infographic") return (
    <MaintenanceView
      title="🎨 Resumen e infografías"
      onBack={() => setView("entry")}
    />
  );
  return <EntryView onSelect={setView}/>;
}
