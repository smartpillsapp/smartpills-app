import { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, Pressable, Image, ActivityIndicator, Share, Linking, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../lib/supabase";
import { pickPillImage } from "../../lib/pill-images";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal500:"#1d9e87", teal300:"#6dcfc0",
  cream:"#f7f5f0",
  ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  white:"#ffffff",
};


function timeAgo(dateString) {
  if(!dateString) return "";
  const diff  = Date.now() - new Date(dateString).getTime();
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(hours / 24);
  if(days  > 0) return `Hace ${days}d`;
  if(hours > 0) return `Hace ${hours}h`;
  return "Ahora";
}

async function handleShare(article) {
  try {
    // URL que abre SmartPills directamente en este pill. Si la app no está
    // instalada, la página redirectora muestra la opción de descargarla.
    const pillUrl = `https://smartpills-legal.vercel.app/pill?id=${encodeURIComponent(article.id)}`;
    const message = `💊 ${article.title}\n\n${(article.ai_summary || "").slice(0, 140)}${(article.ai_summary || "").length > 140 ? "..." : ""}\n\n📖 Léelo en SmartPills:\n${pillUrl}`;
    await Share.share({
      message,
      title: article.title,
      url:   pillUrl,
    });
  } catch(err) {
    console.error("Error compartiendo:", err);
  }
}

function ActionButton({ icon, active, activeColor, onPress }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ alignItems:"center" }}>
      <View style={{
        width:46, height:46, borderRadius:23,
        backgroundColor: active ? activeColor : "rgba(15,61,53,0.55)",
        alignItems:"center", justifyContent:"center",
        transform:[{ scale: active ? 1.08 : 1 }],
      }}>
        <Ionicons name={icon} size={20} color="white"/>
      </View>
    </Pressable>
  );
}

function ReelCard({ article, cardHeight, saved, onSave, reaction, onReact, topInset }) {
  const imgUrl    = pickPillImage(article);
  const halfHeight = cardHeight * 0.42;
  const likeColor = "#1d9e87";
  const saveColor = "#1d9e87";
  const lastTapRef = useRef(0);

  function handleDoubleTap() {
    const now = Date.now();
    if(now - lastTapRef.current < 300) {
      if(reaction !== "like") onReact(article, "like");
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }

  return (
    <Pressable onPress={handleDoubleTap} style={{ width:"100%", height:cardHeight, backgroundColor:C.cream }}>

      {/* Mitad superior — imagen */}
      <View style={{ height:halfHeight, position:"relative" }}>
        <Image source={{ uri:imgUrl }} style={{ width:"100%", height:"100%" }} resizeMode="cover"/>

        <LinearGradient
          colors={[
            "rgba(247,245,240,0)",
            "rgba(247,245,240,0.15)",
            "rgba(247,245,240,0.4)",
            "rgba(247,245,240,0.75)",
            "rgba(247,245,240,1)",
          ]}
          locations={[0, 0.35, 0.6, 0.85, 1]}
          style={{ position:"absolute", bottom:0, left:0, right:0, height:"35%" }}/>

        {/* Cabecera flotante */}
        <View style={{ position:"absolute", top: topInset + 14, left:16, right:16, flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
          <Text style={{ fontFamily:"Georgia", fontSize:17, color:"white", textShadowColor:"rgba(0,0,0,0.5)", textShadowRadius:4 }}>
            Smart<Text style={{ color:C.teal300 }}>Pills</Text>
          </Text>
          <View style={{ backgroundColor:"rgba(0,0,0,0.4)", paddingHorizontal:10, paddingVertical:3, borderRadius:10 }}>
            <Text style={{ fontSize:10, color:"rgba(255,255,255,0.9)" }}>{timeAgo(article.published_at)}</Text>
          </View>
        </View>

      </View>

      {/* Botones laterales — anclados justo debajo de la cabecera */}
      <View style={{ position:"absolute", right:12, top: topInset + 50, gap:10, alignItems:"center", zIndex:10 }}>
        <ActionButton icon={reaction==="like"?"heart":"heart-outline"}
          active={reaction==="like"} activeColor={likeColor}
          onPress={() => onReact(article, "like")}/>
        <ActionButton icon={reaction==="dislike"?"thumbs-down":"thumbs-down-outline"}
          active={reaction==="dislike"} activeColor="#d4522a"
          onPress={() => onReact(article, "dislike")}/>
        <ActionButton icon={saved?"bookmark":"bookmark-outline"}
          active={saved} activeColor={saveColor}
          onPress={() => onSave(article)}/>
        <ActionButton icon="open-outline"
          active={false} activeColor="white"
          onPress={() => article.source_url && Linking.openURL(article.source_url)}/>
        <ActionButton icon="share-social-outline"
          active={false} activeColor="white"
          onPress={() => handleShare(article)}/>
      </View>

      {/* Mitad inferior — texto */}
      <View style={{ flex:1, paddingHorizontal:18, paddingTop:30, paddingBottom:16 }}>
        <Text style={{ fontSize:12, fontWeight:"600", color:"#e8967e", textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>
          {article.source_name || article.journal}
        </Text>

        <Text numberOfLines={4} style={{ fontFamily:"Georgia", fontSize:19, lineHeight:25, fontWeight:"bold", color:C.ink, marginBottom:10 }}>
          {article.title}
        </Text>

        {article.ai_summary && (
          <Text style={{ fontSize:16, lineHeight:26, color:"#4a5d55" }}>
            {article.ai_summary}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export default function Feed() {
  const [articles, setArticles]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saved, setSaved]         = useState({});
  const [reactions, setReactions] = useState({});
  const [profileId, setProfileId] = useState(null);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const TAB_BAR_HEIGHT = 74;
  const cardHeight = windowHeight - TAB_BAR_HEIGHT;

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if(!user) return;

      const { data:profile } = await supabase
        .from("profiles").select("id, personalized_feed_enabled").eq("auth_user_id", user.id).single();
      if(!profile) return;
      setProfileId(profile.id);
      const personalized = profile.personalized_feed_enabled !== false; // default true

      // Reacciones previas (no diferenciamos por tipo, los UUIDs son únicos)
      const { data:prevReactions } = await supabase
        .from("reel_reactions").select("article_id, reaction").eq("user_id", profile.id);
      const reactMap = {};
      (prevReactions || []).forEach(r => { reactMap[r.article_id] = r.reaction; });
      setReactions(reactMap);

      // Guardados previos (todos van como "article" tras la unificación)
      const { data:savedRows } = await supabase
        .from("user_saved_content").select("content_id, content_type")
        .eq("user_id", profile.id)
        .eq("content_type", "article");
      const savedMap = {};
      (savedRows || []).forEach(r => { savedMap[r.content_id] = true; });
      setSaved(savedMap);

      // Cargar pills desde la única tabla `articles`:
      //  - SIEMPRE los fijados (sin límite, da igual cuándo se publicaron)
      //  - Más los 50 más recientes no fijados
      const [pinnedArtRes, recentArtRes] = await Promise.all([
        supabase.from("articles").select("*").not("pin_position", "is", null).order("pin_position", { ascending:true }),
        supabase.from("articles").select("*").is("pin_position", null).order("published_at", { ascending:false }).limit(50),
      ]);

      const all = [
        ...(pinnedArtRes.data || []),
        ...(recentArtRes.data || []),
      ].map(a => ({ ...a, _source:"article" }));

      // Algoritmo de personalización: score por categoría según reacciones del usuario
      let categoryScores = {};
      if(personalized && (prevReactions || []).length > 0) {
        // Mapa rápido: article_id → categoría (de los pills cargados)
        const catFromLoaded = {};
        all.forEach(a => { catFromLoaded[a.id] = a.category; });

        // Para reacciones a pills NO cargados, una query adicional
        const reactedIds = prevReactions.map(r => r.article_id);
        const missingIds = reactedIds.filter(id => !catFromLoaded[id]);
        let extraCats = {};
        if(missingIds.length > 0) {
          const { data: extraArt } = await supabase
            .from("articles").select("id, category").in("id", missingIds);
          (extraArt || []).forEach(a => { extraCats[a.id] = a.category; });
        }

        // Construir scores: like = +2, dislike = -1
        prevReactions.forEach(r => {
          const cat = catFromLoaded[r.article_id] || extraCats[r.article_id];
          if(!cat) return;
          if(!categoryScores[cat]) categoryScores[cat] = 0;
          categoryScores[cat] += (r.reaction === "like" ? 2 : -1);
        });
      }

      // Función de score combinada: preferencia de categoría + frescura
      function scorePill(p) {
        const catScore  = categoryScores[p.category] || 0;
        const ageDays   = (Date.now() - new Date(p.published_at || 0).getTime()) / (1000 * 60 * 60 * 24);
        const recency   = Math.max(0, 30 - ageDays); // 0 después de 30 días
        return catScore * 5 + recency;
      }

      // Pinned primero (por pin_position asc); después el resto:
      //  - Si personalized: por score (categoría preferida + frescura)
      //  - Si NO personalized: solo por fecha
      const pinned = all.filter(a => a.pin_position != null)
        .sort((a, b) => {
          if(a.pin_position !== b.pin_position) return a.pin_position - b.pin_position;
          return new Date(b.published_at || 0) - new Date(a.published_at || 0);
        });
      const notPinned = all.filter(a => a.pin_position == null)
        .sort((a, b) => personalized
          ? scorePill(b) - scorePill(a)
          : new Date(b.published_at || 0) - new Date(a.published_at || 0));
      const combined = [...pinned, ...notPinned];

      // Filtrar los que no me gustaron (para que no vuelvan a salir)
      const dislikedIds = (prevReactions || []).filter(r => r.reaction === "dislike").map(r => r.article_id);
      const filtered = combined.filter(a => !dislikedIds.includes(a.id));

      setArticles(filtered);
    } catch(err) {
      console.error("Error cargando feed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleReact(item, type) {
    if(!profileId) return;
    const articleId = item.id;
    const current = reactions[articleId];
    const newReaction = current === type ? null : type;

    setReactions(r => ({ ...r, [articleId]: newReaction }));
    try {
      if(newReaction === null) {
        await supabase.from("reel_reactions").delete()
          .eq("user_id", profileId).eq("article_id", articleId);
      } else {
        await supabase.from("reel_reactions").upsert(
          { user_id: profileId, article_id: articleId, reaction: newReaction },
          { onConflict: "user_id,article_id" }
        );
      }
      if(newReaction === "dislike") {
        setTimeout(() => setArticles(prev => prev.filter(a => a.id !== articleId)), 800);
      }
    } catch(err) {
      setReactions(r => ({ ...r, [articleId]: current }));
    }
  }

  async function handleSave(item) {
    if(!profileId) return;
    const articleId = item.id;
    const wasSaved = !!saved[articleId];
    setSaved(s => ({ ...s, [articleId]: !wasSaved }));
    try {
      if(wasSaved) {
        await supabase.from("user_saved_content").delete()
          .eq("user_id", profileId).eq("content_id", articleId).eq("content_type", "article");
      } else {
        await supabase.from("user_saved_content").insert({
          user_id: profileId, content_id: articleId, content_type: "article",
        });
      }
    } catch(err) {
      setSaved(s => ({ ...s, [articleId]: wasSaved }));
    }
  }

  if(loading) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor:C.cream, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator size="large" color={C.teal600}/>
      </SafeAreaView>
    );
  }

  if(articles.length === 0) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor:C.cream, alignItems:"center", justifyContent:"center", padding:24 }}>
        <Text style={{ fontSize:32, marginBottom:12 }}>👍</Text>
        <Text style={{ fontSize:14, color:C.muted2, textAlign:"center" }}>
          Has visto todo el contenido. ¡Vuelve pronto!
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex:1, backgroundColor:C.cream }}>
      <StatusBar style="light"/>
      <FlatList
        data={articles}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ReelCard
            article={item}
            cardHeight={cardHeight}
            topInset={insets.top}
            saved={!!saved[item.id]}
            onSave={handleSave}
            reaction={reactions[item.id] || null}
            onReact={handleReact}
          />
        )}
        pagingEnabled
        snapToInterval={cardHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: cardHeight, offset: cardHeight * index, index })}
      />
    </View>
  );
}
