import { createContext, useContext } from "react";

// Contexto global de la app: profile + función para recargarlo
export const AppContext = createContext({
  profile:        null,
  reloadProfile:  async () => {},
});

export function useApp() {
  return useContext(AppContext);
}
