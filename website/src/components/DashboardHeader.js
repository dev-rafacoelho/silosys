"use client"

import { usePathname } from "next/navigation"
import {
  ArrowsLeftRight,
  FileText,
  User,
  Warehouse,
} from "@phosphor-icons/react"

const TAB_CONFIG = [
  { path: "/armazem", title: "Armazém", icon: Warehouse },
  { path: "/documentos", title: "Documentos", icon: FileText },
  { path: "/movimentacoes", title: "Movimentações", icon: ArrowsLeftRight },
]

function getTabForPath(pathname) {
  const tab = TAB_CONFIG.find(
    (t) => pathname === t.path || pathname.startsWith(t.path + "/")
  )
  return tab ?? TAB_CONFIG[0]
}

export default function DashboardHeader() {
  const pathname = usePathname()
  const { title, icon: Icon } = getTabForPath(pathname)

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
      <button
        type="button"
        className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-300 cursor-pointer bg-white"
        aria-label="Perfil"
      >
        <User size={22} weight="regular" className="text-gray-600" />
      </button>
    </header>
  )
}
