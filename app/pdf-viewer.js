import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Platform, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal300:"#6dcfc0",
  cream:"#f7f5f0", white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)",
  coral500:"#d4522a",
};

export default function PdfViewer() {
  const { url, title, organization } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // En Android la WebView nativa no muestra PDFs. Usamos Google Docs Viewer como envoltorio.
  const cleanUrl = String(url || "").trim().replace(/^["'`]+|["'`]+$/g, "").trim();
  const viewerUrl = Platform.OS === "android"
    ? `https://docs.google.com/gview?url=${encodeURIComponent(cleanUrl)}&embedded=true`
    : cleanUrl;

  if(!cleanUrl) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor:C.cream, alignItems:"center", justifyContent:"center", padding:20 }}>
        <Text style={{ color:C.coral500, marginBottom:12 }}>URL del PDF no disponible</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color:C.teal600, fontWeight:"500" }}>← Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.cream }} edges={["top","bottom"]}>
      <StatusBar style="light"/>

      {/* Cabecera */}
      <View style={{ backgroundColor:C.teal800, paddingHorizontal:14, paddingVertical:12, flexDirection:"row", alignItems:"center", gap:10 }}>
        <Pressable onPress={() => router.back()}
          style={{ backgroundColor:"rgba(255,255,255,0.12)", borderWidth:1, borderColor:"rgba(255,255,255,0.2)", borderRadius:8, paddingHorizontal:11, paddingVertical:5 }}>
          <Text style={{ fontSize:12, color:"white" }}>← Volver</Text>
        </Pressable>
        <View style={{ flex:1 }}>
          {organization ? (
            <Text numberOfLines={1} style={{ fontSize:10, color:"rgba(255,255,255,0.6)", textTransform:"uppercase", letterSpacing:0.5, fontWeight:"500" }}>
              {organization}
            </Text>
          ) : null}
          {title ? (
            <Text numberOfLines={1} style={{ fontSize:13, color:"white", fontWeight:"500" }}>
              {title}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Visor */}
      <View style={{ flex:1, position:"relative" }}>
        <WebView
          source={{ uri: viewerUrl }}
          startInLoadingState
          onLoadStart={() => { setLoading(true); setError(null); }}
          onLoadEnd={() => setLoading(false)}
          onError={(e) => setError(e.nativeEvent?.description || "Error al cargar el PDF")}
          style={{ flex:1, backgroundColor:C.cream }}
          allowsInlineMediaPlayback
        />

        {loading && (
          <View style={{ position:"absolute", top:0, left:0, right:0, bottom:0, alignItems:"center", justifyContent:"center", backgroundColor:"rgba(247,245,240,0.85)" }}>
            <ActivityIndicator size="large" color={C.teal600}/>
            <Text style={{ marginTop:10, fontSize:13, color:C.muted }}>Cargando PDF...</Text>
          </View>
        )}

        {error && (
          <View style={{ position:"absolute", top:0, left:0, right:0, bottom:0, alignItems:"center", justifyContent:"center", backgroundColor:C.cream, padding:24 }}>
            <Ionicons name="document-text-outline" size={56} color={C.coral500} style={{ marginBottom:12 }}/>
            <Text style={{ fontSize:16, fontWeight:"500", color:C.ink, marginBottom:6 }}>No se pudo cargar el PDF</Text>
            <Text style={{ fontSize:12, color:C.muted, textAlign:"center", marginBottom:18 }}>{error}</Text>
            <Pressable onPress={() => Linking.openURL(cleanUrl)}
              style={{ backgroundColor:C.teal600, paddingHorizontal:18, paddingVertical:9, borderRadius:18 }}>
              <Text style={{ color:"white", fontSize:13, fontWeight:"500" }}>Abrir en navegador</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
