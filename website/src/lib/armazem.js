import api from "./api"

export async function criarArmazem(dados) {
  const { data } = await api.post("/armazens", {
    nome: dados.nome.trim(),
    capacidade: Number(dados.capacidade),
  })
  return data
}

export async function listarArmazens(opcoes = {}) {
  const { data } = await api.get("/armazens", { params: opcoes })
  return data
}
