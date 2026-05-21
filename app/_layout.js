import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { AppContext } from "../lib/app-context";
import SplashAnimation from "../components/SplashAnimation";

const C = {
  cream:   "#f7f5f0",
  teal600: "#1a7a69",
};

export default function RootLayout() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [splashDone, setSplashDone] = useState(false);
  const router   = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if(session) loadProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if(newSession) loadProfile(newSession.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_user_id", userId)
      .single();
    setProfile(data);
    setLoading(false);
  }

  async function reloadProfile() {
    if(session?.user?.id) await loadProfile(session.user.id);
  }

  // Redirección según estado: login → onboarding → home
  useEffect(() => {
    if(loading) return;

    const current = segments[0];

    if(!session && current !== "login") {
      router.replace("/login");
    } else if(session && profile && !profile.onboarding_completed && current !== "onboarding") {
      router.replace("/onboarding");
    } else if(session && profile?.onboarding_completed && (current === "login" || current === "onboarding")) {
      router.replace("/");
    }
  }, [loading, session, profile, segments]);

  if(!splashDone) {
    return <SplashAnimation onFinish={() => setSplashDone(true)}/>;
  }

  if(loading) {
    return (
      <View style={{ flex:1, backgroundColor:C.cream, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator size="large" color={C.teal600}/>
      </View>
    );
  }

  return (
    <AppContext.Provider value={{ profile, reloadProfile }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
          <Stack.Screen name="(tabs)"/>
          <Stack.Screen name="login"/>
          <Stack.Screen name="onboarding"/>
        </Stack>
      </SafeAreaProvider>
    </AppContext.Provider>
  );
}
