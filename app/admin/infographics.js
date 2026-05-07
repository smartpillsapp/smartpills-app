import { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal300:"#6dcfc0", teal50:"#edf8f6",
  amber500:"#d97706", amber100:"#fef3c7",
  coral500:"#d4522a", coral100:"#fae8e2",
  cream:"#f7f5f0",
  white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)",
};

export default function AdminInfographics() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("ai_infographics")
      .select("*")
      .order("year", { ascending:false })
      .order("created_at", { ascending:false });
    setItems(data || []);
    setLoading(false);
  }

  async function handleDelete(item) {
    Alert.alert(
      "¿Eliminar infografía?",
      `Vas a borrar "${item.title}". Esta acción no se puede deshacer.`,
      [
        { text:"Cancelar", style:"cancel" },
        {
          text:"Eliminar", style:"destructive",
          onPress: async () => {
            const { error } = await supabase.from("ai_infographics").delete().eq("id", item.id);
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
    (it.organization || "").toLowerCase().includes(q)
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
              Resúmenes e infografías
            </Text>
          </View>
          <Pressable onPress={() => router.push("/admin/infographic-form")}
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
            placeholder="Buscar por título u organización..."
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
            <Text style={{ fontSize:38, marginBottom:12 }}>🎨</Text>
            <Text style={{ fontFamily:"Georgia", fontSize:16, color:C.ink }}>
              {search ? "Sin resultados" : "Sin infografías todavía"}
            </Text>
            <Text style={{ fontSize:13, color:C.muted2, marginTop:6, textAlign:"center" }}>
              {search ? "Prueba con otra búsqueda" : "Pulsa \"Nueva\" para añadir la primera."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding:14 }}
            renderItem={({ item }) => (
              <View style={{
                backgroundColor:C.white, borderRadius:14, padding:14, marginBottom:10,
                shadowColor:"#000", shadowOpacity:0.05, shadowRadius:5, shadowOffset:{ width:0, height:2 }, elevation:2,
              }}>
                <Text style={{ fontSize:15, fontWeight:"700", color:C.ink, marginBottom:4, lineHeight:20 }}>
                  {item.title}
                </Text>
                <Text style={{ fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>
                  {item.organization}{item.year ? ` · ${item.year}` : ""}
                </Text>
                <View style={{ flexDirection:"row", gap:8 }}>
                  <Pressable onPress={() => router.push({ pathname:"/admin/infographic-form", params:{ id: item.id } })}
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
