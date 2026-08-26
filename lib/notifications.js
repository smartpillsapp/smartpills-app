// Registro de push token + canal Android para los recordatorios de racha.
//
// Esto solo funciona en builds reales (development build o release), NO en
// Expo Go. En Expo Go la llamada falla silenciosamente y la app sigue
// funcionando.

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { supabase } from "./supabase";

// Comportamiento por defecto cuando la notificación llega con la app abierta.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   false,
  }),
});

// Asegura que el canal Android existe (sin él, en Android 8+ no se muestran).
export async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("streak-reminders", {
    name:        "Recordatorios de racha",
    importance:  Notifications.AndroidImportance.HIGH,
    sound:       "default",
    enableVibrate: true,
    lightColor:  "#1a7a69",
  });
}

// Pide permiso, obtiene el token de Expo y lo guarda en push_tokens.
// Devuelve true si se registró con éxito, false en caso contrario.
export async function registerForPushNotificationsAsync(authUserId) {
  try {
    if (!Device.isDevice) return false; // no funciona en simulador
    await ensureAndroidChannel();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return false;

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      console.warn("[notifications] sin projectId — no se puede pedir token Expo");
      return false;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const expoToken = tokenData?.data;
    if (!expoToken || !authUserId) return false;

    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Madrid";

    const { error } = await supabase
      .from("push_tokens")
      .upsert(
        {
          auth_user_id: authUserId,
          expo_token:   expoToken,
          device_type:  Platform.OS,
          timezone,
          is_active:    true,
          updated_at:   new Date().toISOString(),
        },
        { onConflict: "expo_token" },
      );
    if (error) {
      console.warn("[notifications] upsert error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[notifications] register error:", err?.message || err);
    return false;
  }
}

// Listener de tap: cuando el usuario pulsa la notificación, navega a la ruta
// que la Edge Function metió en data.route (por defecto el test diario).
// Devuelve la subscription para que el caller la pueda limpiar.
export function attachNotificationTapListener(router) {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const route = response?.notification?.request?.content?.data?.route;
    if (route) {
      try { router.push(route); } catch {}
    }
  });
  return sub;
}
