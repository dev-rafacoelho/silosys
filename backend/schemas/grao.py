from pydantic import BaseModel


class GraoResponse(BaseModel):
    id: int
    nome: str

    class Config:
        from_attributes = True
