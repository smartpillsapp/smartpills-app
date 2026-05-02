import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, ScrollView, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal500:"#1d9e87", teal300:"#6dcfc0", teal100:"#d4f0eb", teal50:"#edf8f6",
  coral500:"#d4522a", coral100:"#fae8e2",
  amber500:"#d97706",
  purple500:"#9b59b6",
  cream:"#f7f5f0", cream2:"#f0ede6",
  white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)", borderMd:"rgba(28,43,38,0.16)",
};

const FILTERS = [
  { key:"all",         label:"Todo" },
  { key:"article",     label:"Pills 💊" },
  { key:"news",        label:"Noticias 📰" },
  { key:"guide",       label:"Guías 📖" },
  { key:"infographic", label:"Infografías 🎨" },
];

const TYPE_META = {
  article:     { color:C.teal600,    label:"💊 Pill" },
  news:        { color:C.coral500,   label:"📰 Noticia" },
  guide:       { color:C.purple500,  label:"📖 Guía" },
  infographic: { color:C.amber500,   label:"🎨 Infografía" },
};

function timeAgo(dateString) {
  if(!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diff / 86400000);
  if(days  > 0) return `Hace ${days}d`;
  const hours = Math.floor(diff / 3600000);
  if(hours > 0) return `Hace ${hours}h`;
  return "Ahora";
}

function SavedCard({ item, onUnsave, onOpen }) {
  const meta    = TYPE_META[item.content_type] || TYPE_META.article;
  const title   = item.content?.title || "Sin título";
  const summary = item.content?.ai_summary || item.content?.description || "";
  const source  = item.content?.journal || item.content?.source_name || item.content?.organization || "";
  const year    = item.content?.year;
  const isPdf   = item.content_type === "guide" || item.content_type === "infographic";

  return (
    <Pressable onPress={() => onOpen(item)}
      style={({pressed}) => ({
        backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:12,
        padding:16, marginBottom:10, opacity: pressed ? 0.9 : 1,
      })}>
      <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <View style={{ backgroundColor:`${meta.color}18`, paddingHorizontal:8, paddingVertical:2, borderRadius:8 }}>
          <Text style={{ fontSize:10, fontWeight:"600", color:meta.color, textTransform:"uppercase" }}>
            {meta.label}
          </Text>
        </View>
        <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
          <Text style={{ fontSize:11, color:C.muted2 }}>{timeAgo(item.created_at)}</Text>
          <Pressable onPress={(e) => { e.stopPropagation?.(); onUnsave(item.id); }} hitSlop={8}>
            <Ionicons name="bookmark" size={16} color={C.coral500}/>
          </Pressable>
        </View>
      </View>

      <Text style={{ fontFamily:"Georgia", fontSize:15, lineHeight:21, color:C.ink, marginBottom:6 }}>
        {title}
      </Text>

      {(source || year) && (
        <Text style={{ fontSize:11, color:C.muted2, fontWeight:"500", textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>
          {source}{source && year ? " · " : ""}{year || ""}
        </Text>
      )}

      {!isPdf && summary ? (
        <Text numberOfLines={2} style={{ fontSize:13, lineHeight:19, color:C.muted }}>
          {summary}
        </Text>
      ) : null}

      {isPdf && (
        <Text style={{ fontSize:12, color:meta.color, fontWeight:"500", marginTop:4 }}>
          Pulsa para abrir el PDF →
        </Text>
      )}
    </Pressable>
  );
}

export default function Saved() {
  const router = useRouter();
  const [items, setItems]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => { loadSaved(); }, []);

  async function loadSaved() {
    setLoading(true);
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if(!user) return;

      const { data:profile } = await supabase
        .from("profiles").select("id").eq("auth_user_id", user.id).single();
      if(!profile) return;

      const { data:savedItems } = await supabase
        .from("user_saved_content").select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending:false });

      if(!savedItems || savedItems.length === 0) {
        setItems([]);
        return;
      }

      const enriched = await Promise.all(savedItems.map(async (it) => {
        let content = null;
        if(it.content_type === "article") {
          const { data } = await supabase.from("articles").select("title,journal,ai_summary,category,source_url").eq("id", it.content_id).single();
          content = data;
        } else if(it.content_type === "news") {
          const { data } = await supabase.from("news").select("title,source_name,ai_summary,category,source_url").eq("id", it.content_id).single();
          content = data;
        } else if(it.content_type === "guide") {
          const { data } = await supabase.from("clinical_guides").select("title,organization,year,pdf_url").eq("id", it.content_id).single();
          content = data;
        } else if(it.content_type === "infographic") {
          const { data } = await supabase.from("ai_infographics").select("title,organization,year,pdf_url").eq("id", it.content_id).single();
          content = data;
        }
        return { ...it, content };
      }));

      setItems(enriched.filter(i => i.content !== null));
    } catch(err) {
      console.error("Error cargando botiquín:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsave(savedId) {
    await supabase.from("user_saved_content").delete().eq("id", savedId);
    setItems(prev => prev.filter(i => i.id !== savedId));
  }

  function handleOpen(item) {
    if(item.content_type === "article") {
      router.push(`/article/${item.content_id}`);
    } else if(item.content_type === "news") {
      // TODO: sin pantalla de detalle de news, abrimos la fuente
      if(item.content?.source_url) Linking.openURL(item.content.source_url);
    } else if(item.content_type === "guide" || item.content_type === "infographic") {
      if(item.content?.pdf_url) {
        router.push({
          pathname: "/pdf-viewer",
          params: { url: item.content.pdf_url, title: item.content.title, organization: item.content.organization },
        });
      }
    }
  }

  const filtered = activeFilter === "all" ? items : items.filter(i => i.content_type === activeFilter);

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.cream }} edges={["top","bottom"]}>
      <StatusBar style="light"/>

      {/* Cabecera */}
      <View style={{ backgroundColor:C.teal800, paddingHorizontal:16, paddingTop:12, paddingBottom:18 }}>
        <View style={{ flexDirection:"row", alignItems:"center", gap:12, marginBottom:4 }}>
          <Pressable onPress={() => router.back()}
            style={{ backgroundColor:"rgba(255,255,255,0.1)", borderWidth:1, borderColor:"rgba(255,255,255,0.2)", borderRadius:8, paddingHorizontal:10, paddingVertical:4 }}>
            <Text style={{ fontSize:12, color:"white" }}>← Volver</Text>
          </Pressable>
          <Text style={{ fontFamily:"Georgia", fontSize:18, color:"white" }}>🧰 Mi Botiquín</Text>
        </View>
        <Text style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginLeft:4 }}>
          {items.length} elemento{items.length!==1 ? "s" : ""} guardado{items.length!==1 ? "s" : ""}
        </Text>
      </View>

      {/* Filtros */}
      <View style={{ backgroundColor:C.white, borderBottomWidth:1, borderBottomColor:C.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal:14, paddingVertical:10, gap:6 }}>
          {FILTERS.map(f => {
            const active = activeFilter === f.key;
            return (
              <Pressable key={f.key} onPress={() => setActiveFilter(f.key)}
                style={{ paddingHorizontal:13, paddingVertical:6, borderRadius:16,
                  backgroundColor: active ? C.teal600 : "transparent",
                  borderWidth:1, borderColor: active ? C.teal600 : C.borderMd }}>
                <Text style={{ fontSize:12, fontWeight: active?"500":"400", color: active ? "white" : C.muted }}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Contenido */}
      {loading ? (
        <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
          <ActivityIndicator size="large" color={C.teal600}/>
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex:1, alignItems:"center", justifyContent:"center", padding:24 }}>
          <Text style={{ fontSize:42, marginBottom:12 }}>🧰</Text>
          <Text style={{ fontFamily:"Georgia", fontSize:18, color:C.ink, marginBottom:8 }}>
            {items.length === 0 ? "Tu botiquín está vacío" : "Sin resultados en este filtro"}
          </Text>
          <Text style={{ fontSize:13, color:C.muted2, textAlign:"center" }}>
            {items.length === 0
              ? "Guarda artículos, noticias y guías para leerlos cuando quieras."
              : "Cambia de filtro para ver otros tipos."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding:14 }}
          renderItem={({ item }) => (
            <SavedCard item={item} onUnsave={handleUnsave} onOpen={handleOpen}/>
          )}
        />
      )}
    </SafeAreaView>
  );
}
