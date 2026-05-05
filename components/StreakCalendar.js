import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const DAYS_SHORT = ["L","M","X","J","V","S","D"];

const COL = {
  bg:        "#F0F4F8",  // fondo azul-grisáceo casi blanco
  text:      "#243B53",  // azul marino para los números
  textMuted: "#627D98",  // azul muted para etiquetas y año
  border:    "#D9E2EC",  // gris azulado suave para bordes
};

export default function StreakCalendar({ completedDates = [] }) {
  const today      = new Date();
  const year       = today.getFullYear();
  const month      = today.getMonth();
  const todayDay   = today.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Lunes = 0, Domingo = 6 (España/Europa)
  const firstDay  = new Date(year, month, 1).getDay();
  const offset    = firstDay === 0 ? 6 : firstDay - 1;

  // Días completados de este mes
  const completedSet = new Set();
  completedDates.forEach(dateStr => {
    const d = new Date(dateStr);
    if(d.getFullYear() === year && d.getMonth() === month) {
      completedSet.add(d.getDate());
    }
  });

  // Día más reciente de la racha (se mostrará con el icono de fuego)
  const sortedDates = [...completedDates].sort();
  let latestDayInMonth = null;
  if(sortedDates.length > 0) {
    const latest = new Date(sortedDates[sortedDates.length - 1]);
    if(latest.getFullYear() === year && latest.getMonth() === month) {
      latestDayInMonth = latest.getDate();
    }
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
          const isCompleted = completedSet.has(day);
          const isToday     = day === todayDay;

          return (
            <View key={day} style={{ width:`${100/7}%`, aspectRatio:1, padding:3 }}>
              {isCompleted ? (
                <LinearGradient
                  colors={["#FFB347", "#FF6B35", "#E63946"]}
                  start={{x:0, y:0}} end={{x:1, y:1}}
                  style={{
                    flex:1,
                    borderRadius:13,
                    alignItems:"center",
                    justifyContent:"center",
                    shadowColor:"#FF6B35",
                    shadowOpacity: day === latestDayInMonth ? 0.55 : 0.25,
                    shadowRadius:8,
                    shadowOffset:{ width:0, height:2 },
                    elevation: day === latestDayInMonth ? 6 : 3,
                  }}>
                  {day === latestDayInMonth ? (
                    <Text style={{ fontSize:18 }}>🔥</Text>
                  ) : (
                    <Text style={{ fontSize:14, color:"white", fontWeight:"700" }}>{day}</Text>
                  )}
                </LinearGradient>
              ) : (
                <View style={{
                  flex:1,
                  borderRadius:13,
                  alignItems:"center",
                  justifyContent:"center",
                  backgroundColor: isToday ? "#FFFFFF" : "transparent",
                  borderWidth:     1,
                  borderColor:     isToday ? COL.text : COL.border,
                }}>
                  <Text style={{
                    fontSize:   13,
                    color:      COL.text,
                    fontWeight: isToday ? "700" : "500",
                  }}>
                    {day}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

    </View>
  );
}
