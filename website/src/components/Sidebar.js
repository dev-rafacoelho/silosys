"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Warehouse,
  FileText,
  ArrowsLeftRight,
} from "@phosphor-icons/react"

const NAV_ITEMS = [
  { href: "/armazem", icon: Warehouse, label: "Armazém" },
  { href: "/documentos", icon: FileText, label: "Documentos" },
  { href: "/movimentacoes", icon: ArrowsLeftRight, label: "Movimentações" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="w-[72px] min-h-screen flex flex-col flex-shrink-0"
      style={{ backgroundColor: "#E4FFCC" }}
    >
      {/* Top: logo */}
      <div className="flex items-center justify-center gap-2 px-3 py-4 flex-shrink-0">
        <Image
          src="/logo.svg"
          alt="SiloSys"
          width={40}
          height={53}
          className="object-contain"
        />
      </div>

      {/* Nav: white rounded container com indicador deslizante */}
      <nav className="p-2 mt-2">
        <div
          className="relative rounded-2xl bg-white shadow-sm border border-gray-100/80 py-2 flex flex-col items-center gap-1"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          {/* Quadrado que desliza até a tab ativa */}
          {(() => {
            const activeIndex = NAV_ITEMS.findIndex(
              (item) =>
                pathname === item.href ||
                (item.href !== "/armazem" && pathname.startsWith(item.href))
            )
            const index = activeIndex >= 0 ? activeIndex : 0
            const itemHeight = 48
            const gap = 4
            const top = 8 + index * (itemHeight + gap)
            return (
              <div
                className="absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-xl pointer-events-none"
                style={{
                  top: `${top}px`,
                  backgroundColor: "#E4FFCC",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  transition: "top 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                aria-hidden
              />
            )
          })()}

          {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="relative z-10 flex items-center justify-center w-12 h-12 rounded-xl"
              title={label}
              aria-label={label}
            >
              <Icon
                size={26}
                weight="regular"
                style={{ color: "#44AA00" }}
              />
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  )
}
