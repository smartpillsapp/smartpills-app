import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal500:"#1d9e87", teal300:"#6dcfc0", teal100:"#d4f0eb", teal50:"#edf8f6",
  coral500:"#d4522a", coral100:"#fae8e2", coral50:"#fdf4f1",
  cream:"#f7f5f0", cream2:"#f0ede6",
  white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)",
};

const CATEGORY_IMAGES = {
  urgencias:            "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800&q=90",
  enfermería:           "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=90",
  farmacología:         "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=90",
  cardiología:          "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=800&q=90",
  pediatría:            "https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=800&q=90",
  oncología:            "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&q=90",
  investigación_clínica:"https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=90",
  noticias_sanitarias:  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=90",
  seguridad:            "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=90",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=90";

const CATEGORY_COLORS = {
  urgencias:"#c8401a", enfermería:"#3c3489", farmacología:"#1a7a69",
  cardiología:"#1a5a8a", pediatría:"#2d7a3a", oncología:"#7a3a8a",
  investigación_clínica:"#8a6a1a", noticias_sanitarias:"#1a7a69", seguridad:"#c8401a",
};

function timeAgo(dateString) {
  if(!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(hours / 24);
  if(days > 0)  return `Hace ${days} día${days>1?"s":""}`;
  if(hours > 0) return `Hace ${hours}h`;
  return "Hace unos minutos";
}

export default function ArticleDetail() {
  const { id }   = useLocalSearchParams();
  const router   = useRouter();
  const [article, setArticle]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [profileId, setProfileId] = useState(null);
  const [saved, setSaved]       = useState(false);

  useEffect(() => { loadAll(); }, [id]);

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
          const { data:savedRow } = await supabase
            .from("user_saved_content")
            .select("id")
            .eq("user_id", profile.id)
            .eq("content_id", id)
            .eq("content_type", "article")
            .maybeSingle();
          setSaved(!!savedRow);
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

  async function handleToggleSave() {
    if(!profileId || !article) return;
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      if(wasSaved) {
        await supabase.from("user_saved_content").delete()
          .eq("user_id", profileId)
          .eq("content_id", article.id)
          .eq("content_type", "article");
      } else {
        await supabase.from("user_saved_content").insert({
          user_id: profileId, content_id: article.id, content_type: "article",
        });
      }
    } catch(err) {
      setSaved(wasSaved);
    }
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
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontSize:13, color:C.teal600, fontWeight:"500" }}>← Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const imgUrl   = CATEGORY_IMAGES[article.category] || DEFAULT_IMAGE;
  const catColor = CATEGORY_COLORS[article.category] || "#1a7a69";

  let keyPoints = article.key_points;
  if(typeof keyPoints === "string") {
    try { keyPoints = JSON.parse(keyPoints); } catch { keyPoints = []; }
  }
  if(!Array.isArray(keyPoints)) keyPoints = [];

  return (
    <View style={{ flex:1, backgroundColor:C.cream }}>
      <StatusBar style="light"/>
      <ScrollView contentContainerStyle={{ flexGrow:1 }}>

        {/* Imagen cabecera con botones flotantes */}
        <View style={{ position:"relative", height:240 }}>
          <Image source={{ uri:imgUrl }} style={{ width:"100%", height:"100%" }}/>
          <View style={{ position:"absolute", bottom:0, left:0, right:0, height:"60%", backgroundColor:"rgba(0,0,0,0.4)" }}/>

          {/* Botón atrás */}
          <SafeAreaView edges={["top"]} style={{ position:"absolute", top:0, left:0, right:0 }}>
            <View style={{ flexDirection:"row", justifyContent:"space-between", padding:14 }}>
              <Pressable onPress={() => router.back()}
                style={{ backgroundColor:"rgba(0,0,0,0.45)", paddingHorizontal:14, paddingVertical:8, borderRadius:20, flexDirection:"row", alignItems:"center", gap:6 }}>
                <Ionicons name="arrow-back" size={14} color="white"/>
                <Text style={{ color:"white", fontSize:13, fontWeight:"500" }}>Volver</Text>
              </Pressable>
              <Pressable onPress={handleToggleSave}
                style={{ backgroundColor:"rgba(0,0,0,0.45)", paddingHorizontal:14, paddingVertical:8, borderRadius:20, flexDirection:"row", alignItems:"center", gap:6 }}>
                <Ionicons name={saved?"bookmark":"bookmark-outline"} size={14} color="white"/>
                <Text style={{ color:"white", fontSize:13 }}>{saved?"Guardado":"Guardar"}</Text>
              </Pressable>
            </View>
          </SafeAreaView>

          {/* Badge categoría */}
          <View style={{ position:"absolute", bottom:14, left:16 }}>
            <View style={{ backgroundColor:catColor, paddingHorizontal:12, paddingVertical:4, borderRadius:20 }}>
              <Text style={{ color:"white", fontSize:10, fontWeight:"600", textTransform:"uppercase", letterSpacing:0.8 }}>
                {(article.category || "").replace(/_/g, " ")}
              </Text>
            </View>
          </View>
        </View>

        {/* Contenido */}
        <View style={{ padding:18 }}>

          {/* Fuente y fecha */}
          <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <Text style={{ fontSize:12, fontWeight:"600", color:C.muted2, textTransform:"uppercase", letterSpacing:0.5, flex:1 }}>
              {article.journal || article.source_name}
            </Text>
            <Text style={{ fontSize:12, color:C.muted2 }}>{timeAgo(article.published_at)}</Text>
          </View>

          {/* Título */}
          <Text style={{ fontFamily:"Georgia", fontSize:22, lineHeight:29, fontWeight:"bold", color:C.ink, marginBottom:16 }}>
            {article.title}
          </Text>

          {/* Tags */}
          {(article.tags || []).length > 0 && (
            <View style={{ flexDirection:"row", flexWrap:"wrap", gap:6, marginBottom:16 }}>
              {article.tags.map((tag, i) => (
                <View key={i} style={{ backgroundColor:"#ede9e2", paddingHorizontal:10, paddingVertical:3, borderRadius:8 }}>
                  <Text style={{ fontSize:11, color:C.muted }}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Ideas clave */}
          {keyPoints.length > 0 && (
            <View style={{ backgroundColor:C.teal50, borderWidth:1, borderColor:C.teal100, borderRadius:12, padding:16, marginBottom:20 }}>
              <Text style={{ fontSize:11, fontWeight:"700", color:C.teal600, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>
                💡 Ideas clave
              </Text>
              {keyPoints.slice(0, 3).map((point, i) => (
                <View key={i} style={{ flexDirection:"row", gap:8, marginBottom:i < keyPoints.length-1 ? 8 : 0 }}>
                  <View style={{ width:20, height:20, borderRadius:10, backgroundColor:C.teal600, alignItems:"center", justifyContent:"center", marginTop:1 }}>
                    <Ionicons name="checkmark" size={12} color="white"/>
                  </View>
                  <Text style={{ flex:1, fontSize:13, lineHeight:19, color:C.ink }}>{point}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Resumen extendido */}
          {(article.extended_summary || article.ai_summary) && (
            <View style={{ marginBottom:24 }}>
              <Text style={{ fontSize:11, fontWeight:"700", color:C.muted2, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>
                Resumen
              </Text>
              <Text style={{ fontSize:15, lineHeight:25, color:"#4a5d55" }}>
                {article.extended_summary || article.ai_summary}
              </Text>
            </View>
          )}

          {/* Botón leer original */}
          {article.source_url && (
            <Pressable onPress={() => Linking.openURL(article.source_url)}
              style={({pressed}) => ({ backgroundColor:C.teal600, paddingVertical:14, borderRadius:12, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8, opacity: pressed ? 0.85 : 1 })}>
              <Ionicons name="open-outline" size={16} color="white"/>
              <Text style={{ color:"white", fontSize:14, fontWeight:"500" }}>Leer original</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
