import { useState, useEffect, useMemo } from "react";
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

function formatarData(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatarNumero(n) {
  if (n == null || n === "") return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return num.toLocaleString("pt-BR");
}

function aplicarFiltros(lista, filtros) {
  if (!lista.length) return lista;
  const { dataInicio: fdInicio, dataFim: fdFim, tipo: ft, grao: fg, quantidade: fq, placa: fp, status: fs } = filtros;
  const hasAny = [fdInicio, fdFim, ft, fg, fq, fp, fs].some((v) => v != null && String(v).trim() !== "");
  if (!hasAny) return lista;
  const dataInicioStr = (fdInicio && String(fdInicio).trim()) || "";
  const dataFimStr = (fdFim && String(fdFim).trim()) || "";
  const tipoStr = (ft && String(ft).trim().toLowerCase()) || "";
  const graoStr = (fg && String(fg).trim().toLowerCase()) || "";
  const qtdStr = (fq != null && String(fq).trim()) !== "" ? String(fq).trim() : "";
  const placaStr = (fp && String(fp).trim().toLowerCase()) || "";
  const statusStr = (fs && String(fs).trim().toLowerCase()) || "";
  const inicioDate = dataInicioStr ? new Date(dataInicioStr + "T00:00:00") : null;
  const fimDate = dataFimStr ? new Date(dataFimStr + "T23:59:59.999") : null;
  return lista.filter((row) => {
    if (dataInicioStr || dataFimStr) {
      const rowDate = row.data ? new Date(row.data) : null;
      if (!rowDate || Number.isNaN(rowDate.getTime())) return false;
      if (inicioDate && rowDate < inicioDate) return false;
      if (fimDate && rowDate > fimDate) return false;
    }
    if (tipoStr && !String(row.tipo || "").toLowerCase().includes(tipoStr)) return false;
    if (graoStr && !String(row.grao || "").toLowerCase().includes(graoStr)) return false;
    if (qtdStr !== "" && !String(row.quantidade ?? "").includes(qtdStr)) return false;
    if (placaStr && !String(row.placa || "").toLowerCase().includes(placaStr)) return false;
    if (statusStr && !String(row.status || "").toLowerCase().includes(statusStr)) return false;
    return true;
  });
}

const onlyAlphanumeric = (s) => String(s).replace(/[^A-Za-z0-9]/g, "");

const POR_PAGINA = 10;

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
        style={[pickerStyles.input, !value && pickerStyles.inputPlaceholder]}
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Text style={value ? pickerStyles.inputText : pickerStyles.placeholderText}>
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

const pickerStyles = StyleSheet.create({
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  inputPlaceholder: {},
  inputText: { fontSize: 15, color: "#1f2937" },
  placeholderText: { fontSize: 15, color: "#9ca3af" },
});

export default function MovimentacoesScreen() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtrosAberto, setFiltrosAberto] = useState(false);
  const [filtros, setFiltros] = useState({
    dataInicio: "",
    dataFim: "",
    tipo: "",
    grao: "",
    quantidade: "",
    placa: "",
    status: "",
  });
  const [excluindo, setExcluindo] = useState(false);
  const [modalTipo, setModalTipo] = useState(false);
  const [modalAdicionar, setModalAdicionar] = useState(false);
  const [modalRetirar, setModalRetirar] = useState(false);

  const carregar = async () => {
    setLoading(true);
    try {
      const [resAdicoes, resRetiradas] = await Promise.all([
        api.get("/adicoes", { params: { limit: 999 } }),
        api.get("/retiradas", { params: { limit: 999 } }),
      ]);
      const adicoes = Array.isArray(resAdicoes.data) ? resAdicoes.data : [];
      const retiradas = Array.isArray(resRetiradas.data) ? resRetiradas.data : [];
      const entradas = adicoes.map((a) => ({
        id: `e-${a.id}`,
        data: a.created_at,
        tipo: "Entrada",
        grao: a.grao_nome || "—",
        quantidade: a.quantidade,
        placa: a.placa || "—",
        status: "Concluído",
      }));
      const saidas = retiradas.map((r) => {
        const bruto = r.peso_bruto ?? 0;
        const tara = r.tara ?? 0;
        return {
          id: `s-${r.id}`,
          data: r.created_at,
          tipo: "Saída",
          grao: r.grao_nome || "—",
          quantidade: Math.max(0, bruto - tara),
          placa: r.placa || "—",
          status: "Concluído",
        };
      });
      const merged = [...entradas, ...saidas].sort((a, b) => {
        const ta = a.data ? new Date(a.data).getTime() : 0;
        const tb = b.data ? new Date(b.data).getTime() : 0;
        return tb - ta;
      });
      setLista(merged);
    } catch {
      setLista([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const listaFiltrada = useMemo(() => aplicarFiltros(lista, filtros), [lista, filtros]);
  const setFiltro = (campo, valor) => setFiltros((f) => ({ ...f, [campo]: valor }));
  const limparFiltros = () =>
    setFiltros({
      dataInicio: "",
      dataFim: "",
      tipo: "",
      grao: "",
      quantidade: "",
      placa: "",
      status: "",
    });
  const temFiltroAtivo = Object.values(filtros).some((v) => String(v).trim() !== "");

  const [pagina, setPagina] = useState(1);
  useEffect(() => { setPagina(1); }, [listaFiltrada.length, filtros]);
  const totalPaginas = Math.ceil(listaFiltrada.length / POR_PAGINA) || 1;
  const inicio = (pagina - 1) * POR_PAGINA;
  const listaPaginada = listaFiltrada.slice(inicio, inicio + POR_PAGINA);

  const opcoesGraos = useMemo(() => {
    const set = new Set();
    lista.forEach((row) => {
      if (row.grao && String(row.grao).trim() && row.grao !== "—") set.add(row.grao);
    });
    return Array.from(set).sort();
  }, [lista]);
  const opcoesStatus = useMemo(() => {
    const set = new Set();
    lista.forEach((row) => {
      if (row.status && String(row.status).trim()) set.add(row.status);
    });
    return Array.from(set).sort();
  }, [lista]);

  const pedirExclusao = (row) => {
    Alert.alert(
      "Excluir movimentação",
      `Deseja realmente excluir esta movimentação (${row.tipo} - ${formatarData(row.data)})?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const isEntrada = String(row.id).startsWith("e-");
            const id = String(row.id).slice(2);
            const endpoint = isEntrada ? "/adicoes" : "/retiradas";
            setExcluindo(true);
            try {
              await api.delete(`${endpoint}/${id}`);
              carregar();
            } catch (err) {
              const msg = err.response?.data?.detail ?? "Erro ao excluir.";
              Alert.alert("Erro", typeof msg === "string" ? msg : JSON.stringify(msg));
            } finally {
              setExcluindo(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.botaoFiltrar}
        onPress={() => setFiltrosAberto((a) => !a)}
        activeOpacity={0.85}
      >
        <Ionicons name="filter-outline" size={20} color="#166534" />
        <Text style={styles.botaoFiltrarTexto}>{filtrosAberto ? "Ocultar filtros" : "Filtrar"}</Text>
        {temFiltroAtivo && !filtrosAberto && (
          <View style={styles.badge}><Text style={styles.badgeTexto}>ativo</Text></View>
        )}
      </TouchableOpacity>

      {filtrosAberto && (
        <View style={styles.filtrosBox}>
          {temFiltroAtivo && (
            <TouchableOpacity onPress={limparFiltros}>
              <Text style={styles.limparFiltros}>Limpar filtros</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.inputLabel}>Data inicial</Text>
          <DatePickerField value={filtros.dataInicio} onChange={(v) => setFiltro("dataInicio", v)} placeholder="Data inicial" />
          <Text style={styles.inputLabel}>Data final</Text>
          <DatePickerField value={filtros.dataFim} onChange={(v) => setFiltro("dataFim", v)} placeholder="Data final" />
          <Text style={styles.inputLabel}>Tipo</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.chip, filtros.tipo === "Entrada" && styles.chipSel]} onPress={() => setFiltro("tipo", filtros.tipo === "Entrada" ? "" : "Entrada")}>
              <Text style={[styles.chipTexto, filtros.tipo === "Entrada" && styles.chipTextoSel]}>Entrada</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, filtros.tipo === "Saída" && styles.chipSel]} onPress={() => setFiltro("tipo", filtros.tipo === "Saída" ? "" : "Saída")}>
              <Text style={[styles.chipTexto, filtros.tipo === "Saída" && styles.chipTextoSel]}>Saída</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.inputLabel}>Grão</Text>
          <View style={styles.chipsWrap}>
            <TouchableOpacity style={[styles.chip, !filtros.grao && styles.chipSel]} onPress={() => setFiltro("grao", "")}>
              <Text style={[styles.chipTexto, !filtros.grao && styles.chipTextoSel]}>Todos</Text>
            </TouchableOpacity>
            {opcoesGraos.map((g) => (
              <TouchableOpacity key={g} style={[styles.chip, filtros.grao === g && styles.chipSel]} onPress={() => setFiltro("grao", filtros.grao === g ? "" : g)}>
                <Text style={[styles.chipTexto, filtros.grao === g && styles.chipTextoSel]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.inputLabel}>Quantidade</Text>
          <TextInput style={styles.input} value={filtros.quantidade} onChangeText={(v) => setFiltro("quantidade", v)} placeholder="Número" placeholderTextColor="#9ca3af" keyboardType="number-pad" />
          <Text style={styles.inputLabel}>Placa</Text>
          <TextInput style={styles.input} value={filtros.placa} onChangeText={(v) => setFiltro("placa", onlyAlphanumeric(v))} placeholder="Letras e números" placeholderTextColor="#9ca3af" autoCapitalize="characters" />
          <Text style={styles.inputLabel}>Status</Text>
          <View style={styles.chipsWrap}>
            <TouchableOpacity style={[styles.chip, !filtros.status && styles.chipSel]} onPress={() => setFiltro("status", "")}>
              <Text style={[styles.chipTexto, !filtros.status && styles.chipTextoSel]}>Todos</Text>
            </TouchableOpacity>
            {opcoesStatus.map((s) => (
              <TouchableOpacity key={s} style={[styles.chip, filtros.status === s && styles.chipSel]} onPress={() => setFiltro("status", filtros.status === s ? "" : s)}>
                <Text style={[styles.chipTexto, filtros.status === s && styles.chipTextoSel]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.botaoAdd} onPress={() => setModalTipo(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={22} color="#1a1a1a" />
        <Text style={styles.botaoAddTexto}>Adicionar Movimentação</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.centralizar}>
          <ActivityIndicator size="large" color="#44AA00" />
        </View>
      ) : listaFiltrada.length === 0 ? (
        <View style={styles.centralizar}>
          <Text style={styles.vazio}>Nenhuma movimentação.</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={listaPaginada}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.lista}
            renderItem={({ item }) => (
              <View style={styles.rowCard}>
                <View style={styles.cardMain}>
                  <Text style={styles.cardData}>{formatarData(item.data)}</Text>
                  <Text style={styles.cardTipo}>{item.tipo}</Text>
                  <Text style={styles.cardInfo}>{item.grao}</Text>
                  <Text style={styles.cardInfo}>{formatarNumero(item.quantidade)} kg</Text>
                  <Text style={styles.cardInfo}>Placa: {item.placa}</Text>
                </View>
                <TouchableOpacity style={styles.botaoExcluirRow} onPress={() => pedirExclusao(item)}>
                  <Ionicons name="trash-outline" size={20} color="#b91c1c" />
                </TouchableOpacity>
              </View>
            )}
          />
          {totalPaginas > 1 && (
            <View style={styles.paginacao}>
              <TouchableOpacity
                style={[styles.paginaBotao, pagina === 1 && styles.paginaBotaoDisabled]}
                onPress={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
              >
                <Ionicons name="chevron-back" size={20} color={pagina === 1 ? "#9ca3af" : "#374151"} />
              </TouchableOpacity>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.paginaBotao, pagina === n && styles.paginaBotaoAtivo]}
                  onPress={() => setPagina(n)}
                >
                  <Text style={[styles.paginaTexto, pagina === n && styles.paginaTextoAtivo]}>{n}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.paginaBotao, pagina === totalPaginas && styles.paginaBotaoDisabled]}
                onPress={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
              >
                <Ionicons name="chevron-forward" size={20} color={pagina === totalPaginas ? "#9ca3af" : "#374151"} />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <Modal visible={modalTipo} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalTipo(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitulo}>Tipo Movimentação</Text>
            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnAdd]} onPress={() => { setModalTipo(false); setModalAdicionar(true); }}>
              <Ionicons name="arrow-up" size={28} color="#fff" />
              <Text style={styles.modalBtnTexto}>Adicionar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnRemover]} onPress={() => { setModalTipo(false); setModalRetirar(true); }}>
              <Ionicons name="arrow-down" size={28} color="#fff" />
              <Text style={styles.modalBtnTexto}>Retirar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalTipo(false)}>
              <Text style={styles.modalBtnCancelTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ModalAdicionar visible={modalAdicionar} onFechar={() => setModalAdicionar(false)} onSalvo={carregar} />
      <ModalRetirar visible={modalRetirar} onFechar={() => setModalRetirar(false)} onSalvo={carregar} />
    </View>
  );
}

function ModalAdicionar({ visible, onFechar, onSalvo }) {
  const [armazens, setArmazens] = useState([]);
  const [graos, setGraos] = useState([]);
  const [talhoes, setTalhoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [armazenId, setArmazenId] = useState("");
  const [graoId, setGraoId] = useState("");
  const [placa, setPlaca] = useState("");
  const [pesoBruto, setPesoBruto] = useState("");
  const [tara, setTara] = useState("");
  const [umidade, setUmidade] = useState("");
  const [desconto, setDesconto] = useState("");
  const [talhaoId, setTalhaoId] = useState("");

  useEffect(() => {
    if (!visible) return;
    setErro("");
    Promise.all([
      api.get("/armazens", { params: { limit: 999 } }),
      api.get("/graos"),
    ])
      .then(([rArm, rGraos]) => {
        setArmazens(Array.isArray(rArm.data) ? rArm.data : []);
        const g = rGraos.data;
        setGraos(Array.isArray(g) ? g : Array.isArray(g?.data) ? g.data : []);
      })
      .catch(() => {
        setArmazens([]);
        setGraos([]);
      });
  }, [visible]);

  const handleSelecionarArmazen = (id) => {
    setArmazenId(id);
    const arm = armazens.find((a) => String(a.id) === id);
    if (arm?.grao_id) setGraoId(String(arm.grao_id));
    else setGraoId("");
  };

  const armazenSel = armazens.find((a) => String(a.id) === armazenId);
  const graoTravado = !!(armazenSel?.grao_id);

  const handleSalvar = async () => {
    const aId = armazenId ? Number(armazenId) : 0;
    const gId = graoId ? Number(graoId) : 0;
    if (!aId || !gId) {
      setErro("Selecione armazém e grão.");
      return;
    }
    if (!pesoBruto && pesoBruto !== "0") {
      setErro("Informe o peso bruto.");
      return;
    }
    if (!tara && tara !== "0") {
      setErro("Informe a tara.");
      return;
    }
    setErro("");
    setLoading(true);
    try {
      await api.post("/adicoes", {
        armazen_id: aId,
        grao_id: gId,
        placa: placa.trim() || null,
        peso_bruto: Number(pesoBruto) || 0,
        tara: Number(tara) || 0,
        umidade: umidade ? Number(umidade) : null,
        desconto: desconto ? Number(desconto) : null,
        talhao_id: talhaoId ? Number(talhaoId) : null,
      });
      onFechar();
      onSalvo();
    } catch (err) {
      const msg = err.response?.data?.detail ?? "Erro ao salvar.";
      setErro(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Adicionar Estoque</Text>
              <TouchableOpacity onPress={onFechar}><Ionicons name="close" size={24} color="#6b7280" /></TouchableOpacity>
            </View>
            {erro ? <View style={styles.erroBox}><Text style={styles.erroTexto}>{erro}</Text></View> : null}
            <Text style={styles.inputLabel}>Armazém</Text>
            <View style={styles.graosWrap}>
              {armazens.map((a) => (
                <TouchableOpacity key={a.id} style={[styles.chip, armazenId === String(a.id) && styles.chipSel]} onPress={() => handleSelecionarArmazen(String(a.id))}>
                  <Text style={[styles.chipTexto, armazenId === String(a.id) && styles.chipTextoSel]}>{a.nome}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputLabel}>Grão</Text>
            {graoTravado ? (
              <View style={styles.graosWrap}>
                <View style={[styles.chip, styles.chipSel]}>
                  <Text style={[styles.chipTexto, styles.chipTextoSel]}>{graos.find((g) => String(g.id) === graoId)?.nome || "Grão"}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.graosWrap}>
                {graos.map((g) => (
                  <TouchableOpacity key={g.id} style={[styles.chip, graoId === String(g.id) && styles.chipSel]} onPress={() => setGraoId(String(g.id))}>
                    <Text style={[styles.chipTexto, graoId === String(g.id) && styles.chipTextoSel]}>{g.nome}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Text style={styles.inputLabel}>Peso Bruto (Kg)</Text>
            <TextInput style={styles.input} value={pesoBruto} onChangeText={setPesoBruto} placeholder="Ex: 10000" placeholderTextColor="#9ca3af" keyboardType="number-pad" />
            <Text style={styles.inputLabel}>Tara (Kg)</Text>
            <TextInput style={styles.input} value={tara} onChangeText={setTara} placeholder="Ex: 0" placeholderTextColor="#9ca3af" keyboardType="number-pad" />
            <Text style={styles.inputLabel}>Placa (apenas letras e números)</Text>
            <TextInput style={styles.input} value={placa} onChangeText={(v) => setPlaca(onlyAlphanumeric(v))} placeholder="ABC1D23" placeholderTextColor="#9ca3af" autoCapitalize="characters" />
            <Text style={styles.inputLabel}>Umidade</Text>
            <TextInput style={styles.input} value={umidade} onChangeText={setUmidade} placeholder="Ex: 12" placeholderTextColor="#9ca3af" keyboardType="decimal-pad" />
            <Text style={styles.inputLabel}>Desconto (%)</Text>
            <TextInput style={styles.input} value={desconto} onChangeText={setDesconto} placeholder="Ex: 2" placeholderTextColor="#9ca3af" keyboardType="decimal-pad" />
            <Text style={styles.inputLabel}>Talhão (opcional)</Text>
            <TextInput style={styles.input} value={talhaoId} onChangeText={setTalhaoId} placeholder="Opcional" placeholderTextColor="#9ca3af" keyboardType="number-pad" />
            <TouchableOpacity style={[styles.botaoSalvar, loading && styles.botaoDisabled]} onPress={handleSalvar} disabled={loading}>
              <Text style={styles.botaoSalvarTexto}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function ModalRetirar({ visible, onFechar, onSalvo }) {
  const [armazens, setArmazens] = useState([]);
  const [graos, setGraos] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [armazenId, setArmazenId] = useState("");
  const [contratoId, setContratoId] = useState("");
  const [pesoBruto, setPesoBruto] = useState("");
  const [tara, setTara] = useState("");
  const [placa, setPlaca] = useState("");

  useEffect(() => {
    if (!visible) return;
    setErro("");
    Promise.all([
      api.get("/armazens", { params: { limit: 999 } }),
      api.get("/graos"),
      api.get("/contratos", { params: { limit: 999 } }),
    ])
      .then(([rArm, rGraos, rCont]) => {
        const arm = Array.isArray(rArm.data) ? rArm.data : [];
        setArmazens(arm.filter((a) => a.grao_id != null));
        const g = rGraos.data;
        setGraos(Array.isArray(g) ? g : Array.isArray(g?.data) ? g.data : []);
        setContratos(Array.isArray(rCont.data) ? rCont.data : []);
      })
      .catch(() => {
        setArmazens([]);
        setGraos([]);
        setContratos([]);
      });
  }, [visible]);

  const armazenSel = armazens.find((a) => a.id === Number(armazenId));
  const graoIdDerived = armazenSel?.grao_id ?? 0;
  const graoNome = graos.find((g) => g.id === graoIdDerived)?.nome || "";

  const handleSalvar = async () => {
    const aId = armazenId ? Number(armazenId) : 0;
    const bruto = Number(pesoBruto) || 0;
    const t = Number(tara) || 0;
    if (!aId) {
      setErro("Selecione o armazém.");
      return;
    }
    if (!graoIdDerived) {
      setErro("Este armazém ainda não tem grão. Faça uma entrada primeiro.");
      return;
    }
    if (bruto <= 0 || bruto - t <= 0) {
      setErro("Peso bruto e líquido devem ser positivos.");
      return;
    }
    setErro("");
    setLoading(true);
    try {
      await api.post("/retiradas", {
        armazen_id: aId,
        grao_id: graoIdDerived,
        contrato_id: contratoId ? Number(contratoId) : null,
        peso_bruto: bruto,
        tara: t,
        placa: placa.trim() || null,
      });
      onFechar();
      onSalvo();
    } catch (err) {
      const msg = err.response?.data?.detail ?? "Erro ao salvar.";
      setErro(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Remover Estoque</Text>
              <TouchableOpacity onPress={onFechar}><Ionicons name="close" size={24} color="#6b7280" /></TouchableOpacity>
            </View>
            {erro ? <View style={styles.erroBox}><Text style={styles.erroTexto}>{erro}</Text></View> : null}
            <Text style={styles.inputLabel}>Armazém</Text>
            <View style={styles.graosWrap}>
              {armazens.map((a) => (
                <TouchableOpacity key={a.id} style={[styles.chip, armazenId === String(a.id) && styles.chipSel]} onPress={() => setArmazenId(String(a.id))}>
                  <Text style={[styles.chipTexto, armazenId === String(a.id) && styles.chipTextoSel]}>{a.nome}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputLabel}>Grão</Text>
            <View style={[styles.input, { justifyContent: "center", backgroundColor: "#f3f4f6" }]}>
              <Text style={{ fontSize: 15, color: graoNome ? "#1f2937" : "#9ca3af" }}>{graoNome || "Selecione o armazém"}</Text>
            </View>
            <Text style={styles.inputLabel}>Contrato (opcional)</Text>
            <View style={styles.graosWrap}>
              <TouchableOpacity style={[styles.chip, !contratoId && styles.chipSel]} onPress={() => setContratoId("")}>
                <Text style={[styles.chipTexto, !contratoId && styles.chipTextoSel]}>Nenhum</Text>
              </TouchableOpacity>
              {contratos.map((c) => (
                <TouchableOpacity key={c.id} style={[styles.chip, contratoId === String(c.id) && styles.chipSel]} onPress={() => setContratoId(String(c.id))}>
                  <Text style={[styles.chipTexto, contratoId === String(c.id) && styles.chipTextoSel]}>Contrato {c.id}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputLabel}>Peso bruto (Kg)</Text>
            <TextInput style={styles.input} value={pesoBruto} onChangeText={setPesoBruto} placeholder="0" placeholderTextColor="#9ca3af" keyboardType="number-pad" />
            <Text style={styles.inputLabel}>Tara (Kg)</Text>
            <TextInput style={styles.input} value={tara} onChangeText={setTara} placeholder="0" placeholderTextColor="#9ca3af" keyboardType="number-pad" />
            <Text style={styles.inputLabel}>Placa (apenas letras e números)</Text>
            <TextInput style={styles.input} value={placa} onChangeText={(v) => setPlaca(onlyAlphanumeric(v))} placeholder="ABC1D23" placeholderTextColor="#9ca3af" autoCapitalize="characters" />
            <TouchableOpacity style={[styles.botaoSalvar, loading && styles.botaoDisabled]} onPress={handleSalvar} disabled={loading}>
              <Text style={styles.botaoSalvarTexto}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centralizar: { flex: 1, justifyContent: "center", alignItems: "center" },
  vazio: { fontSize: 15, color: "#6b7280" },
  botaoFiltrar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    margin: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#44AA00",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  botaoFiltrarTexto: { fontSize: 15, fontWeight: "500", color: "#1f2937" },
  badge: { backgroundColor: "#44AA00", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeTexto: { fontSize: 11, color: "#fff", fontWeight: "600" },
  limparFiltros: { fontSize: 14, color: "#44AA00", marginBottom: 8 },
  filtrosBox: { paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "#f9fafb", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: "#d1d5db", backgroundColor: "#fff" },
  chipSel: { borderColor: "#44AA00", backgroundColor: "#E4FFCC" },
  chipTexto: { fontSize: 14, color: "#374151" },
  chipTextoSel: { fontWeight: "600", color: "#166534" },
  inputLabel: { fontSize: 12, fontWeight: "500", color: "#6b7280", marginBottom: 6 },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#1f2937",
    marginBottom: 12,
  },
  botaoAdd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-end",
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#A6DE47",
    borderRadius: 12,
  },
  botaoAddTexto: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  lista: { padding: 16, paddingBottom: 100 },
  rowCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, marginBottom: 10, padding: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  cardMain: { flex: 1 },
  cardData: { fontSize: 14, fontWeight: "600", color: "#1f2937" },
  cardTipo: { fontSize: 13, color: "#44AA00", marginTop: 2 },
  cardInfo: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  botaoExcluirRow: { padding: 10 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20 },
  modalScroll: { flexGrow: 1, justifyContent: "center", paddingVertical: 24 },
  modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitulo: { fontSize: 18, fontWeight: "700", color: "#1f2937", marginBottom: 16 },
  modalBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16, marginBottom: 12 },
  modalBtnAdd: { backgroundColor: "#A6DE47" },
  modalBtnRemover: { backgroundColor: "#DC2626" },
  modalBtnTexto: { fontSize: 16, fontWeight: "600", color: "#fff" },
  modalBtnCancel: { paddingVertical: 12, alignItems: "center" },
  modalBtnCancelTexto: { fontSize: 15, color: "#6b7280" },
  erroBox: { backgroundColor: "#fef2f2", padding: 12, borderRadius: 12, marginBottom: 12 },
  erroTexto: { fontSize: 14, color: "#b91c1c" },
  graosWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
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
