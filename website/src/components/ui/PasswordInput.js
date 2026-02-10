"use client"

import { useState } from "react"
import { Eye, EyeSlash } from "@phosphor-icons/react"
import Input from "./Input"

export default function PasswordInput({ className = "", ...props }) {
    const [visible, setVisible] = useState(false)

    return (
        <div className="relative">
            <Input
                type={visible ? "text" : "password"}
                className={`pr-12 ${className}`.trim()}
                {...props}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
                tabIndex={-1}
            >
                {visible ? (
                    <EyeSlash size={22} weight="regular" />
                ) : (
                    <Eye size={22} weight="regular" />
                )}
            </button>
        </div>
    )
}
