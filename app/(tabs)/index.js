import { useState, useEffect } from "react";
import { View, Text, FlatList, Pressable, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal500:"#1d9e87", teal300:"#6dcfc0", teal50:"#edf8f6",
  coral500:"#d4522a", coral300:"#e8967e", coral100:"#fae8e2", coral50:"#fdf4f1",
  cream:"#f7f5f0", cream2:"#f0ede6",
  white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)", borderMd:"rgba(28,43,38,0.16)",
};

const CATEGORIES = [
  { key:"all",         label:"Todas" },
  { key:"medicina",    label:"Medicina" },
  { key:"enfermería",  label:"Enfermería" },
  { key:"fisioterapia",label:"Fisioterapia" },
  { key:"farmacia",    label:"Farmacología" },
];

const CATEGORY_COLORS = {
  urgencias:            { bg:"#fdf4f1", color:"#c8401a" },
  enfermería:           { bg:"#edf0fb", color:"#3c3489" },
  farmacología:         { bg:"#edf8f6", color:"#1a7a69" },
  investigación_clínica:{ bg:"#faeeda", color:"#633806" },
  seguridad:            { bg:"#fdf4f1", color:"#d4522a" },
  noticias_sanitarias:  { bg:"#edf8f6", color:"#1a7a69" },
};

function timeAgo(dateString) {
  if(!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);
  if(days > 0)  return `Hace ${days}d`;
  if(hours > 0) return `Hace ${hours}h`;
  return `Hace ${minutes}min`;
}

function NewsCard({ article, saved, onToggleSave, onPress }) {
  const cat = CATEGORY_COLORS[article.category] || { bg:C.cream2, color:C.muted };

  return (
    <Pressable onPress={onPress}
      style={({pressed}) => ({
        backgroundColor: C.white, borderWidth:1, borderColor:C.border, borderRadius:11,
        padding:15, marginBottom:8, opacity: pressed ? 0.9 : 1,
      })}>
      {/* Cabecera: categoría + fuente + tiempo */}
      <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <View style={{ flexDirection:"row", alignItems:"center", gap:6, flex:1 }}>
          <View style={{ backgroundColor:cat.bg, paddingHorizontal:7, paddingVertical:2, borderRadius:8 }}>
            <Text style={{ fontSize:10, fontWeight:"500", color:cat.color, textTransform:"uppercase", letterSpacing:0.4 }}>
              {(article.category || "").replace(/_/g, " ")}
            </Text>
          </View>
          <Text numberOfLines={1} style={{ fontSize:11, color:C.muted2, flex:1 }}>
            {article.journal || article.source_name}
          </Text>
        </View>
        <Text style={{ fontSize:11, color:C.muted2, marginLeft:8 }}>{timeAgo(article.published_at)}</Text>
      </View>

      {/* Título */}
      <Text style={{ fontFamily:"Georgia", fontSize:15, lineHeight:21, color:C.ink, marginBottom:6 }}>
        {article.title}
      </Text>

      {/* Resumen IA */}
      {article.ai_summary && (
        <Text numberOfLines={2} style={{ fontSize:13, lineHeight:19, color:C.muted, marginBottom:10 }}>
          {article.ai_summary}
        </Text>
      )}

      {/* Tags + botón guardar */}
      <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
        <View style={{ flexDirection:"row", flexWrap:"wrap", gap:5, flex:1 }}>
          {(article.tags || []).slice(0, 2).map(tag => (
            <View key={tag} style={{ backgroundColor:C.cream, borderWidth:1, borderColor:C.border, paddingHorizontal:8, paddingVertical:2, borderRadius:6 }}>
              <Text style={{ fontSize:11, color:C.muted }}>{tag}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
          <Pressable onPress={(e) => { e.stopPropagation?.(); onToggleSave(); }}
            hitSlop={8}
            style={{ width:28, height:28, borderRadius:14, borderWidth:1, borderColor:saved?C.coral100:C.border, backgroundColor:saved?C.coral100:"transparent", alignItems:"center", justifyContent:"center" }}>
            <Ionicons name={saved?"bookmark":"bookmark-outline"} size={14} color={saved?C.coral500:C.muted2}/>
          </Pressable>
          <Text style={{ fontSize:11, fontWeight:"500", color:C.coral300 }}>Leer →</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function Pills() {
  const [news, setNews]                     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [refreshing, setRefreshing]         = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [filtered, setFiltered]             = useState(true);
  const [profileId, setProfileId]           = useState(null);
  const [savedIds, setSavedIds]             = useState(new Set());
  const [userProfession, setUserProfession] = useState(null);

  const router = useRouter();

  useEffect(() => { loadProfile(); }, []);
  useEffect(() => { fetchNews(); }, [activeCategory, filtered, userProfession]);

  async function loadProfile() {
    const { data:{ user } } = await supabase.auth.getUser();
    if(!user) return;
    const { data:profile } = await supabase
      .from("profiles")
      .select("id, profession")
      .eq("auth_user_id", user.id)
      .single();
    if(profile) {
      setProfileId(profile.id);
      setUserProfession(profile.profession || null);

      const { data:rows } = await supabase
        .from("user_saved_content")
        .select("content_id")
        .eq("user_id", profile.id)
        .eq("content_type", "article");
      setSavedIds(new Set((rows||[]).map(r => r.content_id)));
    }
  }

  async function fetchNews() {
    setError(null);
    try {
      let query = supabase
        .from("articles")
        .select("*")
        .order("published_at", { ascending:false })
        .limit(100);

      if(activeCategory !== "all") {
        query = query.contains("target_profession", [activeCategory]);
      }

      if(filtered && userProfession) {
        query = query.or(
          `target_profession.cs.{"todos"},target_profession.cs.{"${userProfession}"}`
        );
      }

      const { data, error } = await query;
      if(error) throw error;
      setNews(data || []);
    } catch(err) {
      setError("No se pudieron cargar los artículos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleToggleSave(articleId) {
    if(!profileId) return;
    const wasSaved = savedIds.has(articleId);
    setSavedIds(prev => {
      const next = new Set(prev);
      wasSaved ? next.delete(articleId) : next.add(articleId);
      return next;
    });
    try {
      if(wasSaved) {
        await supabase.from("user_saved_content").delete()
          .eq("user_id", profileId)
          .eq("content_id", articleId)
          .eq("content_type", "article");
      } else {
        await supabase.from("user_saved_content").insert({
          user_id: profileId, content_id: articleId, content_type: "article",
        });
      }
    } catch(err) {
      // Revertir si falla
      setSavedIds(prev => {
        const next = new Set(prev);
        wasSaved ? next.add(articleId) : next.delete(articleId);
        return next;
      });
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    fetchNews();
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.cream }} edges={["top"]}>
      <StatusBar style="light"/>

      {/* Cabecera */}
      <View style={{ backgroundColor:C.teal800, paddingHorizontal:16, paddingTop:12, paddingBottom:14 }}>
        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
          <Text style={{ fontFamily:"Georgia", fontSize:20, color:"white" }}>
            Smart<Text style={{ color:C.teal300 }}>Pills</Text>
          </Text>
          <Pressable onPress={() => setFiltered(!filtered)}
            style={{ backgroundColor: filtered ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)", borderWidth:1, borderColor:"rgba(255,255,255,0.2)", borderRadius:14, paddingHorizontal:10, paddingVertical:4 }}>
            <Text style={{ fontSize:11, color:"white", fontWeight:"500" }}>
              {filtered ? `🎯 ${userProfession || "Mi profesión"}` : "🌐 Todo"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Filtros de categoría (horizontal scroll) */}
      <View style={{ backgroundColor:C.white, borderBottomWidth:1, borderBottomColor:C.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal:14, paddingVertical:10, gap:6 }}>
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat.key;
            return (
              <Pressable key={cat.key} onPress={() => setActiveCategory(cat.key)}
                style={{ paddingHorizontal:13, paddingVertical:6, borderRadius:16,
                  backgroundColor: active ? C.teal600 : "transparent",
                  borderWidth:1, borderColor: active ? C.teal600 : C.borderMd }}>
                <Text style={{ fontSize:12, fontWeight: active?"500":"400", color: active ? "white" : C.muted }}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista */}
      {loading ? (
        <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
          <ActivityIndicator size="large" color={C.teal600}/>
        </View>
      ) : error ? (
        <View style={{ flex:1, alignItems:"center", justifyContent:"center", padding:20 }}>
          <Text style={{ fontSize:13, color:C.coral500, marginBottom:10 }}>{error}</Text>
          <Pressable onPress={fetchNews}>
            <Text style={{ fontSize:13, color:C.teal600, fontWeight:"500" }}>Reintentar</Text>
          </Pressable>
        </View>
      ) : news.length === 0 ? (
        <View style={{ flex:1, alignItems:"center", justifyContent:"center", padding:24 }}>
          <Text style={{ fontSize:14, color:C.muted2, textAlign:"center", marginBottom:10 }}>
            No hay artículos para tu perfil.
          </Text>
          {filtered && (
            <Pressable onPress={() => setFiltered(false)}>
              <Text style={{ fontSize:13, color:C.teal600, fontWeight:"500" }}>Ver todos los artículos</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={news}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding:14 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[C.teal600]} tintColor={C.teal600}/>}
          renderItem={({item}) => (
            <NewsCard
              article={item}
              saved={savedIds.has(item.id)}
              onToggleSave={() => handleToggleSave(item.id)}
              onPress={() => router.push(`/article/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
