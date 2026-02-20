"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  Funnel,
  Plus,
  Trash,
  X,
} from "@phosphor-icons/react"
import api from "@/lib/api"
import Input from "@/components/ui/Input"
import { Skeleton } from "@/components/ui"

const COLUNAS = ["Data", "Tipo", "Grão", "Quantidade", "Placa", "Status", "Ações"]
const POR_PAGINA = 10

function formatarData(iso) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatarNumero(n) {
  if (n == null || n === "") return "—"
  const num = Number(n)
  if (Number.isNaN(num)) return "—"
  return num.toLocaleString("pt-BR")
}

function ModalTipoMovimentacao({ aberto, onFechar, onAdicionar, onRetirar }) {
  if (!aberto) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onFechar}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
          Tipo Movimentação
        </h2>
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => {
              onFechar()
              onAdicionar()
            }}
            className="flex-1 flex flex-col items-center justify-center gap-2 py-6 rounded-2xl text-white font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#A6DE47" }}
          >
            <ArrowUp size={32} weight="bold" />
            Adicionar
          </button>
          <button
            type="button"
            onClick={() => {
              onFechar()
              onRetirar()
            }}
            className="flex-1 flex flex-col items-center justify-center gap-2 py-6 rounded-2xl text-white font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#DC2626" }}
          >
            <ArrowDown size={32} weight="bold" />
            Retirar
          </button>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2.5 rounded-xl font-medium border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalAdicionarEstoque({ aberto, onFechar, onSalvo }) {
  const [armazens, setArmazens] = useState([])
  const [graos, setGraos] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingDados, setLoadingDados] = useState(false)
  const [erro, setErro] = useState("")
  const [form, setForm] = useState({
    armazen_id: "",
    grao_id: "",
    peso_bruto: "",
    tara: "",
    placa: "",
    umidade: "",
    desconto: "",
    talhao_id: "",
  })

  useEffect(() => {
    if (!aberto) return
    setErro("")
    setForm({
      armazen_id: "",
      grao_id: "",
      peso_bruto: "",
      tara: "",
      placa: "",
      umidade: "",
      desconto: "",
      talhao_id: "",
    })
    setLoadingDados(true)
    Promise.all([api.get("/armazens", { params: { limit: 999 } }), api.get("/graos")])
      .then(([rArm, rGraos]) => {
        setArmazens(Array.isArray(rArm.data) ? rArm.data : [])
        const g = rGraos.data
        setGraos(Array.isArray(g) ? g : Array.isArray(g?.data) ? g.data : [])
      })
      .catch(() => {
        setArmazens([])
        setGraos([])
      })
      .finally(() => setLoadingDados(false))
  }, [aberto])

  const handleChange = (campo, valor) => {
    setForm((f) => {
      const next = { ...f, [campo]: valor }
      if (campo === "armazen_id" && valor) {
        const arm = armazens.find((a) => String(a.id) === String(valor))
        if (arm?.grao_id) next.grao_id = String(arm.grao_id)
        else next.grao_id = ""
      }
      return next
    })
  }

  const armazenSelecionado = armazens.find((a) => String(a.id) === String(form.armazen_id))
  const graoTravado = !!(armazenSelecionado?.grao_id)

  const handleSubmit = (e) => {
    e.preventDefault()
    setErro("")
    const armazenId = form.armazen_id ? Number(form.armazen_id) : 0
    const graoId = form.grao_id ? Number(form.grao_id) : 0
    if (!armazenId || !graoId) {
      setErro("Selecione o armazém e o grão.")
      return
    }
    const pesoBruto = form.peso_bruto ? Number(form.peso_bruto) : 0
    const taraVal = form.tara ? Number(form.tara) : 0
    if (!form.peso_bruto && form.peso_bruto !== 0) {
      setErro("Informe o peso bruto.")
      return
    }
    if (!form.tara && form.tara !== 0) {
      setErro("Informe a tara.")
      return
    }
    setLoading(true)
    const payload = {
      armazen_id: armazenId,
      grao_id: graoId,
      placa: form.placa || null,
      umidade: form.umidade ? Number(form.umidade) : null,
      tara: taraVal,
      peso_bruto: pesoBruto,
      desconto: form.desconto ? Number(form.desconto) : null,
      talhao_id: form.talhao_id ? Number(form.talhao_id) : null,
    }
    api
      .post("/adicoes", payload)
      .then(() => {
        onSalvo()
        onFechar()
      })
      .catch((err) => {
        const msg = err.response?.data?.detail
        setErro(
          typeof msg === "string"
            ? msg
            : Array.isArray(msg)
              ? msg.map((m) => m?.msg ?? m).join(" ")
              : "Erro ao salvar."
        )
      })
      .finally(() => setLoading(false))
  }

  if (!aberto) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onFechar}
    >
      <div
        className="rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: "#f0f9e8" }}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Adicionar Estoque</h2>
          <button type="button" onClick={onFechar} className="p-2 rounded-lg hover:bg-gray-200 text-gray-600">
            <X size={24} weight="regular" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {erro && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {erro}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Armazém</label>
              {loadingDados ? (
                <Skeleton className="w-full h-12 rounded-xl" />
              ) : (
                <select
                  value={form.armazen_id}
                  onChange={(e) => handleChange("armazen_id", e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-gray-400 disabled:opacity-70"
                >
                  <option value="">Selecione o armazém</option>
                  {armazens.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grão</label>
              {loadingDados ? (
                <Skeleton className="w-full h-12 rounded-xl" />
              ) : (
                <select
                  value={form.grao_id}
                  onChange={(e) => handleChange("grao_id", e.target.value)}
                  disabled={loading || graoTravado}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-gray-400 disabled:opacity-70"
                >
                  <option value="" disabled>Selecione o grão</option>
                  {graos.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso Bruto (Kg)</label>
              <Input
                type="number"
                min={0}
                placeholder="Ex: 10000"
                value={form.peso_bruto}
                onChange={(e) => handleChange("peso_bruto", e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tara (Kg)</label>
              <Input
                type="number"
                min={0}
                placeholder="Ex: 0"
                value={form.tara}
                onChange={(e) => handleChange("tara", e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
              <Input
                type="text"
                placeholder="Ex: ABC1D23"
                value={form.placa}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^A-Za-z0-9]/g, "")
                  handleChange("placa", v)
                }}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Umidade</label>
              <Input
                type="number"
                min={0}
                placeholder="Ex: 12"
                value={form.umidade}
                onChange={(e) => handleChange("umidade", e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desconto (%)</label>
              <Input
                type="number"
                min={0}
                placeholder="Ex: 2"
                value={form.desconto}
                onChange={(e) => handleChange("desconto", e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Talhão</label>
              <Input
                type="number"
                min={0}
                placeholder="Opcional"
                value={form.talhao_id}
                onChange={(e) => handleChange("talhao_id", e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onFechar}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl font-medium border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-medium text-gray-900 hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#A6DE47" }}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalRemoverEstoque({ aberto, onFechar, onSalvo }) {
  const [armazens, setArmazens] = useState([])
  const [graos, setGraos] = useState([])
  const [contratos, setContratos] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingDados, setLoadingDados] = useState(false)
  const [erro, setErro] = useState("")
  const [form, setForm] = useState({
    armazen_id: "",
    grao_id: "",
    contrato_id: "",
    peso_bruto: "",
    tara: "",
    placa: "",
  })

  useEffect(() => {
    if (!aberto) return
    setErro("")
    setForm({
      armazen_id: "",
      grao_id: "",
      contrato_id: "",
      peso_bruto: "",
      tara: "",
      placa: "",
    })
    setLoadingDados(true)
    Promise.all([
      api.get("/armazens", { params: { limit: 999 } }),
      api.get("/graos"),
      api.get("/contratos", { params: { limit: 999 } }),
    ])
      .then(([rArm, rGraos, rCont]) => {
        const lista = Array.isArray(rArm.data) ? rArm.data : []
        setArmazens(lista.filter((a) => a.grao_id != null))
        const g = rGraos.data
        setGraos(Array.isArray(g) ? g : Array.isArray(g?.data) ? g.data : [])
        setContratos(Array.isArray(rCont.data) ? rCont.data : [])
      })
      .catch(() => {
        setArmazens([])
        setGraos([])
        setContratos([])
      })
      .finally(() => setLoadingDados(false))
  }, [aberto])

  const handleChange = (campo, valor) => {
    setForm((f) => {
      const next = { ...f, [campo]: valor }
      if (campo === "armazen_id" && valor) {
        const arm = armazens.find((a) => String(a.id) === String(valor))
        if (arm?.grao_id) next.grao_id = String(arm.grao_id)
        else next.grao_id = ""
      }
      return next
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setErro("")
    const armazenId = form.armazen_id ? Number(form.armazen_id) : 0
    const graoId = form.grao_id ? Number(form.grao_id) : 0
    if (!armazenId || !graoId) {
      setErro("Selecione o armazém.")
      return
    }
    setLoading(true)
    const payload = {
      armazen_id: armazenId,
      grao_id: graoId,
      contrato_id: form.contrato_id ? Number(form.contrato_id) : null,
      placa: form.placa || null,
      tara: form.tara ? Number(form.tara) : null,
      peso_bruto: form.peso_bruto ? Number(form.peso_bruto) : null,
    }
    api
      .post("/retiradas", payload)
      .then(() => {
        onSalvo()
        onFechar()
      })
      .catch((err) => {
        const msg = err.response?.data?.detail
        setErro(
          typeof msg === "string"
            ? msg
            : Array.isArray(msg)
              ? msg.map((m) => m?.msg ?? m).join(" ")
              : "Erro ao salvar."
        )
      })
      .finally(() => setLoading(false))
  }

  if (!aberto) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onFechar}
    >
      <div
        className="rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: "#f0f9e8" }}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Remover Estoque</h2>
          <button type="button" onClick={onFechar} className="p-2 rounded-lg hover:bg-gray-200 text-gray-600">
            <X size={24} weight="regular" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {erro && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {erro}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Armazém</label>
              {loadingDados ? (
                <Skeleton className="w-full h-12 rounded-xl" />
              ) : (
                <>
                  <select
                    value={form.armazen_id}
                    onChange={(e) => handleChange("armazen_id", e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-gray-400 disabled:opacity-70"
                  >
                    <option value="">
                      {armazens.length === 0
                        ? "Nenhum armazém com estoque"
                        : "Selecione o armazém"}
                    </option>
                    {armazens.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nome}
                      </option>
                    ))}
                  </select>
                  {!loadingDados && armazens.length === 0 && (
                    <p className="mt-1.5 text-sm text-amber-700">
                      Nenhum armazém com movimentação. Faça uma adição antes de retirar.
                    </p>
                  )}
                </>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grão</label>
              {loadingDados ? (
                <Skeleton className="w-full h-12 rounded-xl" />
              ) : (
                <select
                  value={form.grao_id}
                  onChange={(e) => handleChange("grao_id", e.target.value)}
                  disabled={loading || (form.armazen_id && armazens.find((a) => String(a.id) === String(form.armazen_id))?.grao_id)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-gray-400 disabled:opacity-70"
                  title={form.armazen_id && armazens.find((a) => String(a.id) === String(form.armazen_id))?.grao_id ? "Preenchido automaticamente pelo armazém selecionado" : undefined}
                >
                  <option value="" disabled>Selecione o armazém primeiro</option>
                  {graos.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contrato</label>
              {loadingDados ? (
                <Skeleton className="w-full h-12 rounded-xl" />
              ) : (
                <select
                  value={form.contrato_id}
                  onChange={(e) => handleChange("contrato_id", e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-gray-400 disabled:opacity-70"
                >
                  <option value="">Opcional</option>
                  {contratos.map((c) => (
                    <option key={c.id} value={c.id}>
                      Contrato {c.id} – {c.empresa}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso Bruto (Kg)</label>
              <Input
                type="number"
                min={0}
                placeholder="Ex: 10000"
                value={form.peso_bruto}
                onChange={(e) => handleChange("peso_bruto", e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tara (Kg)</label>
              <Input
                type="number"
                min={0}
                placeholder="Ex: 0"
                value={form.tara}
                onChange={(e) => handleChange("tara", e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
              <Input
                type="text"
                placeholder="Ex: ABC1D23"
                value={form.placa}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^A-Za-z0-9]/g, "")
                  handleChange("placa", v)
                }}
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onFechar}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl font-medium border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-medium text-gray-900 hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#A6DE47" }}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function parseDataISO(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

function aplicarFiltros(lista, filtros) {
  if (!lista.length) return lista
  const {
    dataInicio: fdInicio,
    dataFim: fdFim,
    tipo: ft,
    grao: fg,
    quantidade: fq,
    placa: fp,
    status: fs,
  } = filtros
  const hasAny = [fdInicio, fdFim, ft, fg, fq, fp, fs].some((v) => v != null && String(v).trim() !== "")
  if (!hasAny) return lista
  const dataInicioStr = (fdInicio && String(fdInicio).trim()) || ""
  const dataFimStr = (fdFim && String(fdFim).trim()) || ""
  const tipoStr = (ft && String(ft).trim().toLowerCase()) || ""
  const graoStr = (fg && String(fg).trim().toLowerCase()) || ""
  const qtdStr = (fq != null && String(fq).trim()) !== "" ? String(fq).trim() : ""
  const placaStr = (fp && String(fp).trim().toLowerCase()) || ""
  const statusStr = (fs && String(fs).trim().toLowerCase()) || ""
  const inicioDate = dataInicioStr ? new Date(dataInicioStr + "T00:00:00") : null
  const fimDate = dataFimStr ? new Date(dataFimStr + "T23:59:59.999") : null
  return lista.filter((row) => {
    if (dataInicioStr || dataFimStr) {
      const rowDate = parseDataISO(row.data)
      if (!rowDate) return false
      if (inicioDate && rowDate < inicioDate) return false
      if (fimDate && rowDate > fimDate) return false
    }
    if (tipoStr && !String(row.tipo || "").toLowerCase().includes(tipoStr)) return false
    if (graoStr && !String(row.grao || "").toLowerCase().includes(graoStr)) return false
    if (qtdStr !== "" && !String(row.quantidade ?? "").includes(qtdStr)) return false
    if (placaStr && !String(row.placa || "").toLowerCase().includes(placaStr)) return false
    if (statusStr && !String(row.status || "").toLowerCase().includes(statusStr)) return false
    return true
  })
}

export default function MovimentacoesPage() {
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [modalTipoAberto, setModalTipoAberto] = useState(false)
  const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false)
  const [modalRemoverAberto, setModalRemoverAberto] = useState(false)
  const [filtrosAberto, setFiltrosAberto] = useState(false)
  const [rowMenuAberto, setRowMenuAberto] = useState(null)
  const [rowParaExcluir, setRowParaExcluir] = useState(null)
  const [excluindo, setExcluindo] = useState(false)
  const menuRef = useRef(null)
  const [filtros, setFiltros] = useState({
    dataInicio: "",
    dataFim: "",
    tipo: "",
    grao: "",
    quantidade: "",
    placa: "",
    status: "",
  })

  const carregar = async () => {
    setLoading(true)
    try {
      const [resAdicoes, resRetiradas] = await Promise.all([
        api.get("/adicoes", { params: { limit: 999 } }),
        api.get("/retiradas", { params: { limit: 999 } }),
      ])
      const adicoes = Array.isArray(resAdicoes.data) ? resAdicoes.data : []
      const retiradas = Array.isArray(resRetiradas.data) ? resRetiradas.data : []
      const entradas = adicoes.map((a) => ({
        id: `e-${a.id}`,
        data: a.created_at,
        tipo: "Entrada",
        grao: a.grao_nome || "—",
        quantidade: a.quantidade,
        placa: a.placa || "—",
        status: "Concluído",
      }))
      const saidas = retiradas.map((r) => {
        const bruto = r.peso_bruto ?? 0
        const tara = r.tara ?? 0
        const qtd = Math.max(0, bruto - tara)
        return {
          id: `s-${r.id}`,
          data: r.created_at,
          tipo: "Saída",
          grao: r.grao_nome || "—",
          quantidade: qtd,
          placa: r.placa || "—",
          status: "Concluído",
        }
      })
      const merged = [...entradas, ...saidas].sort((a, b) => {
        const ta = a.data ? new Date(a.data).getTime() : 0
        const tb = b.data ? new Date(b.data).getTime() : 0
        return tb - ta
      })
      setLista(merged)
    } catch {
      setLista([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  useEffect(() => {
    if (!rowMenuAberto) return
    function handleClickFora(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setRowMenuAberto(null)
      }
    }
    document.addEventListener("click", handleClickFora)
    return () => document.removeEventListener("click", handleClickFora)
  }, [rowMenuAberto])

  const executarExclusao = async () => {
    if (!rowParaExcluir) return
    const row = rowParaExcluir
    const isEntrada = String(row.id).startsWith("e-")
    const id = String(row.id).slice(2)
    const endpoint = isEntrada ? "/adicoes" : "/retiradas"
    setExcluindo(true)
    try {
      await api.delete(`${endpoint}/${id}`)
      setRowParaExcluir(null)
      setRowMenuAberto(null)
      carregar()
    } catch (err) {
      const msg = err.response?.data?.detail ?? "Erro ao excluir. Tente novamente."
      window.alert(typeof msg === "string" ? msg : JSON.stringify(msg))
    } finally {
      setExcluindo(false)
    }
  }

  const listaFiltrada = aplicarFiltros(lista, filtros)
  const totalPaginas = Math.ceil(listaFiltrada.length / POR_PAGINA) || 1
  const inicio = (pagina - 1) * POR_PAGINA
  const linhas = listaFiltrada.slice(inicio, inicio + POR_PAGINA)

  const setFiltro = (campo, valor) => {
    setFiltros((f) => ({ ...f, [campo]: valor }))
    setPagina(1)
  }
  const limparFiltros = () => {
    setFiltros({
      dataInicio: "",
      dataFim: "",
      tipo: "",
      grao: "",
      quantidade: "",
      placa: "",
      status: "",
    })
    setPagina(1)
  }
  const temFiltroAtivo = Object.values(filtros).some((v) => String(v).trim() !== "")

  const opcoesGraos = useMemo(() => {
    const set = new Set()
    lista.forEach((row) => {
      if (row.grao && String(row.grao).trim() && row.grao !== "—") set.add(row.grao)
    })
    return Array.from(set).sort()
  }, [lista])

  const opcoesStatus = useMemo(() => {
    const set = new Set()
    lista.forEach((row) => {
      if (row.status && String(row.status).trim()) set.add(row.status)
    })
    return Array.from(set).sort()
  }, [lista])

  return (
    <div className="flex-1 flex flex-col min-h-0 p-6">
      <div className="flex justify-end gap-2 mb-4">
        <button
          type="button"
          onClick={() => setModalTipoAberto(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#A6DE47", color: "#1a1a1a" }}
        >
          <Plus size={20} weight="bold" />
          Adicionar Movimentação
        </button>
      </div>

      <div className="mb-4">
        <button
          type="button"
          onClick={() => setFiltrosAberto((a) => !a)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium shadow-sm border border-[#44AA00] bg-white text-gray-800 hover:bg-[#E4FFCC] transition-colors"
        >
          <Funnel size={20} weight="regular" />
          {filtrosAberto ? "Ocultar filtros" : "Filtrar"}
          {temFiltroAtivo && !filtrosAberto && (
            <span className="text-xs bg-[#44AA00] text-white px-2 py-0.5 rounded-full">
              ativo
            </span>
          )}
          {filtrosAberto ? (
            <CaretUp size={18} weight="bold" className="text-gray-500" />
          ) : (
            <CaretDown size={18} weight="bold" className="text-gray-500" />
          )}
        </button>
        {filtrosAberto && (
          <div className="mt-3 p-4 rounded-xl border border-gray-200 bg-gray-50/80">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-gray-700">Campos de filtro</span>
              {temFiltroAtivo && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="text-sm text-[#44AA00] hover:underline ml-2"
                >
                  Limpar filtros
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Data inicial</label>
                <Input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltro("dataInicio", e.target.value)}
                  className="bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Data final</label>
                <Input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltro("dataFim", e.target.value)}
                  className="bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                <select
                  value={filtros.tipo}
                  onChange={(e) => setFiltro("tipo", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-gray-400 text-gray-800"
                >
                  <option value="">Todos</option>
                  <option value="Entrada">Entrada</option>
                  <option value="Saída">Saída</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Grão</label>
                <select
                  value={filtros.grao}
                  onChange={(e) => setFiltro("grao", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-gray-400 text-gray-800"
                >
                  <option value="">Todos</option>
                  {opcoesGraos.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Quantidade</label>
                <Input
                  type="text"
                  placeholder="Número"
                  value={filtros.quantidade}
                  onChange={(e) => setFiltro("quantidade", e.target.value)}
                  className="bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Placa</label>
                <Input
                  type="text"
                  placeholder="Letras e números"
                  value={filtros.placa}
                  onChange={(e) => setFiltro("placa", e.target.value.replace(/[^A-Za-z0-9]/g, ""))}
                  className="bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  value={filtros.status}
                  onChange={(e) => setFiltro("status", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-gray-400 text-gray-800"
                >
                  <option value="">Todos</option>
                  {opcoesStatus.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <ModalTipoMovimentacao
        aberto={modalTipoAberto}
        onFechar={() => setModalTipoAberto(false)}
        onAdicionar={() => setModalAdicionarAberto(true)}
        onRetirar={() => setModalRemoverAberto(true)}
      />
      <ModalAdicionarEstoque
        aberto={modalAdicionarAberto}
        onFechar={() => setModalAdicionarAberto(false)}
        onSalvo={carregar}
      />
      <ModalRemoverEstoque
        aberto={modalRemoverAberto}
        onFechar={() => setModalRemoverAberto(false)}
        onSalvo={carregar}
      />

      {rowParaExcluir && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={() => !excluindo && setRowParaExcluir(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Excluir movimentação
            </h2>
            <p className="text-gray-600 mb-6">
              Deseja realmente excluir esta movimentação (
              {rowParaExcluir.tipo} - {formatarData(rowParaExcluir.data)})?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRowParaExcluir(null)}
                disabled={excluindo}
                className="px-4 py-2.5 rounded-xl font-medium border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executarExclusao}
                disabled={excluindo}
                className="px-4 py-2.5 rounded-xl font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {excluindo ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200/80 overflow-hidden bg-white shadow-sm flex-1 flex flex-col min-h-0">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: "#E4FFCC" }}>
              {COLUNAS.map((col) => (
                <th
                  key={col}
                  className="py-3 px-4 text-center text-sm font-semibold text-gray-800"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    {COLUNAS.map((_, j) => (
                      <td key={j} className="py-3 px-4">
                        <Skeleton className="h-4 w-full max-w-[80px] mx-auto" />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ) : linhas.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUNAS.length}
                  className="py-8 text-center text-gray-500"
                >
                  Nenhuma movimentação registrada.
                </td>
              </tr>
            ) : (
              linhas.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-gray-100 hover:bg-gray-50/80 transition-colors"
                >
                  <td className="py-3 px-4 text-center text-sm text-gray-700">
                    {formatarData(row.data)}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-700">
                    {row.tipo}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-700">
                    {row.grao}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-700">
                    {formatarNumero(row.quantidade)}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-700">
                    {row.placa}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-700">
                    {row.status}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="relative inline-block" ref={rowMenuAberto === row.id ? menuRef : null}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setRowMenuAberto((id) => (id === row.id ? null : row.id))
                        }}
                        className="w-9 h-9 rounded-lg flex items-center justify-center border border-gray-300 bg-white hover:bg-gray-100 text-gray-600 transition-colors"
                        aria-label="Abrir menu"
                        aria-expanded={rowMenuAberto === row.id}
                      >
                        <Trash size={18} weight="regular" />
                      </button>
                      {rowMenuAberto === row.id && (
                        <div className="absolute right-0 top-full mt-1 py-1 min-w-[180px] rounded-xl border border-gray-200 bg-white shadow-lg z-50">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setRowParaExcluir(row)
                              setRowMenuAberto(null)
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash size={18} weight="regular" />
                            Excluir movimentação
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {lista.length > 0 && !loading && (
          <div className="flex justify-end items-center gap-2 py-3 px-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              aria-label="Página anterior"
            >
              <CaretLeft size={18} weight="bold" className="text-gray-600" />
            </button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPagina(n)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                  pagina === n ? "text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
                style={
                  pagina === n ? { backgroundColor: "#44AA00" } : undefined
                }
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() =>
                setPagina((p) => Math.min(totalPaginas, p + 1))
              }
              disabled={pagina === totalPaginas}
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              aria-label="Próxima página"
            >
              <CaretRight size={18} weight="bold" className="text-gray-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
