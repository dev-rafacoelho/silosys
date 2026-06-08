"use client"

import { useState, useEffect, useCallback } from "react"
import { ChartBar, DownloadSimple, FunnelSimple, X } from "@phosphor-icons/react"
import { Input, Skeleton } from "@/components/ui"
import {
  produtividadeTalhao,
  producaoGrao,
  estoqueArmazem,
  movimentacoes,
  exportarCSV,
} from "@/lib/relatorio"

const ABAS = [
  { key: "produtividade", label: "Produtividade por talhão" },
  { key: "producao", label: "Produção por grão" },
  { key: "estoque", label: "Estoque por armazém" },
  { key: "movimentacoes", label: "Movimentações" },
]

const nf = (v, casas = 2) =>
  v == null
    ? "—"
    : Number(v).toLocaleString("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: casas,
      })

function Barra({ valor, max }) {
  const pct = max > 0 ? Math.min(100, (valor / max) * 100) : 0
  return (
    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
      <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${pct}%` }} />
    </div>
  )
}

function Tabela({ colunas, children }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-100">
            {colunas.map((c) => (
              <th key={c} className="px-4 py-3 font-medium whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Vazio({ texto }) {
  return (
    <div className="py-12 text-center text-gray-500 text-sm bg-white rounded-2xl border border-gray-100">
      {texto}
    </div>
  )
}

export default function RelatoriosPage() {
  const [aba, setAba] = useState("produtividade")
  const [inicioInput, setInicioInput] = useState("")
  const [fimInput, setFimInput] = useState("")
  const [periodo, setPeriodo] = useState({ inicio: "", fim: "" })
  const [dados, setDados] = useState({})
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState("")

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro("")
    try {
      let resultado
      if (aba === "produtividade") resultado = await produtividadeTalhao(periodo)
      else if (aba === "producao") resultado = await producaoGrao(periodo)
      else if (aba === "estoque") resultado = await estoqueArmazem()
      else resultado = await movimentacoes(periodo)
      setDados((d) => ({ ...d, [aba]: resultado }))
    } catch (err) {
      const msg = err.response?.data?.detail ?? err.message ?? "Erro ao carregar relatório."
      setErro(typeof msg === "string" ? msg : JSON.stringify(msg))
    } finally {
      setCarregando(false)
    }
  }, [aba, periodo])

  useEffect(() => {
    carregar()
  }, [carregar])

  const aplicar = () => setPeriodo({ inicio: inicioInput, fim: fimInput })
  const limpar = () => {
    setInicioInput("")
    setFimInput("")
    setPeriodo({ inicio: "", fim: "" })
  }

  const sufixoArquivo = periodo.inicio || periodo.fim ? `_${periodo.inicio || "inicio"}_${periodo.fim || "fim"}` : ""

  const dadosAtuais = dados[aba]

  const exportar = () => {
    if (aba === "produtividade") {
      exportarCSV(
        `produtividade_talhao${sufixoArquivo}`,
        [
          { key: "nome", label: "Talhão" },
          { key: "tamanho_hectares", label: "Tamanho (ha)" },
          { key: "kg", label: "Produção (kg)" },
          { key: "sacas", label: "Sacas" },
          { key: "media_sc_ha", label: "Média (sc/ha)" },
        ],
        dadosAtuais ?? [],
      )
    } else if (aba === "producao") {
      exportarCSV(
        `producao_grao${sufixoArquivo}`,
        [
          { key: "nome", label: "Grão" },
          { key: "kg", label: "Produção (kg)" },
          { key: "sacas", label: "Sacas" },
        ],
        dadosAtuais ?? [],
      )
    } else if (aba === "estoque") {
      exportarCSV(
        `estoque_armazem`,
        [
          { key: "nome", label: "Armazém" },
          { key: "grao_nome", label: "Grão" },
          { key: "estoque", label: "Estoque (kg)" },
          { key: "capacidade", label: "Capacidade (kg)" },
          { key: "ocupacao_pct", label: "Ocupação (%)" },
        ],
        dadosAtuais ?? [],
      )
    } else {
      const mv = dadosAtuais ?? { entradas: [], saidas: [] }
      const linhas = [
        ...mv.entradas.map((e) => ({ tipo: "Entrada", ...e })),
        ...mv.saidas.map((s) => ({ tipo: "Saída", ...s })),
      ]
      exportarCSV(
        `movimentacoes${sufixoArquivo}`,
        [
          { key: "tipo", label: "Tipo" },
          { key: "data", label: "Data" },
          { key: "grao", label: "Grão" },
          { key: "armazen", label: "Armazém" },
          { key: "talhao", label: "Talhão" },
          { key: "quantidade", label: "Quantidade (kg)" },
        ],
        linhas,
      )
    }
  }

  const temDados =
    aba === "movimentacoes"
      ? dadosAtuais && (dadosAtuais.entradas.length || dadosAtuais.saidas.length)
      : dadosAtuais && dadosAtuais.length > 0

  return (
    <div className="flex-1 flex flex-col min-h-0 p-6 md:p-8 gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#E4FFCC]">
            <ChartBar size={26} weight="regular" style={{ color: "#44AA00" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
            <p className="text-sm text-gray-500">Produtividade, produção, estoque e movimentações</p>
          </div>
        </div>
        <button
          type="button"
          onClick={exportar}
          disabled={!temDados}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium border-0 cursor-pointer shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: "#A6DE47", color: "#1a1a1a" }}
        >
          <DownloadSimple size={20} weight="bold" />
          Exportar CSV
        </button>
      </div>

      {/* Filtro de período */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 text-gray-500 mr-1">
          <FunnelSimple size={18} weight="regular" />
          <span className="text-sm font-medium">Período</span>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Início</span>
          <Input type="date" value={inicioInput} onChange={(e) => setInicioInput(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Fim</span>
          <Input type="date" value={fimInput} onChange={(e) => setFimInput(e.target.value)} />
        </label>
        <button
          type="button"
          onClick={aplicar}
          className="px-4 py-2.5 rounded-xl font-medium border-0 cursor-pointer text-gray-900 hover:opacity-90"
          style={{ backgroundColor: "#A6DE47" }}
        >
          Aplicar
        </button>
        {(periodo.inicio || periodo.fim) && (
          <button
            type="button"
            onClick={limpar}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            <X size={16} weight="bold" /> Limpar
          </button>
        )}
        {aba === "estoque" && (
          <span className="text-xs text-gray-400 ml-auto">
            Estoque é sempre o atual (não usa período)
          </span>
        )}
      </div>

      {/* Abas */}
      <div className="flex flex-wrap gap-2">
        {ABAS.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => setAba(a.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              aba === a.key
                ? "bg-[#44AA00] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-h-0">
        {erro && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : aba === "produtividade" ? (
          temDados ? (
            <Tabela colunas={["Talhão", "Tamanho (ha)", "Produção", "Sacas", "Média (sc/ha)", ""]}>
              {(() => {
                const max = Math.max(...dadosAtuais.map((t) => t.media_sc_ha || 0), 1)
                return dadosAtuais.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-800">{t.nome}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {t.tamanho_hectares != null ? `${nf(t.tamanho_hectares)} ha` : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{nf(t.kg, 0)} kg</td>
                    <td className="px-4 py-3 text-gray-600">{nf(t.sacas)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {t.media_sc_ha != null ? `${nf(t.media_sc_ha)} sc/ha` : "—"}
                    </td>
                    <td className="px-4 py-3 w-40">
                      <Barra valor={t.media_sc_ha || 0} max={max} />
                    </td>
                  </tr>
                ))
              })()}
            </Tabela>
          ) : (
            <Vazio texto="Nenhuma produção registrada no período." />
          )
        ) : aba === "producao" ? (
          temDados ? (
            <Tabela colunas={["Grão", "Produção", "Sacas", ""]}>
              {(() => {
                const max = Math.max(...dadosAtuais.map((g) => g.kg || 0), 1)
                return dadosAtuais.map((g) => (
                  <tr key={g.grao_id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-800 capitalize">{g.nome}</td>
                    <td className="px-4 py-3 text-gray-600">{nf(g.kg, 0)} kg</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{nf(g.sacas)} sc</td>
                    <td className="px-4 py-3 w-40">
                      <Barra valor={g.kg || 0} max={max} />
                    </td>
                  </tr>
                ))
              })()}
            </Tabela>
          ) : (
            <Vazio texto="Nenhuma produção registrada no período." />
          )
        ) : aba === "estoque" ? (
          temDados ? (
            <Tabela colunas={["Armazém", "Grão", "Estoque", "Capacidade", "Ocupação", ""]}>
              {dadosAtuais.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-800">{a.nome}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{a.grao_nome ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{nf(a.estoque, 0)} kg</td>
                  <td className="px-4 py-3 text-gray-600">{nf(a.capacidade, 0)} kg</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{nf(a.ocupacao_pct, 1)}%</td>
                  <td className="px-4 py-3 w-40">
                    <Barra valor={a.ocupacao_pct} max={100} />
                  </td>
                </tr>
              ))}
            </Tabela>
          ) : (
            <Vazio texto="Nenhum armazém cadastrado." />
          )
        ) : temDados ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total de entradas</p>
                <p className="text-xl font-bold text-[#16A34A]">
                  {nf(dadosAtuais.total_entradas, 0)} kg
                </p>
              </div>
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total de saídas</p>
                <p className="text-xl font-bold text-red-500">
                  {nf(dadosAtuais.total_saidas, 0)} kg
                </p>
              </div>
            </div>
            <Tabela colunas={["Tipo", "Data", "Grão", "Armazém", "Talhão", "Quantidade"]}>
              {[
                ...dadosAtuais.entradas.map((e) => ({ ...e, tipo: "Entrada" })),
                ...dadosAtuais.saidas.map((s) => ({ ...s, tipo: "Saída" })),
              ].map((m) => (
                <tr key={`${m.tipo}-${m.id}`} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.tipo === "Entrada"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {m.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.data}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{m.grao}</td>
                  <td className="px-4 py-3 text-gray-600">{m.armazen}</td>
                  <td className="px-4 py-3 text-gray-600">{m.talhao ?? "—"}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{nf(m.quantidade, 0)} kg</td>
                </tr>
              ))}
            </Tabela>
          </div>
        ) : (
          <Vazio texto="Nenhuma movimentação no período." />
        )}
      </div>
    </div>
  )
}
