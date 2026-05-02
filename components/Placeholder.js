import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal300:"#6dcfc0",
  cream:"#f7f5f0", white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
};

export default function Placeholder({ icon, title, description }) {
  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.cream }} edges={["top"]}>
      <StatusBar style="light"/>
      <View style={{ backgroundColor:C.teal800, paddingHorizontal:20, paddingVertical:18 }}>
        <Text style={{ fontFamily:"Georgia", fontSize:20, color:"white" }}>
          Smart<Text style={{ color:C.teal300 }}>Pills</Text>
        </Text>
      </View>
      <View style={{ flex:1, alignItems:"center", justifyContent:"center", paddingHorizontal:24 }}>
        <Text style={{ fontSize:64, marginBottom:16 }}>{icon}</Text>
        <Text style={{ fontFamily:"Georgia", fontSize:24, color:C.ink, marginBottom:8 }}>{title}</Text>
        <Text style={{ fontSize:14, color:C.muted2, textAlign:"center", lineHeight:20 }}>
          {description}
        </Text>
        <View style={{ marginTop:24, backgroundColor:C.white, paddingHorizontal:16, paddingVertical:8, borderRadius:16, borderWidth:1, borderColor:"rgba(28,43,38,0.12)" }}>
          <Text style={{ fontSize:11, color:C.teal600, fontWeight:"500" }}>Próximamente</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
