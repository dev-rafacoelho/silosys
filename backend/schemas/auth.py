from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class RegistroRequest(BaseModel):
    nome: str = Field(..., min_length=1)
    email: EmailStr
    senha: str = Field(..., min_length=6)
    foto_perfil: str | None = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RegistroResponse(BaseModel):
    id: int
    nome: str
    email: str
    foto_perfil: str | None
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenVerifyResponse(BaseModel):
    valid: bool
    user_id: int | None = None


class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: str
    foto_perfil: str | None

    class Config:
        from_attributes = True
