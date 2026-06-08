import api from "./api"

export async function listarTalhoes(opcoes = {}) {
  const { data } = await api.get("/talhoes", { params: opcoes })
  return data
}

export async function criarTalhao(dados) {
  const { data } = await api.post("/talhoes", {
    nome: dados.nome.trim(),
    tamanho_hectares:
      dados.tamanho_hectares != null && dados.tamanho_hectares !== ""
        ? Number(dados.tamanho_hectares)
        : null,
  })
  return data
}

export async function atualizarTalhao(id, dados) {
  const payload = {}
  if (dados.nome != null) payload.nome = dados.nome.trim()
  if (dados.tamanho_hectares !== undefined) {
    payload.tamanho_hectares =
      dados.tamanho_hectares != null && dados.tamanho_hectares !== ""
        ? Number(dados.tamanho_hectares)
        : null
  }
  const { data } = await api.patch(`/talhoes/${id}`, payload)
  return data
}

export async function excluirTalhao(id) {
  await api.delete(`/talhoes/${id}`)
}
