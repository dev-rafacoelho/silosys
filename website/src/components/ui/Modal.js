"use client"

import { useEffect } from "react"

export default function Modal({
  open,
  onClose,
  title,
  children,
  onCancel,
  onSave,
  saveLabel = "Salvar",
  cancelLabel = "Cancelar",
}) {
  const handleCancel = () => {
    onCancel?.()
    onClose?.()
  }

  useEffect(() => {
    if (!open) return
    const handleEscape = (e) => {
      if (e.key === "Escape") handleCancel()
    }
    document.addEventListener("keydown", handleEscape)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleCancel}
        aria-hidden="true"
      />

      <div
        className="relative w-full max-w-md rounded-2xl shadow-xl p-6 flex flex-col gap-5"
        style={{ backgroundColor: "#f0f9e8" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="modal-title"
          className="text-lg font-bold text-gray-900"
        >
          {title}
        </h2>
        <hr className="border-gray-300/80 -mx-6" />

        <div className="flex flex-col gap-4 min-h-0">
          {children}
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2.5 rounded-xl font-medium border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-5 py-2.5 rounded-xl font-medium border-0 text-gray-900 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#A6DE47" }}
          >
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
