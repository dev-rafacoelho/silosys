from datetime import datetime

from pydantic import BaseModel, Field


class RetiradaCreate(BaseModel):
    armazen_id: int = Field(..., gt=0)
    grao_id: int = Field(..., gt=0)
    contrato_id: int | None = Field(None, gt=0)
    placa: str | None = None
    tara: int | None = Field(None, ge=0)
    peso_bruto: int | None = Field(None, ge=0)


class RetiradaUpdate(BaseModel):
    armazen_id: int | None = Field(None, gt=0)
    grao_id: int | None = Field(None, gt=0)
    contrato_id: int | None = Field(None, gt=0)
    placa: str | None = None
    tara: int | None = Field(None, ge=0)
    peso_bruto: int | None = Field(None, ge=0)


class RetiradaResponse(BaseModel):
    id: int
    usuario_id: int
    armazen_id: int
    grao_id: int
    grao_nome: str = ""
    contrato_id: int | None
    placa: str | None
    tara: int | None
    peso_bruto: int | None
    created_at: datetime | None = None

    class Config:
        from_attributes = True
