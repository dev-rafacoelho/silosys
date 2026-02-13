"use client"

import { useState } from "react"
import Image from "next/image"
import { CaretLeft, CaretRight, Plus } from "@phosphor-icons/react"
import { Input, Modal } from "@/components/ui"
import { criarArmazem } from "@/lib/armazem"

export default function ArmazemPage() {
  const [modalAberto, setModalAberto] = useState(false)
  const [nome, setNome] = useState("")
  const [capacidade, setCapacidade] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  const abrirModal = () => {
    setNome("")
    setCapacidade("")
    setErro(null)
    setModalAberto(true)
  }

  const fecharModal = () => setModalAberto(false)

  const handleSalvar = async () => {
    const cap = Number(String(capacidade).replace(/\D/g, "")) || 0
    if (!nome.trim()) {
      setErro("Informe o nome.")
      return
    }
    if (cap <= 0) {
      setErro("Informe a capacidade em kg (número maior que zero).")
      return
    }
    setErro(null)
    setSalvando(true)
    try {
      await criarArmazem({ nome: nome.trim(), capacidade: cap })
      fecharModal()
      // TODO: atualizar lista se tiver listagem na tela
    } catch (err) {
      const msg = err.response?.data?.detail ?? err.message ?? "Erro ao salvar."
      setErro(Array.isArray(msg) ? msg.map((m) => m.msg ?? m).join(" ") : msg)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 flex items-center justify-center relative px-4 py-8">
        <button
          type="button"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center border-0 cursor-pointer shadow-sm"
          style={{ backgroundColor: "#E4FFCC" }}
          aria-label="Anterior"
        >
          <CaretLeft size={24} weight="bold" className="text-gray-700" />
        </button>

        <button
          type="button"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center border-0 cursor-pointer shadow-sm"
          style={{ backgroundColor: "#E4FFCC" }}
          aria-label="Próximo"
        >
          <CaretRight size={24} weight="bold" className="text-gray-700" />
        </button>

        <button
          type="button"
          onClick={abrirModal}
          className="absolute top-6 right-6 z-10 flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium border-0 cursor-pointer shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#A6DE47", color: "#1a1a1a" }}
        >
          <Plus size={20} weight="bold" />
          Adicionar Armazém
        </button>

        <div
          className="relative flex items-center justify-center w-full max-w-full flex-1 min-h-0"
          style={{
            maxWidth: "min(70vmin, 550px)",
            aspectRatio: "625/685",
          }}
        >
          <Image
            src="/silo0.svg"
            alt="Armazém"
            fill
            className="object-contain select-none"
            priority
            sizes="(max-width: 768px) 70vw, 420px"
          />
        </div>
      </div>

      <Modal
        open={modalAberto}
        onClose={fecharModal}
        title="Adicionar Armazém"
        onCancel={fecharModal}
        onSave={handleSalvar}
        saveLabel={salvando ? "Salvando…" : "Salvar"}
      >
        {erro && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {erro}
          </p>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-900">Nome</span>
          <Input
            type="text"
            placeholder="Silo 1"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            disabled={salvando}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-900">Capacidade (Kg)</span>
          <Input
            type="number"
            min={1}
            step={1}
            placeholder="10000"
            value={capacidade}
            onChange={(e) => setCapacidade(e.target.value)}
            disabled={salvando}
          />
        </label>
      </Modal>
    </div>
  )
}
