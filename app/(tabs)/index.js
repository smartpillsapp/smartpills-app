import { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { supabase } from "../../lib/supabase";
import ReelCard from "../../components/ReelCard";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal500:"#1d9e87", teal300:"#6dcfc0",
  cream:"#f7f5f0",
  ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  white:"#ffffff",
};

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

  // Visualizaciones: cada vez que un pill aparece en pantalla (≥50% visible)
  // sumamos +1 al contador. NO deduplicamos por usuario; si el mismo usuario
  // vuelve a verlo, se cuenta otra vez (es lo que pidió el usuario).
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50, minimumViewTime: 0 });
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    viewableItems.forEach(v => {
      const id = v?.item?.id;
      if (id) supabase.rpc("increment_article_views", { p_article_id: id }).then(() => {}, () => {});
    });
  });

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
        viewabilityConfig={viewabilityConfig.current}
        onViewableItemsChanged={onViewableItemsChanged.current}
      />
    </View>
  );
}
