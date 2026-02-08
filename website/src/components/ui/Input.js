"use client"

export default function Input({ className = "", ...props }) {
    return (
        <input
            className={`
                w-full px-4 py-3 rounded-xl
                border border-gray-300
                bg-white
                placeholder:text-gray-400
                focus:outline-none focus:border-gray-400
                transition-colors
                ${className}
            `.trim().replace(/\s+/g, " ")}
            {...props}
        />
    )
}
