import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { supabase } from "../lib/supabase";
import { useApp } from "../lib/app-context";

const C = {
  teal800:"#0f3d35", teal700:"#155c50", teal600:"#1a7a69", teal500:"#1d9e87", teal300:"#6dcfc0", teal50:"#edf8f6",
  coral500:"#d4522a", coral100:"#fae8e2", coral50:"#fdf4f1",
  cream:"#f7f5f0", white:"#ffffff", ink:"#1c2b26", muted:"#607068", muted2:"#96a89f",
  border:"rgba(28,43,38,0.09)", borderMd:"rgba(28,43,38,0.16)",
};

const PROFESSIONS = [
  { value:"medicina",     label:"Medicina",      icon:"🩺" },
  { value:"enfermería",   label:"Enfermería",    icon:"💉" },
  { value:"farmacia",     label:"Farmacia",      icon:"💊" },
  { value:"fisioterapia", label:"Fisioterapia",  icon:"🦴" },
];

export default function Onboarding() {
  const { reloadProfile }     = useApp();
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState({ profession:"", specialty:"", workplace:"" });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  const STEPS = [
    {
      key: "profession",
      title: "¿Cuál es tu profesión?",
      subtitle: "Te mostraremos el contenido más relevante para ti",
      isText: false,
    },
    {
      key: "specialty",
      title: "¿Cuál es tu especialidad?",
      subtitle: "Escribe tu especialidad concreta",
      isText: true,
      placeholder: "Ej: cardiología, pediatría, urgencias...",
    },
    {
      key: "workplace",
      title: "¿Dónde trabajas?",
      subtitle: "Opcional — personaliza tu experiencia",
      isText: true,
      placeholder: "Hospital, clínica, centro de salud...",
    },
  ];

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;
  const canNext = current.isText ? true : !!answers[current.key];

  async function handleFinish() {
    setSaving(true); setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if(!user) throw new Error("Sesión no encontrada");

      const { error } = await supabase.from("profiles").update({
        profession:           answers.profession,
        specialty:            answers.specialty,
        workplace:            answers.workplace,
        onboarding_completed: true,
        updated_at:           new Date().toISOString(),
      }).eq("auth_user_id", user.id);

      if(error) throw error;
      // Refrescar perfil en el layout raíz para que detecte que onboarding está completo
      await reloadProfile();
    } catch(err) {
      setError(err.message || "Error al guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  function handleNext() {
    if(isLast) handleFinish();
    else       setStep(s => s + 1);
  }

  function handleBack() {
    if(step > 0) setStep(s => s - 1);
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.cream }} edges={["top","bottom"]}>
      <StatusBar style="light"/>
      <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined} style={{ flex:1 }}>

        {/* Cabecera */}
        <View style={{ backgroundColor:C.teal800, paddingHorizontal:24, paddingTop:32, paddingBottom:28 }}>
          <Text style={{ fontFamily:"Georgia", fontSize:26, color:"white", marginBottom:6 }}>
            Smart<Text style={{ color:C.teal300 }}>Pills</Text>
          </Text>
          <Text style={{ fontSize:13, color:"rgba(255,255,255,0.55)" }}>Personaliza tu experiencia</Text>

          {/* Barra de progreso */}
          <View style={{ flexDirection:"row", gap:6, marginTop:20 }}>
            {STEPS.map((_,i) => (
              <View key={i} style={{ flex:1, height:3, borderRadius:2, backgroundColor: i<=step ? "white" : "rgba(255,255,255,0.25)" }}/>
            ))}
          </View>
          <Text style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginTop:6 }}>
            Paso {step+1} de {STEPS.length}
          </Text>
        </View>

        {/* Contenido del paso */}
        <ScrollView contentContainerStyle={{ flexGrow:1, padding:20 }} keyboardShouldPersistTaps="handled">
          <Text style={{ fontFamily:"Georgia", fontSize:22, color:C.ink, marginBottom:6 }}>
            {current.title}
          </Text>
          <Text style={{ fontSize:13, color:C.muted2, marginBottom:24 }}>
            {current.subtitle}
          </Text>

          {current.isText ? (
            <View>
              <TextInput value={answers[current.key]}
                onChangeText={v => setAnswers(a => ({...a, [current.key]: v}))}
                placeholder={current.placeholder}
                placeholderTextColor={C.muted2}
                style={{ width:"100%", paddingHorizontal:16, paddingVertical:14, borderRadius:12, borderWidth:1.5, borderColor:C.borderMd, fontSize:15, backgroundColor:C.white, color:C.ink }}/>
              <Text style={{ fontSize:12, color:C.muted2, marginTop:8 }}>
                Puedes dejarlo en blanco y completarlo más tarde en tu perfil.
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection:"row", flexWrap:"wrap", gap:10 }}>
              {PROFESSIONS.map(opt => {
                const selected = answers[current.key] === opt.value;
                return (
                  <Pressable key={opt.value}
                    onPress={() => setAnswers(a => ({...a, [current.key]: opt.value}))}
                    style={({pressed}) => ({
                      width: "48%",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: selected ? C.teal600 : C.border,
                      backgroundColor: selected ? C.teal50 : C.white,
                      opacity: pressed ? 0.85 : 1,
                    })}>
                    <Text style={{ fontSize:22 }}>{opt.icon}</Text>
                    <Text style={{ fontSize:13, fontWeight:"500", color: selected ? C.teal600 : C.ink }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {error && (
            <View style={{ marginTop:16, backgroundColor:C.coral50, borderWidth:1, borderColor:C.coral100, borderRadius:8, padding:10 }}>
              <Text style={{ fontSize:13, color:C.coral500 }}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Botones */}
        <View style={{ flexDirection:"row", gap:10, padding:20 }}>
          {step > 0 && (
            <Pressable onPress={handleBack}
              style={({pressed}) => ({ flex:1, paddingVertical:13, borderRadius:20, borderWidth:1, borderColor:C.border, backgroundColor:C.white, alignItems:"center", opacity:pressed?0.85:1 })}>
              <Text style={{ fontSize:14, fontWeight:"500", color:C.muted }}>← Atrás</Text>
            </Pressable>
          )}
          <Pressable onPress={handleNext} disabled={!canNext || saving}
            style={({pressed}) => ({ flex:2, paddingVertical:13, borderRadius:20, backgroundColor: canNext ? C.teal600 : C.muted2, alignItems:"center", opacity:pressed?0.85:1 })}>
            {saving
              ? <ActivityIndicator color="white"/>
              : <Text style={{ fontSize:14, fontWeight:"500", color:"white" }}>{isLast ? "¡Empezar!" : "Siguiente →"}</Text>
            }
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
