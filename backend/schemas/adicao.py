from datetime import datetime

from pydantic import BaseModel, Field


class AdicaoCreate(BaseModel):
    armazen_id: int = Field(..., gt=0)
    grao_id: int = Field(..., gt=0)
    quantidade: int = Field(..., ge=0)
    placa: str | None = None
    umidade: int | None = Field(None, ge=0)
    tara: int | None = Field(None, ge=0)
    peso_bruto: int | None = Field(None, ge=0)
    desconto: int | None = Field(None, ge=0)
    talhao_id: int | None = Field(None, gt=0)


class AdicaoUpdate(BaseModel):
    armazen_id: int | None = Field(None, gt=0)
    grao_id: int | None = Field(None, gt=0)
    quantidade: int | None = Field(None, ge=0)
    placa: str | None = None
    umidade: int | None = Field(None, ge=0)
    tara: int | None = Field(None, ge=0)
    peso_bruto: int | None = Field(None, ge=0)
    desconto: int | None = Field(None, ge=0)
    talhao_id: int | None = Field(None, gt=0)


class AdicaoResponse(BaseModel):
    id: int
    usuario_id: int
    armazen_id: int
    grao_id: int
    grao_nome: str = ""
    quantidade: int
    placa: str | None
    umidade: int | None
    tara: int | None
    peso_bruto: int | None
    desconto: int | None
    talhao_id: int | None
    talhao_nome: str = ""
    created_at: datetime | None = None

    class Config:
        from_attributes = True
