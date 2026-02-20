import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../components/AppHeader";
import ArmazenScreen from "./ArmazenScreen";
import ContratosScreen from "./ContratosScreen";
import MovimentacoesScreen from "./MovimentacoesScreen";

const ABAS = [
  { key: "armazem", title: "Armazém", icon: "business-outline" },
  { key: "movimentacoes", title: "Movimentações", icon: "swap-horizontal-outline" },
  { key: "contratos", title: "Contratos", icon: "document-text-outline" },
];

export default function HomeScreen({ onLogout }) {
  const [abaAtiva, setAbaAtiva] = useState(0);
  const titulo = ABAS[abaAtiva].title;

  return (
    <View style={styles.container}>
      <AppHeader title={titulo} onLogout={onLogout} />
      <View style={styles.content}>
        {abaAtiva === 0 && <ArmazenScreen />}
        {abaAtiva === 1 && <MovimentacoesScreen />}
        {abaAtiva === 2 && <ContratosScreen />}
      </View>
      <View style={styles.tabs}>
        {ABAS.map((aba, index) => (
          <TouchableOpacity
            key={aba.key}
            style={[styles.tab, index === abaAtiva && styles.tabAtivo]}
            onPress={() => setAbaAtiva(index)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={aba.icon}
              size={24}
              color={index === abaAtiva ? "#fff" : "#6b7280"}
            />
            <Text style={[styles.tabTexto, index === abaAtiva && styles.tabTextoAtivo]}>
              {aba.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9F3",
  },
  content: {
    flex: 1,
  },
  tabs: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
    paddingBottom: 24,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  tabAtivo: {
    backgroundColor: "#E4FFCC",
    marginHorizontal: 4,
    borderRadius: 12,
  },
  tabTexto: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  tabTextoAtivo: {
    color: "#166534",
    fontWeight: "600",
  },
});
