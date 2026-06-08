"use client"

import { useState, useEffect } from "react"
import { Plant, Plus, PencilSimple, Trash, Ruler, ChartLineUp } from "@phosphor-icons/react"
import { Input, Modal, Skeleton } from "@/components/ui"
import {
  listarTalhoes,
  criarTalhao,
  atualizarTalhao,
  excluirTalhao,
} from "@/lib/talhao"

function formatarNumero(valor, casas = 2) {
  if (valor == null) return "—"
  return Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: casas,
  })
}

export default function TalhoesPage() {
  const [talhoes, setTalhoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [nome, setNome] = useState("")
  const [tamanho, setTamanho] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  const [excluindoId, setExcluindoId] = useState(null)
  const [erroLista, setErroLista] = useState("")

  const carregar = async () => {
    setCarregando(true)
    try {
      const lista = await listarTalhoes({ limit: 999 })
      setTalhoes(lista)
    } catch {
      setTalhoes([])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const abrirCriar = () => {
    setEditando(null)
    setNome("")
    setTamanho("")
    setErro("")
    setModalAberto(true)
  }

  const abrirEditar = (talhao) => {
    setEditando(talhao)
    setNome(talhao.nome ?? "")
    setTamanho(
      talhao.tamanho_hectares != null ? String(talhao.tamanho_hectares) : ""
    )
    setErro("")
    setModalAberto(true)
  }

  const fecharModal = () => setModalAberto(false)

  const handleSalvar = async () => {
    if (!nome.trim()) {
      setErro("Informe o nome do talhão.")
      return
    }
    const tamanhoNum = tamanho === "" ? null : Number(String(tamanho).replace(",", "."))
    if (tamanhoNum != null && (!Number.isFinite(tamanhoNum) || tamanhoNum <= 0)) {
      setErro("O tamanho em hectares deve ser um número maior que zero.")
      return
    }
    setErro("")
    setSalvando(true)
    try {
      if (editando) {
        await atualizarTalhao(editando.id, {
          nome: nome.trim(),
          tamanho_hectares: tamanhoNum,
        })
      } else {
        await criarTalhao({ nome: nome.trim(), tamanho_hectares: tamanhoNum })
      }
      fecharModal()
      carregar()
    } catch (err) {
      const msg = err.response?.data?.detail ?? err.message ?? "Erro ao salvar."
      setErro(Array.isArray(msg) ? msg.map((m) => m.msg ?? m).join(" ") : msg)
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluir = async (talhao) => {
    if (!window.confirm(`Deseja realmente excluir o talhão "${talhao.nome}"?`)) return
    setErroLista("")
    setExcluindoId(talhao.id)
    try {
      await excluirTalhao(talhao.id)
      carregar()
    } catch (err) {
      const msg = err.response?.data?.detail ?? "Erro ao excluir talhão."
      setErroLista(typeof msg === "string" ? msg : JSON.stringify(msg))
    } finally {
      setExcluindoId(null)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#E4FFCC]">
            <Plant size={26} weight="regular" style={{ color: "#44AA00" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Talhões</h1>
            <p className="text-sm text-gray-500">
              Gerencie os talhões e a produtividade média (sc/ha)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={abrirCriar}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium border-0 cursor-pointer shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#A6DE47", color: "#1a1a1a" }}
        >
          <Plus size={20} weight="bold" />
          Adicionar Talhão
        </button>
      </div>

      {erroLista && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {erroLista}
        </div>
      )}

      {carregando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : talhoes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 gap-3 py-16">
          <Plant size={48} weight="thin" className="text-gray-300" />
          <p>Nenhum talhão cadastrado. Clique em Adicionar Talhão para criar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {talhoes.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 flex flex-col gap-4"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            >
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-bold text-gray-900">{t.nome}</h2>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => abrirEditar(t)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                    aria-label={`Editar ${t.nome}`}
                    title="Editar"
                  >
                    <PencilSimple size={18} weight="regular" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExcluir(t)}
                    disabled={excluindoId === t.id}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50"
                    aria-label={`Excluir ${t.nome}`}
                    title="Excluir"
                  >
                    <Trash size={18} weight="regular" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#DCFCE7] flex-shrink-0">
                    <Ruler size={18} weight="regular" className="text-[#16A34A]" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide">Tamanho</p>
                    <p className="font-semibold text-gray-800">
                      {t.tamanho_hectares != null
                        ? `${formatarNumero(t.tamanho_hectares)} ha`
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#DCFCE7] flex-shrink-0">
                    <ChartLineUp size={18} weight="regular" className="text-[#16A34A]" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide">Média</p>
                    <p className="font-semibold text-gray-800">
                      {t.media_sc_ha != null
                        ? `${formatarNumero(t.media_sc_ha)} sc/ha`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalAberto}
        onClose={fecharModal}
        title={editando ? "Editar Talhão" : "Adicionar Talhão"}
        onCancel={fecharModal}
        onSave={handleSalvar}
        saveLabel={salvando ? "Salvando..." : "Salvar"}
      >
        {erro && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-900">Nome</span>
          <Input
            type="text"
            placeholder="Talhão 1"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            disabled={salvando}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-900">Tamanho (hectares)</span>
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="Opcional. Ex: 12.5"
            value={tamanho}
            onChange={(e) => setTamanho(e.target.value)}
            disabled={salvando}
          />
          <span className="text-xs text-gray-500">
            Usado para calcular a média de sacas por hectare (60 kg/saca).
          </span>
        </label>
      </Modal>
    </div>
  )
}
