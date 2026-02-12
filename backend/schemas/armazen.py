from pydantic import BaseModel, Field


class ArmazenCreate(BaseModel):
    capacidade: int = Field(..., gt=0)
    nome: str = Field(..., min_length=1)


class ArmazenUpdate(BaseModel):
    capacidade: int | None = Field(None, gt=0)
    nome: str | None = Field(None, min_length=1)


class ArmazenResponse(BaseModel):
    id: int
    usuario_id: int
    capacidade: int
    nome: str

    class Config:
        from_attributes = True
