import api from "./api"

function periodoParams({ inicio, fim } = {}) {
  const params = {}
  if (inicio) params.inicio = inicio
  if (fim) params.fim = fim
  return params
}

export async function produtividadeTalhao(periodo) {
  const { data } = await api.get("/relatorios/produtividade-talhao", {
    params: periodoParams(periodo),
  })
  return data
}

export async function producaoGrao(periodo) {
  const { data } = await api.get("/relatorios/producao-grao", {
    params: periodoParams(periodo),
  })
  return data
}

export async function estoqueArmazem() {
  const { data } = await api.get("/relatorios/estoque-armazem")
  return data
}

export async function movimentacoes(periodo) {
  const { data } = await api.get("/relatorios/movimentacoes", {
    params: periodoParams(periodo),
  })
  return data
}

/**
 * Gera e baixa um CSV. `colunas` = [{ key, label }], `linhas` = array de objetos.
 * Separador ";" e BOM UTF-8 para abrir corretamente no Excel pt-BR.
 */
export function exportarCSV(nomeArquivo, colunas, linhas) {
  const escapar = (valor) => {
    const s = valor == null ? "" : String(valor)
    if (/[";\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const cabecalho = colunas.map((c) => escapar(c.label)).join(";")
  const corpo = linhas
    .map((linha) => colunas.map((c) => escapar(linha[c.key])).join(";"))
    .join("\n")
  const conteudo = `﻿${cabecalho}\n${corpo}`
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = nomeArquivo.endsWith(".csv") ? nomeArquivo : `${nomeArquivo}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
