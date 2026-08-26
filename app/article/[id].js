// Pantalla individual del pill. Se llega aquí por:
//   - El deep link compartido (smartpills://article/{id} → web → app).
//   - La pestaña "Guardados" cuando el usuario abre un pill que guardó.
//
// Renderiza el mismo ReelCard del feed a pantalla completa, con un botón
// "← Volver" flotante para que el usuario tenga salida (no tiene pestañas).

import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, ActivityIndicator, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import ReelCard from "../../components/ReelCard";

const C = {
  teal600:"#1a7a69", cream:"#f7f5f0",
  muted:"#607068", muted2:"#96a89f",
};

export default function ArticleDetail() {
  const { id }   = useLocalSearchParams();
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const [article, setArticle]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [profileId, setProfileId] = useState(null);
  const [saved, setSaved]         = useState(false);
  const [reaction, setReaction]   = useState(null);

  useEffect(() => { if(id) loadAll(); }, [id]);

  // Suma una visualización cada vez que se abre la pantalla
  // (sin deduplicar entre aperturas: cada vez cuenta).
  useEffect(() => {
    if (!id) return;
    supabase.rpc("increment_article_views", { p_article_id: id }).then(() => {}, () => {});
  }, [id]);

  async function loadAll() {
    setLoading(true);
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if(user) {
        const { data:profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();
        if(profile) {
          setProfileId(profile.id);
          const [{ data:savedRow }, { data:reactionRow }] = await Promise.all([
            supabase.from("user_saved_content").select("id")
              .eq("user_id", profile.id).eq("content_id", id).eq("content_type", "article")
              .maybeSingle(),
            supabase.from("reel_reactions").select("reaction")
              .eq("user_id", profile.id).eq("article_id", id)
              .maybeSingle(),
          ]);
          setSaved(!!savedRow);
          setReaction(reactionRow?.reaction || null);
        }
      }

      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .single();
      if(error) throw error;
      setArticle(data);
    } catch(err) {
      console.error("Error cargando artículo:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = useCallback(async () => {
    if(!profileId || !article) return;
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      if(wasSaved) {
        await supabase.from("user_saved_content").delete()
          .eq("user_id", profileId).eq("content_id", article.id).eq("content_type", "article");
      } else {
        await supabase.from("user_saved_content").insert({
          user_id: profileId, content_id: article.id, content_type: "article",
        });
      }
    } catch {
      setSaved(wasSaved);
    }
  }, [profileId, article, saved]);

  const handleReact = useCallback(async (item, type) => {
    if(!profileId || !item) return;
    const current = reaction;
    const newReaction = current === type ? null : type;
    setReaction(newReaction);
    try {
      if(newReaction === null) {
        await supabase.from("reel_reactions").delete()
          .eq("user_id", profileId).eq("article_id", item.id);
      } else {
        await supabase.from("reel_reactions").upsert(
          { user_id: profileId, article_id: item.id, reaction: newReaction },
          { onConflict: "user_id,article_id" }
        );
      }
    } catch {
      setReaction(current);
    }
  }, [profileId, reaction]);

  function goBack() {
    if(router.canGoBack && router.canGoBack()) router.back();
    else router.replace("/");
  }

  if(loading) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor:C.cream, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator size="large" color={C.teal600}/>
      </SafeAreaView>
    );
  }

  if(!article) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor:C.cream, alignItems:"center", justifyContent:"center", padding:20 }}>
        <Text style={{ fontSize:14, color:C.muted, marginBottom:16 }}>Artículo no encontrado</Text>
        <Pressable onPress={goBack}>
          <Text style={{ fontSize:13, color:C.teal600, fontWeight:"500" }}>← Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex:1, backgroundColor:C.cream }}>
      <StatusBar style="light"/>
      <ReelCard
        article={article}
        cardHeight={windowHeight}
        topInset={insets.top}
        saved={saved}
        onSave={handleSave}
        reaction={reaction}
        onReact={handleReact}
      />

      {/* Botón Volver flotante. Se posiciona abajo a la izquierda del
          recuadro blanco para no chocar con el logo SmartPills ni con los
          botones laterales. */}
      <Pressable onPress={goBack}
        style={({ pressed }) => ({
          position:"absolute", left:14, bottom: insets.bottom + 22,
          flexDirection:"row", alignItems:"center", gap:5,
          backgroundColor:"rgba(15,61,53,0.85)",
          paddingHorizontal:12, paddingVertical:7, borderRadius:14,
          opacity: pressed ? 0.85 : 1,
        })}>
        <Ionicons name="chevron-back" size={14} color="white"/>
        <Text style={{ color:"white", fontSize:12, fontWeight:"600" }}>Volver</Text>
      </Pressable>
    </View>
  );
}
