"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Envelope, Lock } from "@phosphor-icons/react"
import { Input, PasswordInput } from "@/components/ui"
import { login } from "@/lib/auth"

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro("")
    setLoading(true)
    try {
      await login(email, senha)
      router.push("/")
      router.refresh()
    } catch (err) {
      const msg =
        err.response?.data?.detail || "Erro ao fazer login. Tente novamente."
      setErro(typeof msg === "string" ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <Image
        src="/fundo.jpeg"
        alt="Fundo - silos"
        fill
        className="object-cover object-center z-0"
        priority
      />
      <div
        className="absolute inset-0 z-[1] bg-black/20"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/80 p-8">
        <div className="flex items-center gap-3 mb-2">
          <Image
            src="/logo.svg"
            alt="SiloSys"
            width={48}
            height={64}
            className="object-contain flex-shrink-0"
          />
          <span className="text-2xl font-bold text-gray-800">SiloSys</span>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Faça seu login para acessar o sistema
        </p>

        {erro && (
          <div
            className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
            role="alert"
          >
            {erro}
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="relative">
            <Envelope
              size={22}
              weight="regular"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10"
            />
            <Input
              type="email"
              name="email"
              placeholder="Digite e-mail ou usuário"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="pl-12"
            />
          </div>

          <div className="relative">
            <Lock
              size={22}
              weight="regular"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10"
            />
            <PasswordInput
              name="senha"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              disabled={loading}
              className="pl-12"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl bg-[#BCEB3C] hover:bg-[#a8d334] disabled:opacity-70 disabled:cursor-not-allowed text-gray-800 font-semibold transition-all shadow-md"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  )
}
