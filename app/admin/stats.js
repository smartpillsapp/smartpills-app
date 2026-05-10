import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal500:"#1d9e87", teal300:"#6dcfc0", teal100:"#d4f0eb", teal50:"#edf8f6",
  coral500:"#d4522a", coral100:"#fae8e2", coral50:"#fdf4f1",
  amber500:"#d97706",
  cream:"#f7f5f0", white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)",
  badgeArticle:"#1a7a69", badgeNews:"#8a4a1a",
};

export default function AdminStats() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats]     = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      // 1) Cargar todos los pills (articles + news)
      const [artRes, newsRes, reactRes] = await Promise.all([
        supabase.from("articles").select("id, title, category, source_name, journal").limit(2000),
        supabase.from("news").select("id, title, category, source_name").limit(2000),
        supabase.from("reel_reactions").select("article_id, reaction"),
      ]);

      const articles = (artRes.data || []).map(a => ({ ...a, _kind:"article" }));
      const news     = (newsRes.data || []).map(n => ({ ...n, _kind:"news" }));
      const all      = [...articles, ...news];
      const allMap   = {};
      all.forEach(it => { allMap[it.id] = it; });

      // 2) Agregar reacciones por pill y por categoría
      const byPill     = {};   // article_id -> { likes, dislikes }
      const byCategory = {};   // category   -> { likes, dislikes }
      let totalLikes = 0;
      let totalDislikes = 0;

      (reactRes.data || []).forEach(r => {
        const pill = allMap[r.article_id];
        if(!pill) return; // reacción huérfana (pill borrado)

        if(!byPill[r.article_id]) byPill[r.article_id] = { likes:0, dislikes:0 };
        const cat = pill.category || "sin_categoría";
        if(!byCategory[cat]) byCategory[cat] = { likes:0, dislikes:0 };

        if(r.reaction === "like") {
          byPill[r.article_id].likes++;
          byCategory[cat].likes++;
          totalLikes++;
        } else if(r.reaction === "dislike") {
          byPill[r.article_id].dislikes++;
          byCategory[cat].dislikes++;
          totalDislikes++;
        }
      });

      // 3) Top 10 más gustados / más rechazados
      const enriched = all.map(it => ({
        ...it,
        likes:    byPill[it.id]?.likes    || 0,
        dislikes: byPill[it.id]?.dislikes || 0,
      }));
      const topLiked    = [...enriched].filter(it => it.likes    > 0).sort((a,b) => b.likes    - a.likes   ).slice(0, 10);
      const topDisliked = [...enriched].filter(it => it.dislikes > 0).sort((a,b) => b.dislikes - a.dislikes).slice(0, 10);

      // 4) Categorías ordenadas por total de reacciones
      const categoryList = Object.entries(byCategory)
        .map(([name, counts]) => ({ name, likes: counts.likes, dislikes: counts.dislikes, total: counts.likes + counts.dislikes }))
        .sort((a,b) => b.total - a.total);

      setStats({
        totalLikes, totalDislikes,
        totalReactions: totalLikes + totalDislikes,
        totalPills: all.length,
        topLiked, topDisliked, categoryList,
      });
    } catch(err) {
      console.error("Error cargando stats:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.teal800 }} edges={["top"]}>
      <StatusBar style="light"/>

      {/* Header */}
      <View style={{ backgroundColor:C.teal800, paddingHorizontal:16, paddingVertical:14 }}>
        <Pressable onPress={() => router.back()}
          style={{ alignSelf:"flex-start", backgroundColor:"rgba(255,255,255,0.12)", borderWidth:1, borderColor:"rgba(255,255,255,0.2)", borderRadius:8, paddingHorizontal:10, paddingVertical:4, marginBottom:10 }}>
          <Text style={{ fontSize:12, color:"white" }}>← Volver</Text>
        </Pressable>
        <Text style={{ fontSize:10, fontWeight:"500", letterSpacing:1.4, textTransform:"uppercase", color:C.teal300, marginBottom:4 }}>
          Panel admin
        </Text>
        <Text style={{ fontFamily:"Georgia", fontSize:22, color:"white" }}>
          📊 Estadísticas
        </Text>
      </View>

      {loading ? (
        <View style={{ flex:1, alignItems:"center", justifyContent:"center", backgroundColor:C.cream }}>
          <ActivityIndicator size="large" color={C.teal600}/>
        </View>
      ) : !stats ? (
        <View style={{ flex:1, alignItems:"center", justifyContent:"center", backgroundColor:C.cream, padding:24 }}>
          <Text style={{ fontSize:14, color:C.muted }}>No se pudieron cargar las estadísticas.</Text>
        </View>
      ) : (
        <ScrollView style={{ backgroundColor:C.cream }} contentContainerStyle={{ padding:16, paddingBottom:32 }}>

          {/* Resumen general */}
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={{ flexDirection:"row", gap:8, marginBottom:20 }}>
            <SummaryCard label="Pills totales"    value={stats.totalPills} color={C.teal600}/>
            <SummaryCard label="Reacciones"       value={stats.totalReactions} color={C.amber500}/>
          </View>
          <View style={{ flexDirection:"row", gap:8, marginBottom:24 }}>
            <SummaryCard label="❤️ Likes"   value={stats.totalLikes}    color={C.teal500}/>
            <SummaryCard label="👎 Dislikes" value={stats.totalDislikes} color={C.coral500}/>
          </View>

          {/* Top más gustados */}
          <Text style={styles.sectionTitle}>❤️ Top 10 más gustados</Text>
          {stats.topLiked.length === 0 ? (
            <Text style={styles.empty}>Aún no hay likes</Text>
          ) : (
            <View style={{ marginBottom:24 }}>
              {stats.topLiked.map((it, i) => (
                <RankRow key={it.id} index={i+1} item={it} count={it.likes} color={C.teal500} icon="heart"/>
              ))}
            </View>
          )}

          {/* Top más rechazados */}
          <Text style={styles.sectionTitle}>👎 Top 10 más rechazados</Text>
          {stats.topDisliked.length === 0 ? (
            <Text style={styles.empty}>Aún no hay dislikes</Text>
          ) : (
            <View style={{ marginBottom:24 }}>
              {stats.topDisliked.map((it, i) => (
                <RankRow key={it.id} index={i+1} item={it} count={it.dislikes} color={C.coral500} icon="thumbs-down"/>
              ))}
            </View>
          )}

          {/* Por categoría */}
          <Text style={styles.sectionTitle}>📊 Reacciones por categoría</Text>
          {stats.categoryList.length === 0 ? (
            <Text style={styles.empty}>Aún no hay datos por categoría</Text>
          ) : (
            <View style={{ backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:12, padding:14 }}>
              {stats.categoryList.map(cat => (
                <CategoryBar key={cat.name} cat={cat}/>
              ))}
            </View>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <View style={{
      flex:1, backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:12,
      padding:14, alignItems:"center",
    }}>
      <Text style={{ fontFamily:"Georgia", fontSize:26, color, marginBottom:4 }}>{value}</Text>
      <Text style={{ fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:0.6 }}>{label}</Text>
    </View>
  );
}

function RankRow({ index, item, count, color, icon }) {
  const isArticle = item._kind === "article";
  return (
    <View style={{
      backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:10,
      padding:12, marginBottom:8, flexDirection:"row", alignItems:"center", gap:10,
    }}>
      <View style={{ width:28, alignItems:"center" }}>
        <Text style={{ fontSize:14, fontWeight:"700", color:C.muted2 }}>#{index}</Text>
      </View>
      <View style={{ flex:1, minWidth:0 }}>
        <Text style={{ fontSize:13, fontWeight:"600", color:C.ink, lineHeight:17 }} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={{ fontSize:10, color:C.muted2, textTransform:"uppercase", letterSpacing:0.5, marginTop:3 }}>
          {isArticle ? "💊 Artículo" : "📰 Noticia"} · {(item.category || "").replace(/_/g, " ") || "—"}
        </Text>
      </View>
      <View style={{ flexDirection:"row", alignItems:"center", gap:4, paddingHorizontal:10, paddingVertical:5, backgroundColor: color === C.teal500 ? "#e6f5f1" : "#fbe5dd", borderRadius:6 }}>
        <Ionicons name={icon} size={13} color={color}/>
        <Text style={{ fontSize:13, fontWeight:"700", color }}>{count}</Text>
      </View>
    </View>
  );
}

function CategoryBar({ cat }) {
  const total = Math.max(1, cat.likes + cat.dislikes);
  const likePct    = (cat.likes    / total) * 100;
  const dislikePct = (cat.dislikes / total) * 100;
  return (
    <View style={{ marginBottom:12 }}>
      <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:5 }}>
        <Text style={{ fontSize:13, color:C.ink, fontWeight:"600", textTransform:"capitalize" }}>
          {(cat.name || "—").replace(/_/g, " ")}
        </Text>
        <Text style={{ fontSize:11, color:C.muted2 }}>
          {cat.likes} ❤️ · {cat.dislikes} 👎
        </Text>
      </View>
      <View style={{ flexDirection:"row", height:8, borderRadius:4, overflow:"hidden", backgroundColor:"#f0f0f0" }}>
        {cat.likes > 0    && <View style={{ width: `${likePct}%`,    backgroundColor:C.teal500 }}/>}
        {cat.dislikes > 0 && <View style={{ width: `${dislikePct}%`, backgroundColor:C.coral500 }}/>}
      </View>
    </View>
  );
}

const styles = {
  sectionTitle: { fontSize:11, fontWeight:"600", letterSpacing:1.2, textTransform:"uppercase", color:C.muted2, marginBottom:10 },
  empty:        { fontSize:13, color:C.muted2, fontStyle:"italic", marginBottom:24, textAlign:"center" },
};
