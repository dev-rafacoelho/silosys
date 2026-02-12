import { NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL
const ROTAS_PUBLICAS = ["/login", "/registro"]
const COOKIE_ACCESS = "access_token"
const COOKIE_REFRESH = "refresh_token"

function isRotaPublica(pathname) {
  return ROTAS_PUBLICAS.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`)
  )
}

function getCookie(request, name) {
  try {
    const cookie = request.cookies.get(name)
    const value = cookie?.value
    return value && String(value).trim() !== "" ? String(value).trim() : null
  } catch {
    return null
  }
}

async function verificarAccessToken(accessToken) {
  if (!accessToken || String(accessToken).trim() === "") return false
  try {
    const url = new URL("/auth/verify", API_URL).toString()
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
    return res.ok === true
  } catch {
    return false
  }
}

async function refreshAccessToken(refreshToken) {
  if (!refreshToken || String(refreshToken).trim() === "") return null
  try {
    const url = new URL("/auth/refresh_token", API_URL).toString()
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.access_token) return null
    return data
  } catch {
    return null
  }
}

function setAccessTokenCookie(response, accessToken, expiresIn) {
  response.cookies.set(COOKIE_ACCESS, accessToken, {
    path: "/",
    maxAge: expiresIn || 60 * 60 * 24 * 7,
    SameSite: "Lax",
  })
}

export async function proxy(request) {
  const pathname = request.nextUrl.pathname

  if (isRotaPublica(pathname)) {
    const accessToken = getCookie(request, COOKIE_ACCESS)
    const refreshToken = getCookie(request, COOKIE_REFRESH)

    if (accessToken && (await verificarAccessToken(accessToken))) {
      return NextResponse.redirect(new URL("/armazem", request.url))
    }
    if (refreshToken) {
      const novosTokens = await refreshAccessToken(refreshToken)
      if (novosTokens) {
        const res = NextResponse.redirect(new URL("/armazem", request.url))
        setAccessTokenCookie(
          res,
          novosTokens.access_token,
          novosTokens.expires_in
        )
        return res
      }
    }
    return NextResponse.next()
  }

  const accessToken = getCookie(request, COOKIE_ACCESS)
  const refreshToken = getCookie(request, COOKIE_REFRESH)

  if (!accessToken && !refreshToken) {
    const url = new URL("/login", request.url)
    return NextResponse.redirect(url)
  }

  if (accessToken && (await verificarAccessToken(accessToken))) {
    return NextResponse.next()
  }

  if (refreshToken) {
    const novosTokens = await refreshAccessToken(refreshToken)
    if (novosTokens) {
      const res = NextResponse.next()
      setAccessTokenCookie(
        res,
        novosTokens.access_token,
        novosTokens.expires_in
      )
      return res
    }
  }

  const url = new URL("/login", request.url)
  const res = NextResponse.redirect(url)
  res.cookies.set(COOKIE_ACCESS, "", { path: "/", maxAge: 0 })
  res.cookies.set(COOKIE_REFRESH, "", { path: "/", maxAge: 0 })
  return res
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|_next/data|.*\\.(?:svg|jpg|jpeg|png|gif|ico|webp)$).*)",
  ],
}
