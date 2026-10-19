// Radice dell'app per iPhone (DEC-156): carattere Inter come sul computer (DEC-157), gesti,
// tastiera, la copia di lavoro con la sincronizzazione (negozio.tsx) e la navigazione a pila
// nativa di iOS (ritorno con il gesto dal bordo). Senza accesso e senza aver scelto di non usare
// il cloud si apre l'accesso (CMP-22, DEC-84).

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Redirect, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { NegozioProvider, useNegozio } from "@/dati/negozio";
import { useColori } from "@/tema";

function Navigazione() {
  const c = useColori();
  const { pronto, sessione, senzaCloud } = useNegozio();
  const segmenti = useSegments();
  if (!pronto) return <View style={{ flex: 1, backgroundColor: c.sfondoColonna }} />;
  const inAccesso = segmenti[0] === "accesso";
  if (!sessione && !senzaCloud && !inAccesso) return <Redirect href="/accesso" />;
  return (
    <Stack
      screenOptions={{
        headerTintColor: c.testoPrimario,
        headerShadowVisible: false,
        headerBackTitleStyle: { fontFamily: "Inter_400Regular" },
        headerTitleStyle: { fontFamily: "Inter_500Medium" },
        contentStyle: { backgroundColor: c.sfondoColonna },
      }}
    >
      <Stack.Screen name="accesso" options={{ headerShown: false, gestureEnabled: false }} />
    </Stack>
  );
}

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
        <NegozioProvider>
          <StatusBar style="auto" />
          <Navigazione />
        </NegozioProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
