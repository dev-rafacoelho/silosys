"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
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
    <div className="relative min-h-screen flex items-center justify-end pr-8 md:pr-16 lg:pr-24">
      <Image
        src="/fundo-login.jpg"
        alt="Fundo"
        fill
        className="object-cover object-center z-0"
        priority
      />
      <div
        className="absolute inset-0 z-[1] bg-gradient-to-l from-emerald-500/30 via-transparent to-transparent"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-emerald-200/60 p-8">
        <h1 className="text-2xl font-bold text-gray-800">Login</h1>
        <p className="text-gray-500 text-sm mt-1 mb-6">Faça seu login</p>
        {erro && (
          <div
            className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
            role="alert"
          >
            {erro}
          </div>
        )}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            type="email"
            name="email"
            placeholder="Digite e-mail ou usuário"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <PasswordInput
            name="senha"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-2xl bg-[#A6DE47] hover:bg-[#95c93d] disabled:opacity-70 disabled:cursor-not-allowed text-gray-800 font-semibold transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  )
}
