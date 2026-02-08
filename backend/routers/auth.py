from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database import get_db
from models.usuario import Usuario
from schemas.auth import (
    LoginRequest,
    LoginResponse,
    RegistroRequest,
    RegistroResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    TokenVerifyResponse,
)
from auth import (
    hash_senha,
    verificar_senha,
    criar_access_token,
    criar_refresh_token,
    decodificar_access_token,
    decodificar_refresh_token,
)

router = APIRouter(prefix="/auth", tags=["Autenticação"])
security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> Usuario:
    if not credentials:
        raise HTTPException(status_code=401, detail="Token não informado")
    user_id = decodificar_access_token(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")
    usuario = db.query(Usuario).filter(Usuario.id == int(user_id)).first()
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return usuario


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == request.email).first()
    if not usuario or not verificar_senha(request.senha, usuario.hash_senha):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")

    access_token, expires_in = criar_access_token(str(usuario.id))
    refresh_token = criar_refresh_token(str(usuario.id))

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
    )


@router.post("/registro", response_model=RegistroResponse)
def registro(request: RegistroRequest, db: Session = Depends(get_db)):
    existe = db.query(Usuario).filter(Usuario.email == request.email).first()
    if existe:
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    usuario = Usuario(
        nome=request.nome,
        email=request.email,
        hash_senha=hash_senha(request.senha),
        foto_perfil=request.foto_perfil,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    access_token, expires_in = criar_access_token(str(usuario.id))
    refresh_token = criar_refresh_token(str(usuario.id))

    return RegistroResponse(
        id=usuario.id,
        nome=usuario.nome,
        email=usuario.email,
        foto_perfil=usuario.foto_perfil,
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
    )


@router.get("/verify", response_model=TokenVerifyResponse)
def verify_token(usuario: Usuario = Depends(get_current_user)):
    return TokenVerifyResponse(valid=True, user_id=usuario.id)


@router.post("/verify_refresh", response_model=TokenVerifyResponse)
def verify_refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    user_id = decodificar_refresh_token(request.refresh_token)
    if not user_id:
        return TokenVerifyResponse(valid=False)
    usuario = db.query(Usuario).filter(Usuario.id == int(user_id)).first()
    if not usuario:
        return TokenVerifyResponse(valid=False)
    return TokenVerifyResponse(valid=True, user_id=usuario.id)


@router.post("/refresh_token", response_model=RefreshTokenResponse)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    user_id = decodificar_refresh_token(request.refresh_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Refresh token inválido ou expirado")

    usuario = db.query(Usuario).filter(Usuario.id == int(user_id)).first()
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")

    access_token, expires_in = criar_access_token(str(usuario.id))

    return RefreshTokenResponse(
        access_token=access_token,
        expires_in=expires_in,
    )
