import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal300:"#6dcfc0", teal100:"#d4f0eb", teal50:"#edf8f6",
  coral500:"#d4522a",
  amber500:"#d97706",
  purple500:"#9b59b6",
  cream:"#f7f5f0",
  white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)",
};

const GAMES = [
  {
    key:"ahorcado",
    title:"El Ahorcado",
    description:"Adivina la palabra clínica letra a letra",
    emoji:"🪢",
    color:C.purple500,
    route:null, // pendiente
  },
  {
    key:"sopa",
    title:"Sopa de Letras",
    description:"Encuentra los términos médicos escondidos",
    emoji:"🔠",
    color:C.amber500,
    route:"/games/sopa-letras",
  },
];

export default function Games() {
  const router = useRouter();

  function handleOpen(game) {
    if(game.route) {
      router.push(game.route);
    } else {
      Alert.alert(
        game.title,
        "Este juego estará disponible muy pronto. ¡Estamos trabajando en él!",
        [{ text:"OK" }]
      );
    }
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.teal800 }} edges={["top"]}>
      <StatusBar style="light"/>

      {/* Cabecera */}
      <View style={{ backgroundColor:C.teal800, paddingHorizontal:16, paddingTop:16, paddingBottom:22 }}>
        <Text style={{ fontFamily:"Georgia", fontSize:20, color:"white", marginBottom:8 }}>
          Smart<Text style={{ color:C.teal300 }}>Pills</Text>
        </Text>

        <View style={{ marginTop:-4 }}>
          <Text style={{ fontSize:10, fontWeight:"500", letterSpacing:1.4, textTransform:"uppercase", color:C.teal300, marginBottom:4 }}>
            Juegos
          </Text>
          <Text style={{ fontFamily:"Georgia", fontSize:18, color:"white" }}>
            Aprende jugando
          </Text>
        </View>
      </View>

      <ScrollView style={{ backgroundColor:C.cream }} contentContainerStyle={{ padding:16, gap:12 }}>

        {GAMES.map(game => (
          <Pressable key={game.key} onPress={() => handleOpen(game)}
            style={({pressed}) => ({
              backgroundColor: game.color,
              borderRadius:12, padding:16,
              flexDirection:"row", alignItems:"center", gap:12,
              opacity: pressed ? 0.9 : 1,
            })}>
            <Text style={{ fontSize:32 }}>{game.emoji}</Text>
            <View style={{ flex:1 }}>
              <Text style={{ fontSize:15, fontWeight:"500", color:"white", marginBottom:2 }}>{game.title}</Text>
              <Text style={{ fontSize:12, color:"rgba(255,255,255,0.85)" }}>{game.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)"/>
          </Pressable>
        ))}

        {/* Aviso de próximamente */}
        <View style={{ marginTop:16, padding:14, backgroundColor:C.teal50, borderWidth:1, borderColor:C.teal100, borderRadius:10 }}>
          <Text style={{ fontSize:12, color:C.teal600, fontWeight:"500", marginBottom:4 }}>
            🚧 Sección en construcción
          </Text>
          <Text style={{ fontSize:12, color:C.muted, lineHeight:16 }}>
            Los mini-juegos estarán disponibles muy pronto. La idea es repasar términos clínicos y farmacología en formato relajado.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
