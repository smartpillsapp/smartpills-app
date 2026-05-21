import { useEffect, useState, useRef } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { ensureStreakState, applyDailyTestCompletion } from "../lib/streak";
import TestResultFlash from "../components/TestResultFlash";
import StreakFlash from "../components/StreakFlash";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal500:"#1d9e87", teal300:"#6dcfc0", teal100:"#d4f0eb", teal50:"#edf8f6",
  coral500:"#d4522a", coral100:"#fae8e2", coral50:"#fdf4f1",
  amber500:"#d97706", amber100:"#fef3c7", amber50:"#fffbeb",
  green600:"#16a34a", green100:"#dcfce7", green50:"#f0fdf4",
  red600:"#dc2626", red100:"#fee2e2", red50:"#fef2f2",
  cream:"#f7f5f0", cream2:"#f0ede6",
  white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)", borderMd:"rgba(28,43,38,0.16)",
};

function OptionButton({ letter, text, state, onPress }) {
  const bg = state==="correct" ? C.green50 : state==="wrong" ? C.red50 : C.white;
  const borderColor = state==="correct" ? C.green600 : state==="wrong" ? C.red600 : C.borderMd;
  const letterBg = state==="correct" ? C.green100 : state==="wrong" ? C.red100 : C.cream2;
  const letterColor = state==="correct" ? C.green600 : state==="wrong" ? C.red600 : C.muted;
  const icon = state==="correct" ? "✓" : state==="wrong" ? "✗" : null;

  return (
    <Pressable onPress={onPress} disabled={state !== "idle"}
      style={({pressed}) => ({
        flexDirection:"row", alignItems:"center", gap:12,
        backgroundColor:bg, borderWidth:1.5, borderColor:borderColor,
        borderRadius:10, paddingHorizontal:14, paddingVertical:13,
        marginBottom:9, opacity: state==="disabled"?0.45:(pressed?0.85:1),
      })}>
      <View style={{ width:30, height:30, borderRadius:15, backgroundColor:letterBg, alignItems:"center", justifyContent:"center", borderWidth:1.5, borderColor }}>
        <Text style={{ fontSize:12, fontWeight:"500", color:letterColor }}>{icon || letter}</Text>
      </View>
      <Text style={{ flex:1, fontSize:14, lineHeight:19, color:C.ink }}>{text}</Text>
    </Pressable>
  );
}

export default function TestScreen() {
  const { kind } = useLocalSearchParams();
  const testKind = kind === "general" ? "general" : "daily";
  const router = useRouter();

  const [profile, setProfile]   = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [streak, setStreak]     = useState(0);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [optionStates, setOptionStates] = useState(["idle","idle","idle","idle"]);
  const [answered, setAnswered] = useState(false);
  const [score, setScore]       = useState(0);
  const [correct, setCorrect]   = useState(0);
  const [showResult, setShowResult] = useState(false);

  const [saving, setSaving]     = useState(false);
  const [newStreak, setNewStreak] = useState(null);
  const [flashDismissed, setFlashDismissed] = useState(false);
  const [streakFlashDismissed, setStreakFlashDismissed] = useState(false);
  const scoreRef = useRef(0);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if(!user) return;

      let { data:profileData } = await supabase
        .from("profiles").select("*").eq("auth_user_id", user.id).single();
      // Procesar racha pendiente (vacunas / hielo) antes de seguir
      profileData = await ensureStreakState(profileData, user.id);
      setProfile(profileData);
      setStreak(profileData?.racha_dias || 0);

      const today = new Date().toISOString().split("T")[0];

      if(testKind === "general") {
        // Test General: ilimitado. Sacamos 5 preguntas aleatorias del pool.
        const { data:randomQuestions, error:rpcErr } = await supabase
          .rpc("get_random_general_questions", { n: 5 });
        if(rpcErr || !randomQuestions || randomQuestions.length === 0) {
          setChallenge(null);
        } else {
          setChallenge({ questions: randomQuestions });
        }
      } else {
        // Reto Diario: bloqueado a una vez al día.
        if(profileData?.ultima_vez_test === today) {
          setAlreadyDone(true);
          setLoading(false);
          return;
        }

        const prof = profileData?.profession || "general";
        const { data:challengeData } = await supabase
          .from("daily_challenges")
          .select("*")
          .eq("profession", prof)
          .eq("date", today)
          .eq("is_active", true)
          .single();

        if(!challengeData) {
          const { data:generalChallenge } = await supabase
            .from("daily_challenges")
            .select("*")
            .eq("profession", "general")
            .eq("date", today)
            .eq("is_active", true)
            .single();
          setChallenge(generalChallenge);
        } else {
          setChallenge(challengeData);
        }
      }
    } catch(err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveResult(totalScore) {
    setSaving(true);
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if(!user || !profile) return;

      const today = new Date().toISOString().split("T")[0];

      if(testKind === "general") {
        // Test General: solo guarda fecha, NO toca racha
        await supabase.from("profiles").update({
          ultima_vez_test_general: today,
          updated_at:              new Date().toISOString(),
        }).eq("auth_user_id", user.id);
      } else {
        // Reto Diario: actualiza streak_days + racha + posible vacuna por hito 30d
        const updates = applyDailyTestCompletion(profile);
        setNewStreak(updates.racha_dias);
        await supabase.from("profiles").update({
          ...updates,
          updated_at: new Date().toISOString(),
        }).eq("auth_user_id", user.id);
      }

      // XP en ambos casos
      if(totalScore > 0) {
        await supabase.rpc("add_xp_typed", {
          user_id: user.id, xp_delta: totalScore, test_type: "general",
        });
        await supabase.rpc("add_weekly_xp", {
          target_uid: user.id, delta: totalScore,
        });
      }
    } catch(err) {
      console.error("Error guardando:", err);
    } finally {
      setSaving(false);
    }
  }

  function handleAnswer(selectedIdx) {
    if(answered || !challenge) return;
    setAnswered(true);
    const q = challenge.questions[currentIdx];
    const isCorrect = selectedIdx === q.correct_index;
    const newStates = q.options.map((_, i) => {
      if(i === selectedIdx && isCorrect)      return "correct";
      if(i === selectedIdx && !isCorrect)     return "wrong";
      if(i === q.correct_index && !isCorrect) return "correct";
      return "disabled";
    });
    setOptionStates(newStates);
    if(isCorrect) {
      const xpPerCorrect = testKind === "general" ? 5 : 10;
      setScore(s => { const n = s + xpPerCorrect; scoreRef.current = n; return n; });
      setCorrect(c => c + 1);
    }
  }

  function handleNext() {
    const questions = challenge.questions;
    if(currentIdx + 1 >= questions.length) {
      setShowResult(true);
      saveResult(scoreRef.current);
    } else {
      setCurrentIdx(i => i + 1);
      setOptionStates(["idle","idle","idle","idle"]);
      setAnswered(false);
    }
  }

  // ── LOADING ──
  if(loading) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor:C.cream, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator size="large" color={C.teal600}/>
      </SafeAreaView>
    );
  }

  // ── YA HECHO HOY ──
  if(alreadyDone) {
    const isGeneral = testKind === "general";
    return (
      <SafeAreaView style={{ flex:1, backgroundColor:C.cream }} edges={["top","bottom"]}>
        <StatusBar style="light"/>
        <View style={{ backgroundColor:C.teal700, paddingHorizontal:16, paddingTop:14, paddingBottom:18 }}>
          <Text style={{ fontFamily:"Georgia", fontSize:20, color:"white" }}>
            Smart<Text style={{ color:C.teal300 }}>Pills</Text>
          </Text>
        </View>
        <View style={{ flex:1, alignItems:"center", justifyContent:"center", padding:24 }}>
          <Text style={{ fontSize:64, marginBottom:14 }}>{isGeneral ? "🌐" : "🔥"}</Text>
          <Text style={{ fontFamily:"Georgia", fontSize:22, color:C.ink, marginBottom:8, textAlign:"center" }}>
            {isGeneral ? "¡Test general superado!" : "¡Reto de hoy superado!"}
          </Text>
          <Text style={{ fontSize:14, color:C.muted, marginBottom:24, textAlign:"center" }}>
            {isGeneral ? "Vuelve mañana para sumar más XP" : "Vuelve mañana para mantener tu racha"}
          </Text>
          {!isGeneral && (
            <View style={{ backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:14, padding:20, marginBottom:24, alignItems:"center", minWidth:200 }}>
              <Text style={{ fontSize:11, fontWeight:"500", letterSpacing:1, textTransform:"uppercase", color:C.muted2, marginBottom:8 }}>Racha actual</Text>
              <Text style={{ fontFamily:"Georgia", fontSize:48, color:C.teal600 }}>{streak}</Text>
              <Text style={{ fontSize:13, color:C.muted2 }}>días consecutivos 🔥</Text>
            </View>
          )}
          <Pressable onPress={() => router.back()}
            style={({pressed}) => ({ backgroundColor:C.teal600, paddingHorizontal:28, paddingVertical:12, borderRadius:20, opacity:pressed?0.85:1 })}>
            <Text style={{ color:"white", fontSize:14, fontWeight:"500" }}>Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── FLASH 1: puntuación (antes del resultado) ──
  if(showResult && !flashDismissed) {
    return <TestResultFlash correct={correct} onDismiss={() => setFlashDismissed(true)}/>;
  }

  // ── FLASH 2: racha (solo en reto diario, después del de puntuación) ──
  if(showResult && flashDismissed && testKind === "daily" && !streakFlashDismissed) {
    return <StreakFlash streak={newStreak ?? streak} onDismiss={() => setStreakFlashDismissed(true)}/>;
  }

  // ── RESULTADO ──
  if(showResult) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor:C.cream }} edges={["top","bottom"]}>
        <StatusBar style="light"/>
        <View style={{ backgroundColor:C.teal700, paddingHorizontal:16, paddingTop:14, paddingBottom:18 }}>
          <Text style={{ fontFamily:"Georgia", fontSize:20, color:"white" }}>
            Smart<Text style={{ color:C.teal300 }}>Pills</Text>
          </Text>
        </View>
        <ScrollView contentContainerStyle={{ padding:24, alignItems:"center" }}>
          <Text style={{ fontSize:64, marginBottom:8 }}>
            {correct === 5 ? "🏆" : correct >= 3 ? "⭐" : "💪"}
          </Text>
          <Text style={{ fontFamily:"Georgia", fontSize:24, color:C.ink, marginBottom:6, textAlign:"center" }}>¡Reto completado!</Text>
          <Text style={{ fontSize:13, color:C.muted, marginBottom:24, textAlign:"center" }}>
            {testKind === "general" ? "🌐 Test General" : "🔥 Reto Diario"} · SmartPills
          </Text>

          <View style={{ backgroundColor:C.white, borderWidth:1, borderColor:C.border, borderRadius:14, padding:24, marginBottom:16, alignItems:"center", width:"100%" }}>
            <Text style={{ fontSize:11, fontWeight:"500", letterSpacing:1, textTransform:"uppercase", color:C.muted2, marginBottom:6 }}>XP ganado hoy</Text>
            <Text style={{ fontFamily:"Georgia", fontSize:52, color:C.teal600 }}>+{score}</Text>

            <View style={{ height:1, backgroundColor:C.border, alignSelf:"stretch", marginTop:18, marginBottom:18 }}/>

            <View style={{ flexDirection:"row", gap:12, alignSelf:"stretch", justifyContent:testKind==="general"?"center":"space-around" }}>
              <View style={{ backgroundColor:C.cream, borderRadius:8, padding:12, alignItems:"center", flex:1 }}>
                <Text style={{ fontFamily:"Georgia", fontSize:24, color:C.teal600 }}>{correct}/5</Text>
                <Text style={{ fontSize:11, color:C.muted2, marginTop:2 }}>Aciertos</Text>
              </View>
              {testKind !== "general" && (
                <View style={{ backgroundColor:C.cream, borderRadius:8, padding:12, alignItems:"center", flex:1 }}>
                  <Text style={{ fontFamily:"Georgia", fontSize:24, color:C.amber500 }}>{newStreak || streak} 🔥</Text>
                  <Text style={{ fontSize:11, color:C.muted2, marginTop:2 }}>Días de racha</Text>
                </View>
              )}
            </View>
          </View>

          {saving && <Text style={{ fontSize:13, color:C.muted2, marginBottom:12 }}>Guardando resultados...</Text>}

          <Pressable onPress={() => router.back()}
            style={({pressed}) => ({ backgroundColor:C.teal600, paddingHorizontal:24, paddingVertical:13, borderRadius:20, width:"100%", alignItems:"center", opacity:pressed?0.85:1 })}>
            <Text style={{ color:"white", fontSize:14, fontWeight:"500" }}>Volver al menú</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── SIN RETO DISPONIBLE ──
  if(!challenge) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor:C.cream, alignItems:"center", justifyContent:"center", padding:20 }}>
        <Text style={{ fontSize:32, marginBottom:12 }}>⏳</Text>
        <Text style={{ fontSize:14, color:C.muted, textAlign:"center", marginBottom:18 }}>
          El reto de hoy se está preparando. Vuelve en unos minutos.
        </Text>
        <Pressable onPress={() => router.back()}
          style={{ backgroundColor:C.teal600, paddingHorizontal:24, paddingVertical:10, borderRadius:20 }}>
          <Text style={{ color:"white", fontSize:13 }}>Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── PREGUNTA ──
  const q = challenge.questions[currentIdx];
  const isWrong = optionStates.includes("wrong");

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.cream }} edges={["top"]}>
      <StatusBar style="light"/>

      {/* Cabecera */}
      <View style={{ backgroundColor:C.teal700, paddingHorizontal:16, paddingVertical:12, flexDirection:"row", alignItems:"center", justifyContent:"space-between" }}>
        <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
          <Pressable onPress={() => router.back()}
            style={{ backgroundColor:"rgba(255,255,255,0.1)", borderWidth:1, borderColor:"rgba(255,255,255,0.2)", borderRadius:8, paddingHorizontal:10, paddingVertical:4 }}>
            <Text style={{ fontSize:12, color:"white" }}>← Salir</Text>
          </Pressable>
          <Text style={{ fontFamily:"Georgia", fontSize:16, color:"white" }}>
            {testKind === "general" ? "🌐 Test General" : "🔥 Reto Diario"}
          </Text>
        </View>
        <View style={{ backgroundColor:"rgba(255,255,255,0.1)", borderWidth:1, borderColor:"rgba(255,255,255,0.15)", borderRadius:8, paddingHorizontal:10, paddingVertical:4 }}>
          <Text style={{ fontSize:12, color:"rgba(255,255,255,0.8)", fontWeight:"500" }}>{streak} días 🔥</Text>
        </View>
      </View>

      {/* Barra de progreso */}
      <View style={{ backgroundColor:C.white, borderBottomWidth:1, borderBottomColor:C.border, paddingHorizontal:16, paddingVertical:12 }}>
        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <Text style={{ fontSize:12, color:C.muted2, fontWeight:"500" }}>
            Pregunta {currentIdx+1} de {challenge.questions.length}
          </Text>
          <View style={{ backgroundColor:C.amber50, borderWidth:1, borderColor:C.amber100, borderRadius:12, paddingHorizontal:10, paddingVertical:3 }}>
            <Text style={{ fontSize:13, fontWeight:"500", color:C.amber500 }}>⭐ {score} XP</Text>
          </View>
        </View>
        <View style={{ height:5, backgroundColor:C.cream2, borderRadius:3, overflow:"hidden" }}>
          <View style={{ height:"100%", width:`${((currentIdx+1)/challenge.questions.length)*100}%`, backgroundColor:C.teal500, borderRadius:3 }}/>
        </View>
      </View>

      {/* Pregunta */}
      <ScrollView contentContainerStyle={{ padding:16 }}>
        <View style={{ flexDirection:"row", alignItems:"center", gap:8, marginBottom:10 }}>
          <View style={{ backgroundColor:C.teal50, paddingHorizontal:8, paddingVertical:2, borderRadius:8 }}>
            <Text style={{ fontSize:10, fontWeight:"500", textTransform:"uppercase", color:C.teal600 }}>{q.category || "Clínica"}</Text>
          </View>
        </View>

        <Text style={{ fontFamily:"Georgia", fontSize:18, lineHeight:24, color:C.ink, marginBottom:22 }}>
          {q.question}
        </Text>

        {q.options.map((opt, i) => (
          <OptionButton key={i} letter={["A","B","C","D"][i]} text={opt}
            state={optionStates[i]} onPress={() => handleAnswer(i)}/>
        ))}

        {answered && (
          <View style={{ marginTop:16, backgroundColor:isWrong?C.red50:C.teal50, borderWidth:1, borderColor:isWrong?C.red100:C.teal100, borderRadius:10, padding:14 }}>
            <Text style={{ fontSize:10, fontWeight:"500", textTransform:"uppercase", color:isWrong?C.red600:C.teal500, marginBottom:5 }}>
              {isWrong ? "❌ Explicación" : "✓ ¡Correcto!"}
            </Text>
            <Text style={{ fontSize:13, lineHeight:20, color:isWrong?"#7f1d1d":C.teal800 }}>
              {q.explanation}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Botón siguiente */}
      {answered && (
        <View style={{ backgroundColor:C.white, borderTopWidth:1, borderTopColor:C.border, padding:14, alignItems:"flex-end" }}>
          <Pressable onPress={handleNext}
            style={({pressed}) => ({ backgroundColor:C.teal600, paddingHorizontal:22, paddingVertical:11, borderRadius:18, opacity:pressed?0.85:1 })}>
            <Text style={{ color:"white", fontSize:13, fontWeight:"500" }}>
              {currentIdx+1 >= challenge.questions.length ? "Ver resultado →" : "Siguiente →"}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
