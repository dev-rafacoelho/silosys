from pydantic import BaseModel


class ProdutividadeTalhaoItem(BaseModel):
    id: int
    nome: str
    tamanho_hectares: float | None = None
    kg: int
    sacas: float
    media_sc_ha: float | None = None


class ProducaoGraoItem(BaseModel):
    grao_id: int
    nome: str
    kg: int
    sacas: float


class EstoqueArmazemItem(BaseModel):
    id: int
    nome: str
    capacidade: int
    estoque: int
    ocupacao_pct: float
    grao_nome: str | None = None


class MovimentacaoItem(BaseModel):
    id: int
    data: str
    grao: str
    armazen: str
    talhao: str | None = None
    quantidade: int


class MovimentacoesResponse(BaseModel):
    entradas: list[MovimentacaoItem]
    saidas: list[MovimentacaoItem]
    total_entradas: int
    total_saidas: int
