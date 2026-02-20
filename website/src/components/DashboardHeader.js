"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import {
  ArrowsLeftRight,
  FileText,
  SignOut,
  User,
  Warehouse,
} from "@phosphor-icons/react"
import api from "@/lib/api"
import { logout } from "@/lib/auth"

const TAB_CONFIG = [
  { path: "/armazem", title: "Armazém", icon: Warehouse },
  { path: "/movimentacoes", title: "Movimentações", icon: ArrowsLeftRight },
  { path: "/contratos", title: "Contratos", icon: FileText },
]

function getTabForPath(pathname) {
  const tab = TAB_CONFIG.find(
    (t) => pathname === t.path || pathname.startsWith(t.path + "/")
  )
  return tab ?? TAB_CONFIG[0]
}

function srcFotoPerfil(fotoPerfil) {
  if (!fotoPerfil || typeof fotoPerfil !== "string") return null
  const s = fotoPerfil.trim()
  if (!s) return null
  if (s.startsWith("data:")) return s
  return `data:image/jpeg;base64,${s}`
}

export default function DashboardHeader() {
  const pathname = usePathname()
  const { title, icon: Icon } = getTabForPath(pathname)
  const [menuAberto, setMenuAberto] = useState(false)
  const [fotoPerfil, setFotoPerfil] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    api.get("/auth/me").then((res) => {
      const foto = res.data?.foto_perfil
      if (foto) setFotoPerfil(foto)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!menuAberto) return
    function handleClickFora(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAberto(false)
      }
    }
    document.addEventListener("click", handleClickFora)
    return () => document.removeEventListener("click", handleClickFora)
  }, [menuAberto])

  const fotoSrc = srcFotoPerfil(fotoPerfil)

  return (
    <header
      className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b border-gray-200/80"
      style={{ backgroundColor: "#F7F9F3" }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ backgroundColor: "#E4FFCC" }}
        >
          <Icon size={24} weight="regular" style={{ color: "#44AA00" }} />
        </div>
        <h1 className="text-xl font-bold text-gray-800">{title}</h1>
      </div>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuAberto((a) => !a)}
          className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-300 cursor-pointer bg-white hover:bg-gray-50 transition-colors overflow-hidden shrink-0"
          aria-label="Perfil"
          aria-expanded={menuAberto}
          aria-haspopup="true"
        >
          {fotoSrc ? (
            <img
              src={fotoSrc}
              alt="Foto de perfil"
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={22} weight="regular" className="text-gray-600" />
          )}
        </button>
        {menuAberto && (
          <div
            className="absolute right-0 top-full mt-2 py-1 min-w-[160px] rounded-xl border border-gray-200 bg-white shadow-lg z-50"
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuAberto(false)
                logout()
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg mx-1 transition-colors"
            >
              <SignOut size={20} weight="regular" className="text-gray-500 flex-shrink-0" />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
