// Radice dell'app per iPhone (DEC-156): carattere Inter come sul computer (DEC-157), gesti,
// tastiera e copia di lavoro per tutte le schermate, e la navigazione a pila nativa di iOS
// (ritorno con il gesto dal bordo).

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { prepara } from "@/dati/archivio";
import { useColori } from "@/tema";

export default function Radice() {
  const c = useColori();
  const [caricato] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  if (!caricato) return <View style={{ flex: 1, backgroundColor: c.sfondoColonna }} />;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SQLiteProvider databaseName="copia-di-lavoro.db" onInit={prepara}>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerTintColor: c.testoPrimario,
              headerShadowVisible: false,
              headerBackTitleStyle: { fontFamily: "Inter_400Regular" },
              headerTitleStyle: { fontFamily: "Inter_500Medium" },
              contentStyle: { backgroundColor: c.sfondoColonna },
            }}
          />
        </SQLiteProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
