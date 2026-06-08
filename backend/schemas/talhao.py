from pydantic import BaseModel, Field


class TalhaoCreate(BaseModel):
    nome: str = Field(..., min_length=1)
    tamanho_hectares: float | None = Field(None, gt=0)


class TalhaoUpdate(BaseModel):
    nome: str | None = Field(None, min_length=1)
    tamanho_hectares: float | None = Field(None, gt=0)


class TalhaoResponse(BaseModel):
    id: int
    nome: str
    tamanho_hectares: float | None = None
    media_sc_ha: float | None = None

    class Config:
        from_attributes = True
