import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "../lib/api";

const CARDS_POR_PAGINA = 9;

function formatarData(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatarValorBR(valor) {
  if (valor === "" || valor == null) return "-";
  const onlyDigits = String(valor).replace(/\D/g, "");
  if (onlyDigits === "") return "-";
  const centavos = parseInt(onlyDigits, 10);
  const reais = Math.floor(centavos / 100);
  const cents = centavos % 100;
  const reaisStr = reais.toLocaleString("pt-BR");
  return cents > 0 ? `R$ ${reaisStr},${String(cents).padStart(2, "0")}` : `R$ ${reaisStr}`;
}

function aplicarMascaraValor(text) {
  const onlyDigits = text.replace(/\D/g, "");
  if (onlyDigits === "") return "";
  const limited = onlyDigits.slice(0, 14);
  const centavos = parseInt(limited, 10) || 0;
  const reais = Math.floor(centavos / 100);
  const cents = centavos % 100;
  const reaisStr = reais.toLocaleString("pt-BR");
  return cents > 0 ? `R$ ${reaisStr},${String(cents).padStart(2, "0")}` : `R$ ${reaisStr}`;
}

function parseValorBR(str) {
  if (!str || typeof str !== "string") return 0;
  const cleaned = str.replace(/\D/g, "");
  if (cleaned === "") return 0;
  return Math.floor(parseInt(cleaned, 10) / 100);
}

function DatePickerField({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  const dateObj = value ? new Date(value + "T12:00:00") : new Date();
  const formattedDisplay = value
    ? new Date(value + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

  return (
    <View>
      <TouchableOpacity
        style={[dpStyles.input, !value && dpStyles.inputPlaceholder]}
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Text style={value ? dpStyles.inputText : dpStyles.placeholderText}>
          {value ? formattedDisplay : placeholder || "Selecione a data"}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#6b7280" />
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={dateObj}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selected) => {
            setShow(Platform.OS === "ios");
            if (selected) {
              const y = selected.getFullYear();
              const m = String(selected.getMonth() + 1).padStart(2, "0");
              const d = String(selected.getDate()).padStart(2, "0");
              onChange(`${y}-${m}-${d}`);
            }
          }}
        />
      )}
    </View>
  );
}

const dpStyles = StyleSheet.create({
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  inputPlaceholder: {},
  inputText: { fontSize: 16, color: "#1f2937" },
  placeholderText: { fontSize: 16, color: "#9ca3af" },
});

export default function ContratosScreen() {
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecionado, setSelecionado] = useState(null);
  const [modalAdd, setModalAdd] = useState(false);
  const [graos, setGraos] = useState([]);
  const [empresa, setEmpresa] = useState("");
  const [graoId, setGraoId] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [valor, setValor] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [pagina, setPagina] = useState(1);

  const carregar = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/contratos", { params: { limit: 999 } });
      setContratos(Array.isArray(data) ? data : []);
    } catch {
      setContratos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    if (modalAdd) {
      api.get("/graos").then((res) => {
        const g = res.data;
        setGraos(Array.isArray(g) ? g : Array.isArray(g?.data) ? g.data : []);
      }).catch(() => setGraos([]));
    }
  }, [modalAdd]);

  const handleExcluir = () => {
    if (!selecionado) return;
    Alert.alert(
      "Excluir contrato",
      `Deseja realmente excluir este contrato (${selecionado.empresa} - ${formatarData(selecionado.vencimento)})?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/contratos/${selecionado.id}`);
              setSelecionado(null);
              carregar();
            } catch (err) {
              const msg = err.response?.data?.detail ?? "Erro ao excluir.";
              Alert.alert("Erro", typeof msg === "string" ? msg : JSON.stringify(msg));
            }
          },
        },
      ]
    );
  };

  const handleAdicionar = async () => {
    const gId = graoId ? Number(graoId) : 0;
    const v = parseValorBR(valor);
    const qtd = quantidade ? Number(quantidade) : 0;
    if (!empresa.trim()) {
      setErro("Informe a empresa.");
      return;
    }
    if (!gId || gId < 1) {
      setErro("Selecione o grão.");
      return;
    }
    if (!vencimento) {
      setErro("Informe o vencimento.");
      return;
    }
    if (qtd < 0) {
      setErro("Quantidade inválida.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      await api.post("/contratos", {
        empresa: empresa.trim(),
        grao_id: gId,
        vencimento,
        valor: v,
        quantidade: qtd,
        data_pagamento: dataPagamento || null,
      });
      setModalAdd(false);
      setEmpresa("");
      setGraoId("");
      setVencimento("");
      setValor("");
      setQuantidade("");
      setDataPagamento("");
      carregar();
    } catch (err) {
      const msg = err.response?.data?.detail ?? "Erro ao salvar.";
      setErro(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSalvando(false);
    }
  };

  const progress = (c) => {
    const total = c.quantidade ?? 0;
    const ret = c.quantidade_retirada ?? 0;
    if (total <= 0) return 0;
    return Math.min(100, Math.round((ret / total) * 100));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.botaoAdd}
        onPress={() => { setModalAdd(true); setErro(""); }}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={22} color="#1a1a1a" />
        <Text style={styles.botaoAddTexto}>Adicionar Contrato</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.centralizar}>
          <ActivityIndicator size="large" color="#44AA00" />
        </View>
      ) : contratos.length === 0 ? (
        <View style={styles.centralizar}>
          <Text style={styles.vazio}>Nenhum contrato. Adicione o primeiro.</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={contratos.slice((pagina - 1) * CARDS_POR_PAGINA, pagina * CARDS_POR_PAGINA)}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.lista}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => setSelecionado(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.cardBadge}>Contrato {item.id}</Text>
                <Text style={styles.cardInfo}>Grão: {item.grao_nome || "-"}</Text>
                <Text style={styles.cardInfo}>Empresa: {item.empresa}</Text>
                <Text style={styles.cardInfo}>Vencimento: {formatarData(item.vencimento)}</Text>
                <View style={styles.barWrap}>
                  <View style={styles.barFundo}>
                    <View style={[styles.barPreenchido, { width: `${progress(item)}%` }]} />
                  </View>
                  <Text style={styles.barPct}>{progress(item)}%</Text>
                </View>
              </TouchableOpacity>
            )}
          />
          {Math.ceil(contratos.length / CARDS_POR_PAGINA) > 1 && (
            <View style={styles.paginacao}>
              <TouchableOpacity
                style={[styles.paginaBotao, pagina === 1 && styles.paginaBotaoDisabled]}
                onPress={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
              >
                <Ionicons name="chevron-back" size={20} color={pagina === 1 ? "#9ca3af" : "#374151"} />
              </TouchableOpacity>
              {Array.from({ length: Math.ceil(contratos.length / CARDS_POR_PAGINA) }, (_, i) => i + 1).map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.paginaBotao, pagina === n && styles.paginaBotaoAtivo]}
                  onPress={() => setPagina(n)}
                >
                  <Text style={[styles.paginaTexto, pagina === n && styles.paginaTextoAtivo]}>{n}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.paginaBotao, pagina === Math.ceil(contratos.length / CARDS_POR_PAGINA) && styles.paginaBotaoDisabled]}
                onPress={() => setPagina((p) => Math.min(Math.ceil(contratos.length / CARDS_POR_PAGINA), p + 1))}
                disabled={pagina === Math.ceil(contratos.length / CARDS_POR_PAGINA)}
              >
                <Ionicons name="chevron-forward" size={20} color={pagina === Math.ceil(contratos.length / CARDS_POR_PAGINA) ? "#9ca3af" : "#374151"} />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <Modal visible={!!selecionado} transparent animationType="fade" onRequestClose={() => setSelecionado(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelecionado(null)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Contrato {selecionado?.id}</Text>
              <TouchableOpacity onPress={() => setSelecionado(null)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {selecionado && (
              <>
                <View style={styles.detalhe}>
                  <Text style={styles.detalheLabel}>Empresa</Text>
                  <Text style={styles.detalheValor}>{selecionado.empresa || "-"}</Text>
                </View>
                <View style={styles.detalhe}>
                  <Text style={styles.detalheLabel}>Grão</Text>
                  <Text style={styles.detalheValor}>{selecionado.grao_nome || "-"}</Text>
                </View>
                <View style={styles.detalhe}>
                  <Text style={styles.detalheLabel}>Vencimento</Text>
                  <Text style={styles.detalheValor}>{formatarData(selecionado.vencimento)}</Text>
                </View>
                <View style={styles.detalhe}>
                  <Text style={styles.detalheLabel}>Valor</Text>
                  <Text style={styles.detalheValor}>{formatarValorBR(String(Number(selecionado.valor ?? 0) * 100))}</Text>
                </View>
                {selecionado.data_pagamento ? (
                  <View style={styles.detalhe}>
                    <Text style={styles.detalheLabel}>Data de pagamento</Text>
                    <Text style={styles.detalheValor}>{formatarData(selecionado.data_pagamento)}</Text>
                  </View>
                ) : null}
                <View style={styles.detalhe}>
                  <Text style={styles.detalheLabel}>Quantidade (Kg)</Text>
                  <Text style={styles.detalheValor}>{(selecionado.quantidade ?? 0).toLocaleString("pt-BR")}</Text>
                </View>
                <View style={styles.detalhe}>
                  <Text style={styles.detalheLabel}>Quantidade retirada (Kg)</Text>
                  <Text style={styles.detalheValor}>{(selecionado.quantidade_retirada ?? 0).toLocaleString("pt-BR")}</Text>
                </View>
                <View style={styles.detalhe}>
                  <Text style={styles.detalheLabel}>Andamento</Text>
                  <View style={styles.barWrap}>
                    <View style={styles.barFundo}>
                      <View style={[styles.barPreenchido, { width: `${progress(selecionado)}%` }]} />
                    </View>
                    <Text style={styles.barPct}>{progress(selecionado)}%</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.botaoExcluir} onPress={handleExcluir}>
                  <Ionicons name="trash-outline" size={20} color="#b91c1c" />
                  <Text style={styles.botaoExcluirTexto}>Excluir contrato</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={modalAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>Adicionar Contrato</Text>
                <TouchableOpacity onPress={() => setModalAdd(false)}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              {erro ? (
                <View style={styles.erroBox}>
                  <Text style={styles.erroTexto}>{erro}</Text>
                </View>
              ) : null}
              <Text style={styles.inputLabel}>Empresa</Text>
              <TextInput style={styles.input} value={empresa} onChangeText={setEmpresa} placeholder="Empresa" placeholderTextColor="#9ca3af" />
              <Text style={styles.inputLabel}>Grão</Text>
              <View style={styles.graosWrap}>
                {graos.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.graoBtn, graoId === String(g.id) && styles.graoBtnSel]}
                    onPress={() => setGraoId(String(g.id))}
                  >
                    <Text style={[styles.graoBtnTexto, graoId === String(g.id) && styles.graoBtnTextoSel]}>{g.nome}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Vencimento</Text>
              <DatePickerField value={vencimento} onChange={setVencimento} placeholder="Selecione o vencimento" />
              <Text style={styles.inputLabel}>Valor (R$)</Text>
              <TextInput
                style={styles.input}
                value={valor}
                onChangeText={(text) => setValor(aplicarMascaraValor(text))}
                placeholder="R$ 0,00"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
              />
              <Text style={styles.inputLabel}>Quantidade (Kg)</Text>
              <TextInput style={styles.input} value={quantidade} onChangeText={setQuantidade} placeholder="10000" placeholderTextColor="#9ca3af" keyboardType="number-pad" />
              <Text style={styles.inputLabel}>Data pagamento (opcional)</Text>
              <DatePickerField value={dataPagamento} onChange={setDataPagamento} placeholder="Selecione a data" />
              <TouchableOpacity style={[styles.botaoSalvar, salvando && styles.botaoDisabled]} onPress={handleAdicionar} disabled={salvando}>
                <Text style={styles.botaoSalvarTexto}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centralizar: { flex: 1, justifyContent: "center", alignItems: "center" },
  vazio: { fontSize: 15, color: "#6b7280" },
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
  lista: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: "#F5F5F4",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardBadge: { fontSize: 14, fontWeight: "700", color: "#22C55E", marginBottom: 8 },
  cardInfo: { fontSize: 14, color: "#4b5563", marginBottom: 4 },
  barWrap: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  barFundo: { flex: 1, height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, overflow: "hidden" },
  barPreenchido: { height: "100%", backgroundColor: "#22C55E", borderRadius: 4 },
  barPct: { fontSize: 12, fontWeight: "600", color: "#374151", minWidth: 32 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20 },
  modalScroll: { flexGrow: 1, justifyContent: "center", paddingVertical: 24 },
  modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
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
  graosWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  graoBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: "#d1d5db", backgroundColor: "#f9fafb" },
  graoBtnSel: { borderColor: "#44AA00", backgroundColor: "#E4FFCC" },
  graoBtnTexto: { fontSize: 15, color: "#374151" },
  graoBtnTextoSel: { fontWeight: "600", color: "#166534" },
  botaoSalvar: { backgroundColor: "#A6DE47", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
  botaoSalvarTexto: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  botaoDisabled: { opacity: 0.6 },
  paginacao: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: "#F7F9F3",
  },
  paginaBotao: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  paginaBotaoAtivo: {
    backgroundColor: "#44AA00",
    borderColor: "#44AA00",
  },
  paginaBotaoDisabled: { opacity: 0.5 },
  paginaTexto: { fontSize: 14, fontWeight: "600", color: "#374151" },
  paginaTextoAtivo: { color: "#fff" },
});
