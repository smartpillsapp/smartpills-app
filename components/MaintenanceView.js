import { useRef } from "react";
import { View, Text, Pressable, Image, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

const C = {
  teal700:"#155c50", teal800:"#0f3d35",
  cream:"#f7f5f0",
  ink:"#1c2b26", muted:"#607068",
};

const PILDO_OBRERO = "https://utzwotmcocrrkldhcknd.supabase.co/storage/v1/object/public/assets/Pildo%20obrero.PNG";

export default function MaintenanceView({
  title,
  onBack,
  headerBg = C.teal700,
  bodyBg   = C.cream,
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  function handleImageLoad() {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:headerBg }} edges={["top"]}>
      <StatusBar style="light"/>

      {/* Header — mismo estilo que el resto de pantallas */}
      <View style={{ backgroundColor:headerBg, paddingHorizontal:16, paddingVertical:14 }}>
        {onBack && (
          <Pressable onPress={onBack}
            style={{ alignSelf:"flex-start", backgroundColor:"rgba(255,255,255,0.12)", borderWidth:1, borderColor:"rgba(255,255,255,0.2)", borderRadius:8, paddingHorizontal:10, paddingVertical:4, marginBottom:10 }}>
            <Text style={{ fontSize:12, color:"white" }}>← Volver</Text>
          </Pressable>
        )}
        {title ? (
          <Text style={{ fontFamily:"Georgia", fontSize:20, color:"white" }}>
            {title}
          </Text>
        ) : null}
      </View>

      {/* Cuerpo — imagen + texto integrados, con fade-in suave */}
      <View style={{ flex:1, backgroundColor:bodyBg, alignItems:"center", justifyContent:"center", paddingHorizontal:32 }}>
        <Animated.View style={{ opacity, alignItems:"center" }}>
          <Image
            source={{ uri: PILDO_OBRERO }}
            style={{ width:220, height:220, marginBottom:28 }}
            resizeMode="contain"
            onLoad={handleImageLoad}
          />
          <Text style={{
            fontFamily:"Georgia", fontSize:18, lineHeight:26,
            color:C.ink, textAlign:"center", maxWidth:300,
          }}>
            Ups, nuestro equipo aún trabajando en esta sección
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
