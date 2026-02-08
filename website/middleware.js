import { NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const ROTAS_PUBLICAS = ["/login", "/registro"]

function isRotaPublica(pathname) {
  return ROTAS_PUBLICAS.some((rota) =>
    pathname === rota || pathname.startsWith(`${rota}/`),
  )
}

async function verificarAccessToken(accessToken) {
  try {
    const res = await fetch(`${API_URL}/auth/verify`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (res.ok) return true
    return false
  } catch {
    return false
  }
}

async function refreshAccessToken(refreshToken) {
  try {
    const res = await fetch(`${API_URL}/auth/refresh_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data
  } catch {
    return null
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl

  if (isRotaPublica(pathname)) {
    const accessToken = request.cookies.get("access_token")?.value
    const refreshToken = request.cookies.get("refresh_token")?.value

    if (accessToken && (await verificarAccessToken(accessToken))) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    if (refreshToken) {
      const novosTokens = await refreshAccessToken(refreshToken)
      if (novosTokens) {
        const response = NextResponse.redirect(new URL("/", request.url))
        response.cookies.set("access_token", novosTokens.access_token, {
          path: "/",
          maxAge: novosTokens.expires_in || 60 * 60 * 24 * 7,
          SameSite: "Lax",
        })
        return response
      }
    }
    return NextResponse.next()
  }

  const accessToken = request.cookies.get("access_token")?.value
  const refreshToken = request.cookies.get("refresh_token")?.value

  if (accessToken && (await verificarAccessToken(accessToken))) {
    return NextResponse.next()
  }

  if (refreshToken) {
    const novosTokens = await refreshAccessToken(refreshToken)
    if (novosTokens) {
      const response = NextResponse.next()
      response.cookies.set("access_token", novosTokens.access_token, {
        path: "/",
        maxAge: novosTokens.expires_in || 60 * 60 * 24 * 7,
        SameSite: "Lax",
      })
      return response
    }
  }

  return NextResponse.redirect(new URL("/login", request.url))
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|fundo-login.jpg).*)",
  ],
}
