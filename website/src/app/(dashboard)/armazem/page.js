"use client"

import Image from "next/image"
import Link from "next/link"
import { CaretLeft, CaretRight, Plus } from "@phosphor-icons/react"

export default function ArmazemPage() {
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

        <Link
          href="/armazens/novo"
          className="absolute top-6 right-6 z-10 flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium border-0 cursor-pointer shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#A6DE47", color: "#1a1a1a" }}
        >
          <Plus size={20} weight="bold" />
          Adicionar Armazém
        </Link>

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
    </div>
  )
}
