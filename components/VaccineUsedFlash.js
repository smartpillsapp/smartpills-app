import { Modal, View, Text, Image, Pressable } from "react-native";

const PILDO_TRISTE_URL =
  "https://utzwotmcocrrkldhcknd.supabase.co/storage/v1/object/public/assets/Pildo%20triste.png";

const MESSAGES = [
  "Vaya, ayer no hiciste tu test diario… pensé que esto iba en serio.",
  "¿Ayer no hiciste el test diario? Esta vez no se lo digo a la supervisora…",
  "Ayer no hiciste el test diario… esto hace llorar a Florence Nightingale.",
  "Ayer no hiciste el reto diario. Te hemos sacado de la parada con la vacuna, pero sigues en observación. Como no hagas el test hoy, la descarga no sirve de nada.",
  "La vacuna ha sido un parche de adrenalina. Si no le metes el test de hoy, el paciente (tu racha) se nos muere del todo.",
  "Has gastado tu única vida extra. Estás literalmente con un 1% de batería y en soporte vital. ¡Mueve el dedo!",
  "Ayer no hiciste el reto diario. Considera ese comodín como una traqueotomía de emergencia. Ya puedes respirar, pero ahora toca levantarse y hacer la prueba.",
  "Ayer no hiciste el reto diario. ¿De verdad vas a malgastar una vacuna para terminar perdiendo la racha al día siguiente? Menudo despilfarro de recursos.",
  "El comodín era un salvavidas, no una hamaca para tumbarse a la bartola. ¡Haz el test de hoy o habrás quemado el comodín para nada!",
  "Gastar el comodín y no hacer el test hoy es como comprarte la medicina y dejarla en la mesilla sin abrírsela.",
];

export function pickVaccineFlashMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}

export default function VaccineUsedFlash({ visible, message, onDismiss }) {
  if(!visible) return null;
  const text = message || pickVaccineFlashMessage();

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
