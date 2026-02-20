import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../lib/api";
import SiloSvg from "../components/SiloSvg";

export default function ArmazenScreen() {
  const [armazens, setArmazens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selecionado, setSelecionado] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");
  const [modalAdd, setModalAdd] = useState(false);
  const [nome, setNome] = useState("");
  const [capacidade, setCapacidade] = useState("");

  const carregar = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/armazens", { params: { limit: 999 } });
      const lista = Array.isArray(data) ? data : [];
      setArmazens(lista);
      setCurrentIndex((i) => (lista.length ? Math.min(i, lista.length - 1) : 0));
    } catch {
      setArmazens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleExcluir = () => {
    if (!selecionado) return;
    Alert.alert(
      "Excluir armazém",
      "Deseja realmente excluir este armazém?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            setExcluindo(true);
            setErro("");
            try {
              await api.delete(`/armazens/${selecionado.id}`);
              setSelecionado(null);
              carregar();
            } catch (err) {
              const msg = err.response?.data?.detail ?? "Erro ao excluir.";
              setErro(typeof msg === "string" ? msg : JSON.stringify(msg));
            } finally {
              setExcluindo(false);
            }
          },
        },
      ]
    );
  };

  const handleAdicionar = async () => {
    const cap = Number(String(capacidade).replace(/\D/g, "")) || 0;
    if (!nome.trim()) {
      setErro("Informe o nome.");
      return;
    }
    if (cap <= 0) {
      setErro("Informe a capacidade em kg.");
      return;
    }
    setErro("");
    try {
      await api.post("/armazens", { nome: nome.trim(), capacidade: cap });
      setModalAdd(false);
      setNome("");
      setCapacidade("");
      carregar();
    } catch (err) {
      const msg = err.response?.data?.detail ?? "Erro ao salvar.";
      setErro(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  const percentual = (a) => {
    const cap = a.capacidade ?? 0;
    const est = a.estoque ?? 0;
    if (cap <= 0) return 0;
    return Math.min(100, Math.round((est / cap) * 100));
  };

  const estadoSilo = (a) => {
    if (!a) return 0;
    const cap = a.capacidade ?? 0;
    const est = a.estoque ?? 0;
    if (cap <= 0 || est <= 0) return 0;
    if (est >= cap) return 5;
    const ratio = est / cap;
    return Math.min(5, Math.max(1, Math.round(ratio * 5)));
  };

  const armazemAtual = armazens.length ? armazens[currentIndex] : null;
  const temLista = armazens.length > 0;
  const { width: screenWidth } = Dimensions.get("window");
  const siloWidth = Math.min(screenWidth * 0.65, 280);
  const siloHeight = Math.round(siloWidth * (685 / 625));

  const anterior = () => {
    if (!temLista) return;
    setCurrentIndex((i) => (i - 1 + armazens.length) % armazens.length);
  };

  const proximo = () => {
    if (!temLista) return;
    setCurrentIndex((i) => (i + 1) % armazens.length);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.botaoAdd}
        onPress={() => { setModalAdd(true); setErro(""); }}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={22} color="#1a1a1a" />
        <Text style={styles.botaoAddTexto}>Adicionar Armazém</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.centralizar}>
          <ActivityIndicator size="large" color="#44AA00" />
        </View>
      ) : !temLista ? (
        <View style={styles.centralizar}>
          <SiloSvg estado={0} width={siloWidth} height={siloHeight} />
          <Text style={styles.vazio}>Nenhum armazém. Adicione o primeiro.</Text>
        </View>
      ) : (
        <View style={styles.carouselContainer}>
          {armazens.length > 1 && (
            <TouchableOpacity
              style={[styles.arrowButton, styles.arrowLeft]}
              onPress={anterior}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={28} color="#374151" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.siloTouchable}
            onPress={() => setSelecionado(armazemAtual)}
            activeOpacity={0.85}
          >
            <SiloSvg estado={estadoSilo(armazemAtual)} width={siloWidth} height={siloHeight} />
            <View style={styles.siloInfoOverlay}>
              <Text style={styles.siloNome}>{armazemAtual?.nome}</Text>
              <Text style={styles.siloDetail}>
                Capacidade: {(armazemAtual?.capacidade ?? 0).toLocaleString("pt-BR")} kg
              </Text>
              <Text style={styles.siloDetail}>
                Estoque: {(armazemAtual?.estoque ?? 0).toLocaleString("pt-BR")} kg
              </Text>
              <Text style={styles.siloHint}>
                Toque para ver detalhes · {currentIndex + 1} de {armazens.length}
              </Text>
            </View>
          </TouchableOpacity>

          {armazens.length > 1 && (
            <TouchableOpacity
              style={[styles.arrowButton, styles.arrowRight]}
              onPress={proximo}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={28} color="#374151" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <Modal
        visible={!!selecionado}
        transparent
        animationType="fade"
        onRequestClose={() => setSelecionado(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelecionado(null)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>{selecionado?.nome ?? "Armazém"}</Text>
              <TouchableOpacity onPress={() => setSelecionado(null)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {erro ? (
              <View style={styles.erroBox}>
                <Text style={styles.erroTexto}>{erro}</Text>
              </View>
            ) : null}
            {selecionado && (
              <>
                <View style={styles.detalhe}>
                  <Text style={styles.detalheLabel}>Capacidade (Kg)</Text>
                  <Text style={styles.detalheValor}>
                    {(selecionado.capacidade ?? 0).toLocaleString("pt-BR")}
                  </Text>
                </View>
                <View style={styles.detalhe}>
                  <Text style={styles.detalheLabel}>Estoque (Kg)</Text>
                  <Text style={styles.detalheValor}>
                    {(selecionado.estoque ?? 0).toLocaleString("pt-BR")}
                  </Text>
                </View>
                <View style={styles.barWrap}>
                  <View style={styles.barFundo}>
                    <View style={[styles.barPreenchido, { width: `${percentual(selecionado)}%` }]} />
                  </View>
                  <Text style={styles.barPct}>{percentual(selecionado)}%</Text>
                </View>
                <TouchableOpacity
                  style={[styles.botaoExcluir, excluindo && styles.botaoDisabled]}
                  onPress={handleExcluir}
                  disabled={excluindo}
                >
                  <Ionicons name="trash-outline" size={20} color="#b91c1c" />
                  <Text style={styles.botaoExcluirTexto}>Excluir armazém</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={modalAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Adicionar Armazém</Text>
              <TouchableOpacity onPress={() => setModalAdd(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {erro ? (
              <View style={styles.erroBox}>
                <Text style={styles.erroTexto}>{erro}</Text>
              </View>
            ) : null}
            <Text style={styles.inputLabel}>Nome</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Silo 1"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.inputLabel}>Capacidade (Kg)</Text>
            <TextInput
              style={styles.input}
              value={capacidade}
              onChangeText={setCapacidade}
              placeholder="10000"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
            />
            <TouchableOpacity style={styles.botaoSalvar} onPress={handleAdicionar}>
              <Text style={styles.botaoSalvarTexto}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centralizar: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  vazio: { fontSize: 15, color: "#6b7280", marginTop: 16 },
  botaoAdd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-end",
    margin: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#A6DE47",
    borderRadius: 12,
  },
  botaoAddTexto: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  carouselContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    paddingHorizontal: 50,
  },
  arrowButton: {
    position: "absolute",
    top: "45%",
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E4FFCC",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  arrowLeft: { left: 8 },
  arrowRight: { right: 8 },
  siloTouchable: {
    alignItems: "center",
    justifyContent: "center",
  },
  siloInfoOverlay: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minWidth: 200,
  },
  siloNome: { fontSize: 16, fontWeight: "700", color: "#1f2937", marginBottom: 4 },
  siloDetail: { fontSize: 13, color: "#4b5563", marginBottom: 2 },
  siloHint: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
  barWrap: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  barFundo: { flex: 1, height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, overflow: "hidden" },
  barPreenchido: { height: "100%", backgroundColor: "#22C55E", borderRadius: 4 },
  barPct: { fontSize: 12, fontWeight: "600", color: "#374151", minWidth: 32 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitulo: { fontSize: 18, fontWeight: "700", color: "#1f2937" },
  erroBox: { backgroundColor: "#fef2f2", padding: 12, borderRadius: 12, marginBottom: 12 },
  erroTexto: { fontSize: 14, color: "#b91c1c" },
  detalhe: { marginBottom: 12 },
  detalheLabel: { fontSize: 12, color: "#6b7280", marginBottom: 2 },
  detalheValor: { fontSize: 16, fontWeight: "600", color: "#1f2937" },
  botaoExcluir: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fca5a5",
    backgroundColor: "#fef2f2",
  },
  botaoExcluirTexto: { fontSize: 15, color: "#b91c1c", fontWeight: "500" },
  botaoDisabled: { opacity: 0.6 },
  inputLabel: { fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 6 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#1f2937",
    marginBottom: 16,
  },
  botaoSalvar: {
    backgroundColor: "#A6DE47",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  botaoSalvarTexto: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
});
