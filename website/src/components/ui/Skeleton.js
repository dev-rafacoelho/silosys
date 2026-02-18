"use client"

export default function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 ${className}`.trim().replace(/\s+/g, " ")}
      aria-hidden
      {...props}
    />
  )
}
