import { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal300:"#6dcfc0", teal50:"#edf8f6",
  coral500:"#d4522a", coral100:"#fae8e2",
  cream:"#f7f5f0",
  white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)",
  badgeArticle:"#1a7a69", badgeNews:"#8a4a1a",
};

function sortByPinThenDate(items) {
  const pinned    = items.filter(it => it.pin_position != null);
  const notPinned = items.filter(it => it.pin_position == null);
  pinned.sort((a, b) => {
    if(a.pin_position !== b.pin_position) return a.pin_position - b.pin_position;
    return new Date(b.published_at || 0) - new Date(a.published_at || 0);
  });
  notPinned.sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));
  return [...pinned, ...notPinned];
}

export default function AdminPills() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    setLoading(true);
    try {
      const [artRes, newsRes] = await Promise.all([
        supabase.from("articles").select("*").order("published_at", { ascending:false }),
        supabase.from("news").select("*").order("published_at", { ascending:false }),
      ]);
      const articles = (artRes.data || []).map(a => ({ ...a, _kind:"article" }));
      const news     = (newsRes.data || []).map(n => ({ ...n, _kind:"news" }));
      const all = [...articles, ...news];

      // Contar likes/dislikes por pill — cargamos TODAS las reacciones (admin las ve)
      let countsByArticle = {};
      const { data: reactions } = await supabase
        .from("reel_reactions")
        .select("article_id, reaction");
      (reactions || []).forEach(r => {
        if(!countsByArticle[r.article_id]) countsByArticle[r.article_id] = { likes:0, dislikes:0 };
        if(r.reaction === "like")    countsByArticle[r.article_id].likes++;
        if(r.reaction === "dislike") countsByArticle[r.article_id].dislikes++;
      });
      const enriched = all.map(it => ({
        ...it,
        _likes:    countsByArticle[it.id]?.likes    || 0,
        _dislikes: countsByArticle[it.id]?.dislikes || 0,
      }));

      const combined = sortByPinThenDate(enriched);
      setItems(combined);
    } finally {
      setLoading(false);
    }
  }

  function handleNew() {
    Alert.alert(
      "¿Qué quieres crear?",
      "Elige el tipo de contenido",
      [
        { text:"Cancelar", style:"cancel" },
        { text:"💊 Artículo", onPress: () => router.push({ pathname:"/admin/pill-form", params:{ kind:"article" } }) },
        { text:"📰 Noticia",  onPress: () => router.push({ pathname:"/admin/pill-form", params:{ kind:"news"    } }) },
      ]
    );
  }

  async function handleDelete(item) {
    const table = item._kind === "article" ? "articles" : "news";
    Alert.alert(
      "¿Eliminar?",
      `Vas a borrar "${item.title}". Esta acción no se puede deshacer.`,
      [
        { text:"Cancelar", style:"cancel" },
        {
          text:"Eliminar", style:"destructive",
          onPress: async () => {
            const { error } = await supabase.from(table).delete().eq("id", item.id);
            if(error) Alert.alert("Error", error.message);
            else load();
          },
        },
      ]
    );
  }

  const q = search.toLowerCase();
  const filtered = !q ? items : items.filter(it =>
    (it.title || "").toLowerCase().includes(q) ||
    (it.category || "").toLowerCase().includes(q) ||
    (it.source_name || "").toLowerCase().includes(q) ||
    (it.journal || "").toLowerCase().includes(q)
  );

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.teal800 }} edges={["top"]}>
      <StatusBar style="light"/>

      <View style={{ backgroundColor:C.teal800, paddingHorizontal:16, paddingVertical:14 }}>
        <Pressable onPress={() => router.back()}
          style={{ alignSelf:"flex-start", backgroundColor:"rgba(255,255,255,0.12)", borderWidth:1, borderColor:"rgba(255,255,255,0.2)", borderRadius:8, paddingHorizontal:10, paddingVertical:4, marginBottom:10 }}>
          <Text style={{ fontSize:12, color:"white" }}>← Volver</Text>
        </Pressable>

        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <View style={{ flex:1 }}>
            <Text style={{ fontSize:10, fontWeight:"500", letterSpacing:1.4, textTransform:"uppercase", color:C.teal300, marginBottom:4 }}>
              Panel admin
            </Text>
            <Text style={{ fontFamily:"Georgia", fontSize:22, color:"white" }}>
              Pills
            </Text>
          </View>
          <Pressable onPress={handleNew}
            style={({pressed}) => ({
              backgroundColor: pressed ? "#bf4624" : C.coral500,
              borderRadius:24, paddingHorizontal:16, paddingVertical:10,
              flexDirection:"row", alignItems:"center", gap:6,
            })}>
            <Ionicons name="add" size={18} color="white"/>
            <Text style={{ color:"white", fontSize:13, fontWeight:"600" }}>Nueva</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection:"row", alignItems:"center", backgroundColor:"rgba(255,255,255,0.12)", borderWidth:1, borderColor:"rgba(255,255,255,0.18)", borderRadius:10, paddingHorizontal:12, height:40, gap:8 }}>
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.6)"/>
          <TextInput value={search} onChangeText={setSearch}
            placeholder="Buscar por título, categoría, fuente..."
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
            <Text style={{ fontSize:38, marginBottom:12 }}>💊</Text>
            <Text style={{ fontFamily:"Georgia", fontSize:16, color:C.ink }}>
              {search ? "Sin resultados" : "Sin pills todavía"}
            </Text>
            <Text style={{ fontSize:13, color:C.muted2, marginTop:6, textAlign:"center" }}>
              {search ? "Prueba con otra búsqueda" : "Pulsa \"Nueva\" para añadir el primero."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => `${item._kind}-${item.id}`}
            contentContainerStyle={{ padding:14 }}
            renderItem={({ item }) => {
              const isArticle = item._kind === "article";
              const isPinned  = item.pin_position != null;
              return (
                <View style={{
                  backgroundColor:C.white, borderRadius:14, padding:14, marginBottom:10,
                  borderLeftWidth: isPinned ? 4 : 0, borderLeftColor: C.coral500,
                  shadowColor:"#000", shadowOpacity:0.05, shadowRadius:5, shadowOffset:{ width:0, height:2 }, elevation:2,
                }}>
                  <View style={{ flexDirection:"row", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                    {isPinned && (
                      <View style={{
                        backgroundColor: C.coral500,
                        paddingHorizontal:8, paddingVertical:2, borderRadius:6,
                      }}>
                        <Text style={{ fontSize:10, color:"white", fontWeight:"700", letterSpacing:0.6 }}>
                          📌 POSICIÓN {item.pin_position}
                        </Text>
                      </View>
                    )}
                    <View style={{
                      backgroundColor: isArticle ? C.badgeArticle : C.badgeNews,
                      paddingHorizontal:8, paddingVertical:2, borderRadius:6,
                    }}>
                      <Text style={{ fontSize:10, color:"white", fontWeight:"700", letterSpacing:0.6 }}>
                        {isArticle ? "💊 ARTÍCULO" : "📰 NOTICIA"}
                      </Text>
                    </View>
                    {item.category ? (
                      <Text style={{ fontSize:10, color:C.muted2, textTransform:"uppercase", letterSpacing:0.5 }}>
                        {item.category.replace(/_/g, " ")}
                      </Text>
                    ) : null}
                  </View>

                  <Text style={{ fontSize:15, fontWeight:"700", color:C.ink, marginBottom:4, lineHeight:20 }}>
                    {item.title}
                  </Text>
                  <View style={{ flexDirection:"row", alignItems:"center", gap:8, marginBottom:8, flexWrap:"wrap" }}>
                    <Text style={{ fontSize:11, color:C.muted }}>
                      {item.journal || item.source_name || "Sin fuente"}
                    </Text>
                    <View style={{ flexDirection:"row", gap:6 }}>
                      <View style={{ flexDirection:"row", alignItems:"center", gap:3, backgroundColor:"#e6f5f1", paddingHorizontal:6, paddingVertical:2, borderRadius:5 }}>
                        <Ionicons name="heart" size={11} color="#1d9e87"/>
                        <Text style={{ fontSize:11, color:"#1d9e87", fontWeight:"700" }}>{item._likes}</Text>
                      </View>
                      <View style={{ flexDirection:"row", alignItems:"center", gap:3, backgroundColor:"#fbe5dd", paddingHorizontal:6, paddingVertical:2, borderRadius:5 }}>
                        <Ionicons name="thumbs-down" size={11} color={C.coral500}/>
                        <Text style={{ fontSize:11, color:C.coral500, fontWeight:"700" }}>{item._dislikes}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ flexDirection:"row", gap:8 }}>
                    <Pressable onPress={() => router.push({
                      pathname:"/admin/pill-form",
                      params:{ id:item.id, kind:item._kind },
                    })}
                      style={({pressed}) => ({
                        flex:1, backgroundColor:"#e6e6e6", borderRadius:10, paddingVertical:9,
                        flexDirection:"row", alignItems:"center", justifyContent:"center", gap:5,
                        opacity: pressed ? 0.85 : 1,
                      })}>
                      <Ionicons name="create-outline" size={15} color={C.teal600}/>
                      <Text style={{ fontSize:12, color:C.teal600, fontWeight:"600" }}>Editar</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDelete(item)}
                      style={({pressed}) => ({
                        flex:1, backgroundColor:C.coral100, borderRadius:10, paddingVertical:9,
                        flexDirection:"row", alignItems:"center", justifyContent:"center", gap:5,
                        opacity: pressed ? 0.85 : 1,
                      })}>
                      <Ionicons name="trash-outline" size={15} color={C.coral500}/>
                      <Text style={{ fontSize:12, color:C.coral500, fontWeight:"600" }}>Eliminar</Text>
                    </Pressable>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
