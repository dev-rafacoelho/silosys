import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { logout } from "../lib/auth";

export default function HomeScreen({ onLogout }) {
  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>SiloSys</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.botaoSair}>
          <Ionicons name="log-out-outline" size={24} color="#374151" />
          <Text style={styles.botaoSairTexto}>Sair</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.welcome}>Bem-vindo ao SiloSys</Text>
        <Text style={styles.subtitle}>Você está logado.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
  },
  botaoSair: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  botaoSairTexto: {
    fontSize: 15,
    color: "#374151",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  welcome: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
  },
});
