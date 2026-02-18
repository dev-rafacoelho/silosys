"use client"

import { useEffect, useState } from "react"
import {
  Building,
  Calendar,
  CaretLeft,
  CaretRight,
  CurrencyCircleDollar,
  Grains,
  Plus,
  Trash,
  X,
} from "@phosphor-icons/react"
import api from "@/lib/api"
import Input from "@/components/ui/Input"
import { Skeleton } from "@/components/ui"

const CARDS_PER_PAGE = 9

function SkeletonCardContrato() {
  return (
    <div className="rounded-2xl p-5 shadow-sm bg-[#F5F5F4] min-h-[200px] flex flex-col">
      <div className="flex justify-end mb-4">
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="space-y-3 mb-5 flex-1">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
          <Skeleton className="h-4 flex-1 max-w-[120px]" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
          <Skeleton className="h-4 flex-1 max-w-[140px]" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
          <Skeleton className="h-4 flex-1 max-w-[100px]" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="flex-1 h-2.5 rounded-full" />
        <Skeleton className="h-4 w-10" />
      </div>
    </div>
  )
}

function formatarValorBR(valor) {
  if (valor === "" || valor == null) return ""
  const onlyDigits = String(valor).replace(/\D/g, "")
  if (onlyDigits === "") return ""
  const centavos = parseInt(onlyDigits, 10)
  const reais = Math.floor(centavos / 100)
  const cents = centavos % 100
  const reaisStr = reais.toLocaleString("pt-BR")
  return cents > 0 ? `R$ ${reaisStr},${String(cents).padStart(2, "0")}` : `R$ ${reaisStr}`
}

function parseValorBR(str) {
  if (!str || typeof str !== "string") return 0
  const cleaned = str.replace(/\D/g, "")
  if (cleaned === "") return 0
  return Math.floor(parseInt(cleaned, 10) / 100)
}

function aplicarMascaraValor(e) {
  const v = e.target.value
  const onlyDigits = v.replace(/\D/g, "")
  if (onlyDigits === "") return ""
  const limited = onlyDigits.slice(0, 14)
  const centavos = parseInt(limited, 10) || 0
  const reais = Math.floor(centavos / 100)
  const cents = centavos % 100
  const reaisStr = reais.toLocaleString("pt-BR")
  return cents > 0 ? `R$ ${reaisStr},${String(cents).padStart(2, "0")}` : `R$ ${reaisStr}`
}

function formatarData(dateStr) {
  if (!dateStr) return "-"
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

function formatarDataCompleta(dateStr) {
  if (!dateStr) return "-"
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function CardContrato({ contrato, onClick }) {
  const total = contrato.quantidade ?? 0
  const retirado = contrato.quantidade_retirada ?? 0
  const progress = total > 0 ? Math.min(100, Math.round((retirado / total) * 100)) : 0

  return (
    <button
      type="button"
      onClick={() => onClick?.(contrato)}
      className="rounded-2xl p-5 shadow-sm transition-shadow bg-[#F5F5F4] hover:shadow-md min-h-[200px] flex flex-col text-left w-full cursor-pointer"
    >
      <div className="flex justify-end mb-4">
        <span className="text-base font-bold text-[#22C55E]">
          Contrato {contrato.id}
        </span>
      </div>
      <div className="space-y-3 mb-5 flex-1">
        <div className="flex items-center gap-3 text-sm text-gray-800">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#DCFCE7]">
            <Grains size={20} weight="regular" className="text-[#16A34A]" />
          </div>
          <span>Grao: {contrato.grao_nome || "-"}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-800">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#DCFCE7]">
            <Building size={20} weight="regular" className="text-[#16A34A]" />
          </div>
          <span>Empresa: {contrato.empresa}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-800">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#DCFCE7]">
            <Calendar size={20} weight="regular" className="text-[#16A34A]" />
          </div>
          <span>Vencimento: {formatarData(contrato.vencimento)}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all bg-[#22C55E]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-gray-700 min-w-[2.5rem]">{progress}%</span>
      </div>
    </button>
  )
}

function ModalAdicionarContrato({ aberto, onFechar, onSalvo }) {
  const [graos, setGraos] = useState([])
  const [loadingGraos, setLoadingGraos] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [form, setForm] = useState({
    empresa: "",
    grao_id: "",
    vencimento: "",
    valor: "",
    data_pagamento: "",
    quantidade: "",
  })

  useEffect(() => {
    if (aberto) {
      setErro("")
      setForm({
        empresa: "",
        grao_id: "",
        vencimento: "",
        valor: "",
        data_pagamento: "",
        quantidade: "",
      })
      setLoadingGraos(true)
      api
        .get("/graos")
        .then((res) => {
          const data = res.data
          const lista = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
              ? data.data
              : []
          setGraos(
            lista.map((g) => ({
              id: Number(g.id) || 0,
              nome: typeof g.nome === "string" ? g.nome : String(g.id ?? ""),
            })),
          )
        })
        .catch(() => setGraos([]))
        .finally(() => setLoadingGraos(false))
    }
  }, [aberto])

  const handleChange = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setErro("")
    const graoId = form.grao_id ? Number(form.grao_id) : null
    if (!form.empresa.trim()) {
      setErro("Informe a empresa.")
      return
    }
    if (!graoId || graoId < 1) {
      setErro("Selecione o grão.")
      return
    }
    if (!form.vencimento) {
      setErro("Informe o vencimento.")
      return
    }
    const valor = parseValorBR(form.valor)
    if (valor < 0) {
      setErro("Valor deve ser maior ou igual a zero.")
      return
    }
    const quantidade = form.quantidade ? Number(form.quantidade) : 0
    if (quantidade < 0) {
      setErro("Quantidade deve ser maior ou igual a zero.")
      return
    }
    setLoading(true)
    const payload = {
      empresa: form.empresa.trim(),
      grao_id: graoId,
      vencimento: form.vencimento,
      valor,
      quantidade,
      data_pagamento: form.data_pagamento || null,
    }
    api
      .post("/contratos", payload)
      .then(() => {
        onSalvo()
        onFechar()
      })
      .catch((err) => {
        const msg =
          err.response?.data?.detail || "Erro ao salvar contrato. Tente novamente."
        setErro(typeof msg === "string" ? msg : JSON.stringify(msg))
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
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Adicionar Contrato</h2>
          <button
            type="button"
            onClick={onFechar}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Fechar"
          >
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empresa
              </label>
              <Input
                type="text"
                placeholder=""
                value={form.empresa}
                onChange={(e) => handleChange("empresa", e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grão
              </label>
              {loadingGraos ? (
                <Skeleton className="w-full h-12 rounded-xl" />
              ) : (
                <select
                  value={form.grao_id}
                  onChange={(e) => handleChange("grao_id", e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-gray-400 disabled:opacity-70"
                >
                  <option value="" disabled>
                    {graos.length === 0
                      ? "Nenhum grão disponível"
                      : "Selecione o grão"}
                  </option>
                  {graos.map((g) => (
                    <option key={g.id} value={String(g.id)}>
                      {g.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vencimento
              </label>
              <Input
                type="date"
                value={form.vencimento}
                onChange={(e) => handleChange("vencimento", e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor (R$)
              </label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={form.valor}
                onChange={(e) => {
                  const formatted = aplicarMascaraValor(e)
                  handleChange("valor", formatted)
                }}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Pagamento
              </label>
              <Input
                type="date"
                value={form.data_pagamento}
                onChange={(e) =>
                  handleChange("data_pagamento", e.target.value)
                }
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade(Kg)
              </label>
              <Input
                type="number"
                min={0}
                placeholder="Ex: 10000"
                value={form.quantidade}
                onChange={(e) => handleChange("quantidade", e.target.value)}
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
              className="px-4 py-2.5 rounded-xl font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#A6DE47", color: "#1a1a1a" }}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalVisualizarContrato({ contrato, onFechar, onExcluido }) {
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState("")

  if (!contrato) return null

  const total = contrato.quantidade ?? 0
  const retirado = contrato.quantidade_retirada ?? 0
  const progress = total > 0 ? Math.min(100, Math.round((retirado / total) * 100)) : 0
  const valorExibicao = formatarValorBR(String(Number(contrato.valor ?? 0) * 100))

  const handleExcluir = () => {
    if (!window.confirm("Deseja realmente excluir este contrato?")) return
    setErro("")
    setExcluindo(true)
    api
      .delete(`/contratos/${contrato.id}`)
      .then(() => {
        onExcluido()
        onFechar()
      })
      .catch((err) => {
        const msg =
          err.response?.data?.detail || "Erro ao excluir contrato. Tente novamente."
        setErro(typeof msg === "string" ? msg : JSON.stringify(msg))
      })
      .finally(() => setExcluindo(false))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onFechar}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            Contrato {contrato.id}
          </h2>
          <button
            type="button"
            onClick={onFechar}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Fechar"
          >
            <X size={24} weight="regular" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {erro && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {erro}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-3 text-gray-800">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#DCFCE7]">
                <Building size={22} weight="regular" className="text-[#16A34A]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Empresa</p>
                <p className="font-medium">{contrato.empresa || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-800">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#DCFCE7]">
                <Grains size={22} weight="regular" className="text-[#16A34A]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Grão</p>
                <p className="font-medium">{contrato.grao_nome || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-800">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#DCFCE7]">
                <Calendar size={22} weight="regular" className="text-[#16A34A]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Vencimento</p>
                <p className="font-medium">{formatarDataCompleta(contrato.vencimento)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-800">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#DCFCE7]">
                <CurrencyCircleDollar size={22} weight="regular" className="text-[#16A34A]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Valor</p>
                <p className="font-medium">{valorExibicao || "-"}</p>
              </div>
            </div>
            {contrato.data_pagamento && (
              <div className="flex items-center gap-3 text-gray-800">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#DCFCE7]">
                  <Calendar size={22} weight="regular" className="text-[#16A34A]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Data de pagamento</p>
                  <p className="font-medium">{formatarDataCompleta(contrato.data_pagamento)}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-gray-800">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#DCFCE7]">
                <Grains size={22} weight="regular" className="text-[#16A34A]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Quantidade (Kg)</p>
                <p className="font-medium">{contrato.quantidade?.toLocaleString("pt-BR") ?? "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-800">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#DCFCE7]">
                <Grains size={22} weight="regular" className="text-[#16A34A]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Quantidade retirada (Kg)</p>
                <p className="font-medium">{(contrato.quantidade_retirada ?? 0).toLocaleString("pt-BR")}</p>
              </div>
            </div>
          </div>
          <div className="pt-2">
            <p className="text-sm text-gray-600 mb-2">Andamento</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#22C55E] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-700 min-w-[2.5rem]">{progress}%</span>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleExcluir}
              disabled={excluindo}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <Trash size={20} weight="regular" />
              Excluir contrato
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Contratos() {
  const [contratos, setContratos] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [modalAberto, setModalAberto] = useState(false)
  const [contratoSelecionado, setContratoSelecionado] = useState(null)

  const carregarContratos = () => {
    setLoading(true)
    api
      .get("/contratos", { params: { limit: 999 } })
      .then((res) => setContratos(res.data || []))
      .catch(() => setContratos([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    carregarContratos()
  }, [])

  const totalPaginas = Math.ceil(contratos.length / CARDS_PER_PAGE) || 1
  const inicio = (pagina - 1) * CARDS_PER_PAGE
  const contratosPagina = contratos.slice(inicio, inicio + CARDS_PER_PAGE)

  return (
    <div className="flex-1 flex flex-col min-h-0 p-6">
      <div className="flex justify-end mb-6">
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#A6DE47", color: "#1a1a1a" }}
        >
          <Plus size={20} weight="bold" />
          Adicionar Contrato
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 content-start">
          {Array.from({ length: CARDS_PER_PAGE }).map((_, i) => (
            <SkeletonCardContrato key={i} />
          ))}
        </div>
      ) : contratosPagina.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">
            Nenhum contrato cadastrado. Adicione seu primeiro contrato.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 content-start">
            {contratosPagina.map((c) => (
              <CardContrato
                key={c.id}
                contrato={c}
                onClick={(contrato) => setContratoSelecionado(contrato)}
              />
            ))}
          </div>

          {totalPaginas > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8 pt-6">
              <button
                type="button"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <CaretLeft size={20} weight="bold" className="text-gray-600" />
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                (n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPagina(n)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                      pagina === n
                        ? "text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    style={
                      pagina === n ? { backgroundColor: "#44AA00" } : undefined
                    }
                  >
                    {n}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() =>
                  setPagina((p) => Math.min(totalPaginas, p + 1))
                }
                disabled={pagina === totalPaginas}
                className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <CaretRight size={20} weight="bold" className="text-gray-600" />
              </button>
            </div>
          )}
        </>
      )}

      <ModalAdicionarContrato
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSalvo={carregarContratos}
      />
      <ModalVisualizarContrato
        contrato={contratoSelecionado}
        onFechar={() => setContratoSelecionado(null)}
        onExcluido={carregarContratos}
      />
    </div>
  )
}
