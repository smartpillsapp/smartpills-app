import { Modal, View, Text, Image, Pressable } from "react-native";

const PILDO_URLS = {
  up:   "https://utzwotmcocrrkldhcknd.supabase.co/storage/v1/object/public/assets/Pildo%20celebracion.png",
  down: "https://utzwotmcocrrkldhcknd.supabase.co/storage/v1/object/public/assets/Pildo%20triste.png",
  stay: "https://utzwotmcocrrkldhcknd.supabase.co/storage/v1/object/public/assets/Pildo%20base.PNG",
  king: "https://utzwotmcocrrkldhcknd.supabase.co/storage/v1/object/public/assets/Pildo_rey-removebg-preview.png",
};

const KING_MESSAGES = {
  1: "Enhorabuena, has alcanzado la excelencia académica. Pero no es el fin del camino! Sigue luchando para que nadie te quite la gloria.",
  2: "Enhorabuena, has llegado al olimpo de los sanitarios, siento decirte que hay alguien aún mejor, lucha la siguiente semana para alcanzar la gloria.",
  3: "Enhorabuena, has llegando al olimpo de los sanitarios, pero siento decirte que 2 personas lo han hecho aún mejor, sigue luchando para alcanzar la gloria.",
};

export default function LeagueChangeFlash({ direction, newLeague, kingRank, onDismiss }) {
  if(!direction) return null;

  let message;
  if(direction === "king") {
    message = KING_MESSAGES[kingRank] || KING_MESSAGES[3];
  } else if(direction === "up") {
    message = `¡Enhorabuena! Acabas de subir de liga, ahora competirás en ${newLeague}`;
  } else if(direction === "down") {
    message = `Oh no, esta semana has caído a la liga ${newLeague}`;
  } else if(direction === "stay") {
    message = `Esta semana no has conseguido subir de liga, veamos qué tal lo haces esta vez`;
  } else {
    return null;
  }

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
