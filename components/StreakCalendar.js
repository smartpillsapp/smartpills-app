import { View, Text, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { VACCINE_ICON_URL } from "../lib/streak";

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const DAYS_SHORT = ["L","M","X","J","V","S","D"];

const COL = {
  bg:        "#F0F4F8",
  text:      "#243B53",
  textMuted: "#627D98",
  border:    "#D9E2EC",
};

function toDayInMonth(dateStr, year, month) {
  if(!dateStr) return null;
  const d = new Date(dateStr);
  if(d.getFullYear() === year && d.getMonth() === month) return d.getDate();
  return null;
}

function buildSetForMonth(dates, year, month) {
  const set = new Set();
  for(const ds of (dates || [])) {
    const day = toDayInMonth(ds, year, month);
    if(day !== null) set.add(day);
  }
  return set;
}

export default function StreakCalendar({
  streakDays   = [],
  vaccineDays  = [],
  iceDays      = [],
}) {
  const today      = new Date();
  const year       = today.getFullYear();
  const month      = today.getMonth();
  const todayDay   = today.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Lunes = 0, Domingo = 6 (España/Europa)
  const firstDay  = new Date(year, month, 1).getDay();
  const offset    = firstDay === 0 ? 6 : firstDay - 1;

  const fireSet  = buildSetForMonth(streakDays,  year, month);
  const vaxSet   = buildSetForMonth(vaccineDays, year, month);
  const iceSet   = buildSetForMonth(iceDays,     year, month);

  // Día más reciente con fuego (para destacarlo con icono)
  const sortedFire = [...streakDays].sort();
  let latestFireDay = null;
  if(sortedFire.length > 0) {
    latestFireDay = toDayInMonth(sortedFire[sortedFire.length - 1], year, month);
  }

  const cells = [];
  for(let i = 0; i < offset; i++)        cells.push(null);
  for(let d = 1; d <= daysInMonth; d++)  cells.push(d);

  return (
    <View style={{
      backgroundColor: COL.bg,
      borderRadius:    22,
      padding:         18,
      borderWidth:     1,
      borderColor:     COL.border,
      shadowColor:     "#243B53",
      shadowOpacity:   0.08,
      shadowRadius:    14,
      shadowOffset:    { width: 0, height: 6 },
      elevation:       6,
    }}>

      {/* Header: nombre del mes */}
      <View style={{ flexDirection:"row", alignItems:"baseline", justifyContent:"space-between", marginBottom:14 }}>
        <Text style={{ fontFamily:"Georgia", fontSize:24, color:COL.text, letterSpacing:0.5 }}>
          {MONTHS[month]}
        </Text>
        <Text style={{ fontSize:11, color:COL.textMuted, letterSpacing:1.5, fontWeight:"600" }}>
          {year}
        </Text>
      </View>

      {/* Días de la semana */}
      <View style={{ flexDirection:"row", marginBottom:6 }}>
        {DAYS_SHORT.map((d, i) => (
          <View key={i} style={{ flex:1, alignItems:"center" }}>
            <Text style={{ fontSize:10, color:COL.textMuted, fontWeight:"700", letterSpacing:1 }}>
              {d}
            </Text>
          </View>
        ))}
      </View>

      {/* Grid del calendario */}
      <View style={{ flexDirection:"row", flexWrap:"wrap" }}>
        {cells.map((day, idx) => {
          if(day === null) {
            return <View key={`e${idx}`} style={{ width:`${100/7}%`, aspectRatio:1 }}/>;
          }
          const isFire = fireSet.has(day);
          const isVax  = vaxSet.has(day) && !isFire;
          const isIce  = iceSet.has(day) && !isFire && !isVax;
          const isToday = day === todayDay;

          // 🔥 día con test completado
          if(isFire) {
            const isLatest = day === latestFireDay;
            return (
              <View key={day} style={{ width:`${100/7}%`, aspectRatio:1, padding:3 }}>
                <LinearGradient
                  colors={["#FFB347", "#FF6B35", "#E63946"]}
                  start={{x:0, y:0}} end={{x:1, y:1}}
                  style={{
                    flex:1, borderRadius:13, alignItems:"center", justifyContent:"center",
                    shadowColor:"#FF6B35",
                    shadowOpacity: isLatest ? 0.55 : 0.25,
                    shadowRadius:8, shadowOffset:{ width:0, height:2 },
                    elevation: isLatest ? 6 : 3,
                  }}>
                  {isLatest ? (
                    <Ionicons name="flame" size={18} color="white"/>
                  ) : (
                    <Text style={{ fontSize:14, color:"white", fontWeight:"700" }}>{day}</Text>
                  )}
                </LinearGradient>
              </View>
            );
          }

          // 💉 día con vacuna usada
          if(isVax) {
            return (
              <View key={day} style={{ width:`${100/7}%`, aspectRatio:1, padding:3 }}>
                <View style={{
                  flex:1, borderRadius:13, alignItems:"center", justifyContent:"center",
                  backgroundColor:"#d4f0eb",
                  borderWidth:1, borderColor:"#1a7a69",
                }}>
                  <Image
                    source={{ uri: VACCINE_ICON_URL }}
                    style={{ width:24, height:24 }}
                    resizeMode="contain"
                  />
                </View>
              </View>
            );
          }

          // ❄️ día con racha rota
          if(isIce) {
            return (
              <View key={day} style={{ width:`${100/7}%`, aspectRatio:1, padding:3 }}>
                <View style={{
                  flex:1, borderRadius:13, alignItems:"center", justifyContent:"center",
                  backgroundColor:"#E3EEF7",
                  borderWidth:1, borderColor:"#B6CCE0",
                }}>
                  <Ionicons name="snow-outline" size={18} color="#3D5A80"/>
                </View>
              </View>
            );
          }

          // Día vacío (número simple)
          return (
            <View key={day} style={{ width:`${100/7}%`, aspectRatio:1, padding:3 }}>
              <View style={{
                flex:1, borderRadius:13, alignItems:"center", justifyContent:"center",
                backgroundColor: isToday ? "#FFFFFF" : "transparent",
                borderWidth:1, borderColor: isToday ? COL.text : COL.border,
              }}>
                <Text style={{ fontSize:13, color:COL.text, fontWeight: isToday ? "700" : "500" }}>
                  {day}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

    </View>
  );
}
