import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { login } from "../lib/auth";
import LogoSiloSys from "../components/LogoSiloSys";

const CORES = {
  fundo: "#1a1a1a",
  card: "rgba(255,255,255,0.95)",
  botao: "#BCEB3C",
  botaoHover: "#a8d334",
  texto: "#1f2937",
  textoClaro: "#6b7280",
  erroBg: "#fef2f2",
  erroBorda: "#fecaca",
  erroTexto: "#b91c1c",
};

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErro("");
    if (!email.trim() || !senha.trim()) {
      setErro("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), senha);
      onLoginSuccess?.();
    } catch (err) {
      const msg =
        err.response?.data?.detail || "Erro ao fazer login. Tente novamente.";
      setErro(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../assets/fundo.jpeg")}
        style={styles.fundo}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboard}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <View style={styles.logoRow}>
                <LogoSiloSys width={48} height={64} />
                <Text style={styles.titulo}>SiloSys</Text>
              </View>
              <Text style={styles.subtitulo}>
                Faça seu login para acessar o sistema
              </Text>

              {erro ? (
                <View style={styles.erroBox}>
                  <Text style={styles.erroTexto}>{erro}</Text>
                </View>
              ) : null}

              <TextInput
                style={styles.input}
                placeholder="Digite e-mail ou usuário"
                placeholderTextColor={CORES.textoClaro}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <View style={styles.senhaWrap}>
                <TextInput
                  style={[styles.input, styles.inputSenha]}
                  placeholder="Digite sua senha"
                  placeholderTextColor={CORES.textoClaro}
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry={!mostrarSenha}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.olho}
                  onPress={() => setMostrarSenha((v) => !v)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons
                    name={mostrarSenha ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={CORES.textoClaro}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.botao, loading && styles.botaoDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={CORES.texto} size="small" />
                ) : (
                  <Text style={styles.botaoTexto}>Entrar</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.fundo,
  },
  fundo: {
    flex: 1,
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  keyboard: {
    flex: 1,
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingVertical: 48,
  },
  card: {
    backgroundColor: CORES.card,
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(229,231,235,0.8)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "700",
    color: CORES.texto,
  },
  subtitulo: {
    fontSize: 14,
    color: CORES.textoClaro,
    marginBottom: 24,
  },
  erroBox: {
    backgroundColor: CORES.erroBg,
    borderWidth: 1,
    borderColor: CORES.erroBorda,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  erroTexto: {
    fontSize: 14,
    color: CORES.erroTexto,
  },
  input: {
    height: 52,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: CORES.texto,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 14,
  },
  inputSenha: {
    paddingRight: 48,
    marginBottom: 0,
  },
  senhaWrap: {
    position: "relative",
    height: 52,
    marginBottom: 20,
  },
  olho: {
    position: "absolute",
    right: 0,
    top: 0,
    height: 52,
    width: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  botao: {
    backgroundColor: CORES.botao,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  botaoDisabled: {
    opacity: 0.7,
  },
  botaoTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: CORES.texto,
  },
});
