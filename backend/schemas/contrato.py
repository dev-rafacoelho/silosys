from datetime import date

from pydantic import BaseModel, Field


class ContratoCreate(BaseModel):
    empresa: str = Field(..., min_length=1)
    grao_id: int = Field(..., gt=0)
    vencimento: date
    valor: int = Field(..., ge=0)
    data_pagamento: date | None = None
    quantidade: int = Field(..., ge=0)


class ContratoUpdate(BaseModel):
    empresa: str | None = Field(None, min_length=1)
    grao_id: int | None = Field(None, gt=0)
    vencimento: date | None = None
    valor: int | None = Field(None, ge=0)
    data_pagamento: date | None = None
    quantidade: int | None = Field(None, ge=0)


class ContratoResponse(BaseModel):
    id: int
    usuario_id: int
    empresa: str
    grao_id: int
    grao_nome: str = ""
    vencimento: date
    valor: int
    data_pagamento: date | None
    quantidade: int
    quantidade_retirada: int = 0

    class Config:
        from_attributes = True
