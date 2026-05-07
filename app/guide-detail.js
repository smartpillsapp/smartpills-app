import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, Linking, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal300:"#6dcfc0", teal50:"#edf8f6",
  coral500:"#d4522a", coral300:"#e8967e",
  cream:"#f7f5f0",
  white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)", borderMd:"rgba(28,43,38,0.16)",
  langEnglish:"#4169E1",
  langSpanish:"#800000",
  tagBg:"#eef2f5", tagText:"#5a6b73",
};

const DEFAULT_IMG = "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=90";

export default function GuideDetail() {
  const { id }   = useLocalSearchParams();
  const router   = useRouter();

  const [guide, setGuide]         = useState(null);
  const [loadingGuide, setLoadingGuide] = useState(true);
  const [profileId, setProfileId] = useState(null);
  const [saved, setSaved]         = useState(false);
  const [liked, setLiked]         = useState(false);

  useEffect(() => { loadAll(); }, [id]);

  async function loadAll() {
    setLoadingGuide(true);
    // 1) Cargar la guía desde Supabase
    const { data:g } = await supabase.from("clinical_guides_v2")
      .select("*").eq("id", id).single();
    setGuide(g);
    setLoadingGuide(false);

    // 2) Cargar estados saved/liked
    const { data:{ user } } = await supabase.auth.getUser();
    if(!user) return;
    const { data:profile } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).single();
    if(!profile) return;
    setProfileId(profile.id);
    const { data } = await supabase.from("user_saved_content")
      .select("content_type")
      .eq("user_id", profile.id).eq("content_id", id)
      .in("content_type", ["guide", "guide_like"]);
    if(data) {
      setSaved(data.some(r => r.content_type === "guide"));
      setLiked(data.some(r => r.content_type === "guide_like"));
    }
  }

  async function toggleEntry(contentType, isOn, setOn) {
    if(!profileId) return;
    const was = isOn;
    setOn(!was);
    try {
      if(was) {
        await supabase.from("user_saved_content").delete()
          .eq("user_id", profileId).eq("content_id", id).eq("content_type", contentType);
      } else {
        await supabase.from("user_saved_content").insert({
          user_id:profileId, content_id:id, content_type:contentType,
        });
      }
    } catch(err) {
      setOn(was);
    }
  }

  const toggleSave = () => toggleEntry("guide",      saved, setSaved);
  const toggleLike = () => toggleEntry("guide_like", liked, setLiked);

  if(loadingGuide) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor:C.cream, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator size="large" color={C.teal600}/>
      </SafeAreaView>
    );
  }

  if(!guide) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor:C.cream, alignItems:"center", justifyContent:"center", padding:24 }}>
        <Text style={{ fontSize:14, color:C.muted2 }}>Guía no encontrada.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop:16, padding:10 }}>
          <Text style={{ fontSize:13, color:C.teal600 }}>← Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const langStyle = guide.idioma === "ingles"
    ? { color:C.langEnglish, label:"Inglés" }
    : { color:C.langSpanish, label:"Castellano" };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.cream }} edges={["bottom"]}>
      <StatusBar style="light"/>

      <ScrollView contentContainerStyle={{ paddingBottom:32 }}>
        {/* Imagen superior */}
        <View style={{ width:"100%", height:260, position:"relative" }}>
          <Image source={{ uri: guide.imagen || DEFAULT_IMG }} style={{ width:"100%", height:"100%" }} resizeMode="cover"/>

          {/* Botón volver flotante */}
          <Pressable onPress={() => router.back()}
            style={{ position:"absolute", top:50, left:16, backgroundColor:"rgba(0,0,0,0.5)", borderRadius:20, paddingHorizontal:14, paddingVertical:6 }}>
            <Text style={{ fontSize:13, color:"white", fontWeight:"500" }}>← Volver</Text>
          </Pressable>
        </View>

        {/* Contenido */}
        <View style={{ padding:22 }}>
          {/* Idioma */}
          <Text style={{ color:langStyle.color, fontSize:12, fontWeight:"700", textTransform:"uppercase", letterSpacing:0.7, marginBottom:14 }}>
            {langStyle.label}
          </Text>

          {/* Título */}
          <Text style={{ fontFamily:"Georgia", fontSize:24, fontWeight:"bold", color:C.ink, marginBottom:14, lineHeight:30 }}>
            {guide.titulo}
          </Text>

          {/* Sociedad */}
          <Text style={{ fontSize:14, color:C.muted, marginBottom:18 }}>
            <Text style={{ fontWeight:"700", color:C.ink }}>Sociedad:</Text> {guide.sociedad}
          </Text>

          {/* Especialidades */}
          {guide.especialidades?.length > 0 && (
            <View style={{ flexDirection:"row", flexWrap:"wrap", gap:6, marginBottom:20 }}>
              {guide.especialidades.map((esp, i) => (
                <View key={i} style={{ backgroundColor:C.tagBg, paddingHorizontal:10, paddingVertical:4, borderRadius:8 }}>
                  <Text style={{ fontSize:12, color:C.tagText, fontWeight:"500" }}>#{esp}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Resumen */}
          {guide.resumen && (
            <Text style={{ fontSize:15, lineHeight:24, color:"#3a4a44", marginBottom:24 }}>
              {guide.resumen}
            </Text>
          )}

          {/* Botones inferiores */}
          <View style={{ flexDirection:"row", alignItems:"center", gap:10 }}>
            <Pressable onPress={() => Linking.openURL(guide.url)}
              style={({pressed}) => ({
                flex:1,
                backgroundColor: "#e6e6e6",
                borderRadius:14, paddingVertical:11,
                flexDirection:"row", alignItems:"center", justifyContent:"center", gap:6,
                opacity: pressed ? 0.85 : 1,
              })}>
              <Ionicons name="open-outline" size={15} color={C.coral500}/>
              <Text style={{ color:C.coral500, fontSize:13, fontWeight:"600" }}>Leer texto completo</Text>
            </Pressable>

            <Pressable onPress={toggleLike} hitSlop={8}
              style={({pressed}) => ({
                width:46, height:46, borderRadius:14,
                backgroundColor: "#e6e6e6",
                alignItems:"center", justifyContent:"center",
                opacity: pressed ? 0.85 : 1,
              })}>
              <Ionicons name={liked ? "heart" : "heart-outline"} size={21} color={liked ? C.coral500 : C.muted}/>
            </Pressable>

            <Pressable onPress={toggleSave} hitSlop={8}
              style={({pressed}) => ({
                width:46, height:46, borderRadius:14,
                backgroundColor: "#e6e6e6",
                alignItems:"center", justifyContent:"center",
                opacity: pressed ? 0.85 : 1,
              })}>
              <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={21} color={saved ? C.coral500 : C.muted}/>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
