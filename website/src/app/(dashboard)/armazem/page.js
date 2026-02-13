"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { CaretLeft, CaretRight, Plus } from "@phosphor-icons/react"
import { Input, Modal } from "@/components/ui"
import { criarArmazem, listarArmazens } from "@/lib/armazem"

export default function ArmazemPage() {
  const [armazens, setArmazens] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direcao, setDirecao] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [nome, setNome] = useState("")
  const [capacidade, setCapacidade] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  const carregarArmazens = async () => {
    setCarregando(true)
    try {
      const lista = await listarArmazens()
      setArmazens(lista)
      setCurrentIndex((i) => (lista.length ? Math.min(i, lista.length - 1) : 0))
    } catch {
      setArmazens([])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarArmazens()
  }, [])

  const armazemAtual = armazens.length ? armazens[currentIndex] : null
  const temLista = armazens.length > 0

  const anterior = () => {
    if (!temLista) return
    setDirecao("prev")
    setCurrentIndex((i) => (i - 1 + armazens.length) % armazens.length)
  }

  const proximo = () => {
    if (!temLista) return
    setDirecao("next")
    setCurrentIndex((i) => (i + 1) % armazens.length)
  }

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
      carregarArmazens()
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
        {armazens.length > 1 && (
          <>
            <button
              type="button"
              onClick={anterior}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center border-0 cursor-pointer shadow-sm hover:opacity-90"
              style={{ backgroundColor: "#E4FFCC" }}
              aria-label="Armazém anterior"
            >
              <CaretLeft size={24} weight="bold" className="text-gray-700" />
            </button>
            <button
              type="button"
              onClick={proximo}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center border-0 cursor-pointer shadow-sm hover:opacity-90"
              style={{ backgroundColor: "#E4FFCC" }}
              aria-label="Próximo armazém"
            >
              <CaretRight size={24} weight="bold" className="text-gray-700" />
            </button>
          </>
        )}

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
          className="relative flex items-center justify-center w-full max-w-full flex-1 min-h-0 overflow-hidden"
          style={{
            maxWidth: "min(70vmin, 550px)",
            aspectRatio: "625/685",
          }}
        >
          {carregando ? (
            <div className="text-gray-500 text-sm">Carregando…</div>
          ) : temLista ? (
            <div
              key={currentIndex}
              className="absolute inset-0 flex items-center justify-center group"
              style={
                direcao === "next"
                  ? { animation: "slide-in-from-right 0.4s ease-out forwards" }
                  : direcao === "prev"
                    ? { animation: "slide-in-from-left 0.4s ease-out forwards" }
                    : undefined
              }
            >
              <Image
                src="/silo0.svg"
                alt={armazemAtual?.nome ?? "Armazém"}
                fill
                className="object-contain select-none"
                priority
                sizes="(max-width: 768px) 70vw, 420px"
              />
              <div
                className="absolute inset-0 flex items-end justify-center pb-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                aria-hidden
              >
                <div
                  className="rounded-xl shadow-lg border border-gray-200 bg-white/95 backdrop-blur px-4 py-3 text-left min-w-45"
                  style={{ backgroundColor: "rgba(255,255,255,0.97)" }}
                >
                  <p className="font-semibold text-gray-900">{armazemAtual?.nome}</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Capacidade: {armazemAtual?.capacidade?.toLocaleString("pt-BR")} kg
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {currentIndex + 1} de {armazens.length}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <Image
                src="/silo0.svg"
                alt="Nenhum armazém"
                fill
                className="object-contain select-none opacity-60"
                sizes="(max-width: 768px) 70vw, 420px"
              />
              <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-500 text-sm text-center px-4">
                Nenhum armazém. Clique em Adicionar Armazém para criar.
              </p>
            </>
          )}
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
