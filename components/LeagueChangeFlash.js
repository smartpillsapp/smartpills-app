import { Modal, View, Text, Image, Pressable } from "react-native";

const PILDO_URLS = {
  up:   "https://utzwotmcocrrkldhcknd.supabase.co/storage/v1/object/public/assets/Pildo%20celebracion.png",
  down: "https://utzwotmcocrrkldhcknd.supabase.co/storage/v1/object/public/assets/Pildo%20triste.png",
};

export default function LeagueChangeFlash({ direction, newLeague, onDismiss }) {
  if(!direction || !newLeague) return null;

  const isUp = direction === "up";
  const message = isUp
    ? `¡Enhorabuena! Acabas de subir de liga, ahora competirás en ${newLeague}`
    : `Oh no, esta semana has caído a la liga ${newLeague}`;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable onPress={onDismiss}
        style={{ flex:1, backgroundColor:"rgba(0,0,0,0.6)", alignItems:"center", justifyContent:"center", padding:24 }}>
        <Image source={{ uri: PILDO_URLS[direction] }}
          style={{ width:240, height:240, marginBottom:20 }} resizeMode="contain"/>
        <View style={{ backgroundColor:"white", borderRadius:20, paddingHorizontal:24, paddingVertical:18, maxWidth:300 }}>
          <Text style={{ fontSize:16, lineHeight:22, color:"#1c2b26", fontWeight:"700", textAlign:"center" }}>
            {message}
          </Text>
        </View>
        <Text style={{ marginTop:18, color:"rgba(255,255,255,0.7)", fontSize:12, fontStyle:"italic" }}>
          Toca para continuar
        </Text>
      </Pressable>
    </Modal>
  );
}
