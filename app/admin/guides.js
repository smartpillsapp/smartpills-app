import { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert } from "react-native";
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
  langEnglish:"#4169E1", langSpanish:"#800000",
};

export default function AdminGuides() {
  const router = useRouter();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("clinical_guides_v2")
      .select("*").order("created_at", { ascending:false });
    setGuides(data || []);
    setLoading(false);
  }

  async function handleDelete(guide) {
    Alert.alert(
      "¿Eliminar guía?",
      `Vas a borrar "${guide.titulo}". Esta acción no se puede deshacer.`,
      [
        { text:"Cancelar", style:"cancel" },
        {
          text:"Eliminar", style:"destructive",
          onPress: async () => {
            const { error } = await supabase.from("clinical_guides_v2")
              .delete().eq("id", guide.id);
            if(error) {
              Alert.alert("Error", error.message);
            } else {
              load();
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.teal800 }} edges={["top"]}>
      <StatusBar style="light"/>

      <View style={{ backgroundColor:C.teal800, paddingHorizontal:16, paddingVertical:14 }}>
        <Pressable onPress={() => router.back()}
          style={{ alignSelf:"flex-start", backgroundColor:"rgba(255,255,255,0.12)", borderWidth:1, borderColor:"rgba(255,255,255,0.2)", borderRadius:8, paddingHorizontal:10, paddingVertical:4, marginBottom:10 }}>
          <Text style={{ fontSize:12, color:"white" }}>← Volver</Text>
        </Pressable>

        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
          <View style={{ flex:1 }}>
            <Text style={{ fontSize:10, fontWeight:"500", letterSpacing:1.4, textTransform:"uppercase", color:C.teal300, marginBottom:4 }}>
              Panel admin
            </Text>
            <Text style={{ fontFamily:"Georgia", fontSize:22, color:"white" }}>
              Guías clínicas
            </Text>
          </View>
          <Pressable onPress={() => router.push("/admin/guide-form")}
            style={({pressed}) => ({
              backgroundColor: pressed ? "#bf4624" : C.coral500,
              borderRadius:24, paddingHorizontal:16, paddingVertical:10,
              flexDirection:"row", alignItems:"center", gap:6,
            })}>
            <Ionicons name="add" size={18} color="white"/>
            <Text style={{ color:"white", fontSize:13, fontWeight:"600" }}>Nueva</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ flex:1, backgroundColor:C.cream }}>
        {loading ? (
          <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
            <ActivityIndicator size="large" color={C.teal600}/>
          </View>
        ) : guides.length === 0 ? (
          <View style={{ flex:1, alignItems:"center", justifyContent:"center", padding:24 }}>
            <Text style={{ fontSize:38, marginBottom:12 }}>📖</Text>
            <Text style={{ fontFamily:"Georgia", fontSize:16, color:C.ink }}>Sin guías todavía</Text>
            <Text style={{ fontSize:13, color:C.muted2, marginTop:6, textAlign:"center" }}>
              Pulsa "Nueva" para añadir la primera.
            </Text>
          </View>
        ) : (
          <FlatList
            data={guides}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding:14 }}
            renderItem={({ item }) => (
              <View style={{
                backgroundColor:C.white, borderRadius:14, padding:14, marginBottom:10,
                shadowColor:"#000", shadowOpacity:0.05, shadowRadius:5, shadowOffset:{ width:0, height:2 }, elevation:2,
              }}>
                <Text style={{ fontSize:15, fontWeight:"700", color:C.ink, marginBottom:4, lineHeight:20 }}>
                  {item.titulo}
                </Text>
                <Text style={{ fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>
                  {item.sociedad} · <Text style={{ color: item.idioma === "ingles" ? C.langEnglish : C.langSpanish, fontWeight:"700" }}>
                    {item.idioma === "ingles" ? "INGLÉS" : "CASTELLANO"}
                  </Text>
                </Text>
                <View style={{ flexDirection:"row", gap:8 }}>
                  <Pressable onPress={() => router.push({ pathname:"/admin/guide-form", params:{ id: item.id } })}
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
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
