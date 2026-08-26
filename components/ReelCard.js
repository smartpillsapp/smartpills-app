// Tarjeta del feed de pills (estilo "reel" a pantalla completa).
//
// Componente compartido entre:
//   - El feed principal (app/(tabs)/index.js)
//   - La pantalla de detalle/deep link (app/article/[id].js)
//
// Recibe el `article` y el conjunto mínimo de handlers/estado para que
// funcione en cualquier contexto.

import { useRef } from "react";
import { View, Text, Pressable, Image, Linking, Share, Platform } from "react-native";

// En Android, el escalado de fuente del sistema rompe el layout de altura fija.
const afs = Platform.OS !== "android"; // allowFontScaling
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { pickPillImage } from "../lib/pill-images";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69",
  teal500:"#1d9e87", teal300:"#6dcfc0",
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

export async function shareArticle(article) {
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

export default function ReelCard({
  article,
  cardHeight,
  topInset,
  saved,
  onSave,
  reaction,
  onReact,
}) {
  const imgUrl    = pickPillImage(article);
  // Top del recuadro blanco (mitad del 4º botón lateral). Lo reutilizamos para
  // alinear imagen y gradiente con él.
  const cardTop   = topInset + 241;
  // La imagen llega hasta cardTop + un 10 % del card, así queda una franja
  // pequeña oculta tras el recuadro y la transición al tono arena es suave.
  const imgHeight = cardTop + cardHeight * 0.10;
  const likeColor = "#1d9e87";
  const saveColor = "#1d9e87";
  const lastTapRef = useRef(0);

  function handleDoubleTap() {
    if(!onReact) return;
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

      <Image source={{ uri:imgUrl }}
        style={{ position:"absolute", top:0, left:0, right:0, height:imgHeight }}
        resizeMode="cover"/>

      <LinearGradient
        colors={[
          "rgba(247,245,240,0)",
          "rgba(247,245,240,0.6)",
          "rgba(247,245,240,1)",
        ]}
        locations={[0, 0.6, 1]}
        pointerEvents="none"
        style={{ position:"absolute", left:0, right:0, top: imgHeight - 70, height: 70 }}/>

      {/* Cabecera flotante */}
      <View style={{ position:"absolute", top: topInset + 14, left:16, right:16, flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
        <Text allowFontScaling={afs} style={{ fontFamily:"Georgia", fontSize:17, color:"white", textShadowColor:"rgba(0,0,0,0.5)", textShadowRadius:4 }}>
          Smart<Text allowFontScaling={afs} style={{ color:C.teal300 }}>Pills</Text>
        </Text>
        <View style={{ backgroundColor:"rgba(0,0,0,0.4)", paddingHorizontal:10, paddingVertical:3, borderRadius:10 }}>
          <Text allowFontScaling={afs} style={{ fontSize:10, color:"rgba(255,255,255,0.9)" }}>{timeAgo(article.published_at)}</Text>
        </View>
      </View>

      {/* Botones laterales */}
      <View style={{ position:"absolute", right:12, top: topInset + 50, gap:10, alignItems:"center", zIndex:10 }}>
        <ActionButton icon={reaction==="like"?"heart":"heart-outline"}
          active={reaction==="like"} activeColor={likeColor}
          onPress={() => onReact && onReact(article, "like")}/>
        <ActionButton icon={reaction==="dislike"?"thumbs-down":"thumbs-down-outline"}
          active={reaction==="dislike"} activeColor="#d4522a"
          onPress={() => onReact && onReact(article, "dislike")}/>
        <ActionButton icon={saved?"bookmark":"bookmark-outline"}
          active={saved} activeColor={saveColor}
          onPress={() => onSave && onSave(article)}/>
        <ActionButton icon="share-social-outline"
          active={false} activeColor="white"
          onPress={() => shareArticle(article)}/>
      </View>

      {/* Recuadro blanco con título, resumen, fuente y "Leer más" */}
      <View style={{
        position:"absolute", left:14, right:14, top: cardTop, bottom:14,
        backgroundColor:"white", borderRadius:20,
        paddingHorizontal:20, paddingTop:20, paddingBottom:10,
      }}>
        <View style={{ flex:1 }}>
          <Text allowFontScaling={afs} numberOfLines={4} style={{ fontFamily:"Georgia", fontSize:19, lineHeight:23, fontWeight:"bold", color:C.ink }}>
            {article.title}
          </Text>

          {article.ai_summary ? (
            <Text allowFontScaling={afs} style={{ fontSize:16, lineHeight:24, color:C.ink, marginTop:10 }}>
              {article.ai_summary}
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", gap:10 }}>
          <Text allowFontScaling={afs} numberOfLines={1}
            style={{ flex:1, fontSize:12, fontWeight:"600", color:"#e8967e", textTransform:"uppercase", letterSpacing:0.5 }}>
            {article.source_name || article.journal}
          </Text>
          {article.source_url ? (
            <Pressable onPress={() => Linking.openURL(article.source_url)}
              style={({ pressed }) => ({
                backgroundColor: C.teal300,
                paddingHorizontal:14, paddingVertical:7, borderRadius:16,
                opacity: pressed ? 0.85 : 1,
              })}>
              <Text allowFontScaling={afs} style={{ color: C.teal800, fontSize:13, fontWeight:"600" }}>Leer más</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

    </Pressable>
  );
}
