import { Modal, View, Text, Image, Pressable } from "react-native";

const PILDO_TRISTE_URL =
  "https://utzwotmcocrrkldhcknd.supabase.co/storage/v1/object/public/assets/Pildo%20triste.png";

const MESSAGES = [
  "Hora del fallecimiento: las 00:00. Causa de la muerte: fallo multiorgánico de la fuerza de voluntad. Mi más sentido pésame por tu racha.",
  "He firmado ya la autopsia de tu racha diaria. Murió por asfixia de pereza y abandono del tratamiento.",
  "Tranquilo, la pérdida de la racha no es contagiosa, pero por si acaso mantén la distancia con los que sí siguen cumpliendo.",
  "Tu contador a cero me ha dolido hasta a mí. Ni con un desfibrilador de descarga máxima resucitamos ese historial.",
  "Tantos días de constancia tirados a la basura por un despiste de cinco minutos. Un minuto de silencio por tu dignidad.",
  "Espero que ese día de descanso haya merecido la pena, porque el dolor de ver el número '0' en la pantalla no te lo quita nadie.",
  "Tenías un imperio de días seguidos y lo has dejado caer como un castillo de naipes. Qué trágico todo.",
  "La caída ha sido épica. Lo bueno de tocar fondo y estar a cero es que, literalmente, ya no puedes ir a peor.",
  "Bueno, se acabó el duelo. Recoge tus pedazos, límpiate las lágrimas y dale al botón para empezar la Racha 2.0.",
  "El mejor momento para empezar a construir una racha legendaria era hace un mes. El segundo mejor momento es hoy. ¡A darle!",
  "Llorar sobre la racha derramada no te va a devolver los días. Haz el test de hoy y empieza la reconstrucción.",
];

export function pickStreakLostMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}

export default function StreakLostFlash({ visible, message, onDismiss }) {
  if(!visible) return null;
  const text = message || pickStreakLostMessage();

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable onPress={onDismiss}
        style={{ flex:1, backgroundColor:"rgba(0,0,0,0.6)", alignItems:"center", justifyContent:"center", padding:24 }}>
        <Image source={{ uri: PILDO_TRISTE_URL }}
          style={{ width:240, height:240, marginBottom:20 }} resizeMode="contain"/>
        <View style={{ backgroundColor:"white", borderRadius:20, paddingHorizontal:24, paddingVertical:18, maxWidth:320 }}>
          <Text style={{ fontSize:15, lineHeight:22, color:"#1c2b26", fontWeight:"700", textAlign:"center" }}>
            {text}
          </Text>
        </View>
        <Text style={{ marginTop:18, color:"rgba(255,255,255,0.7)", fontSize:12, fontStyle:"italic" }}>
          Toca para continuar
        </Text>
      </Pressable>
    </Modal>
  );
}
