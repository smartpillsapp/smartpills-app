import { View, Text, Image } from "react-native";

// Mapa estático de los 12 avatares predefinidos
const AVATARS = {
  1:  require('../assets/avatars/avatar_1.png'),
  2:  require('../assets/avatars/avatar_2.png'),
  3:  require('../assets/avatars/avatar_3.png'),
  4:  require('../assets/avatars/avatar_4.png'),
  5:  require('../assets/avatars/avatar_5.png'),
  6:  require('../assets/avatars/avatar_6.png'),
  7:  require('../assets/avatars/avatar_7.png'),
  8:  require('../assets/avatars/avatar_8.png'),
  9:  require('../assets/avatars/avatar_9.png'),
  10: require('../assets/avatars/avatar_10.png'),
  11: require('../assets/avatars/avatar_11.png'),
  12: require('../assets/avatars/avatar_12.png'),
};

export { AVATARS };

/**
 * Avatar de usuario. Si tiene avatarId (1-12) muestra la foto; si no, muestra iniciales.
 *
 * Props:
 *   avatarId       — número 1-12 o null/undefined
 *   initials       — texto a mostrar cuando no hay foto (ej. "AM")
 *   size           — diámetro en px (por defecto 40)
 *   color          — color de fondo cuando muestra iniciales (por defecto teal)
 *   containerStyle — estilos extra para el contenedor (borde, margen…)
 *   initialsStyle  — estilos extra para el texto de iniciales (fuente, tamaño…)
 */
export default function UserAvatar({
  avatarId,
  initials = "?",
  size = 40,
  color = "#1a7a69",
  containerStyle,
  initialsStyle,
}) {
  const src = (avatarId && AVATARS[avatarId]) ? AVATARS[avatarId] : null;

  return (
    <View style={[{
      width:           size,
      height:          size,
      borderRadius:    size / 2,
      backgroundColor: src ? "transparent" : color,
      alignItems:      "center",
      justifyContent:  "center",
      overflow:        "hidden",
    }, containerStyle]}>
      {src ? (
        <Image source={src} style={{ width: size, height: size }} resizeMode="cover"/>
      ) : (
        <Text style={[{ color: "white", fontSize: size * 0.35, fontWeight: "600" }, initialsStyle]}>
          {initials}
        </Text>
      )}
    </View>
  );
}
