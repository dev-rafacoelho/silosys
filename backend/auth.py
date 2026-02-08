from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from config import settings

ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"


def hash_senha(senha: str) -> str:
    return bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verificar_senha(senha_plana: str, hash_senha: str) -> bool:
    return bcrypt.checkpw(
        senha_plana.encode("utf-8"), hash_senha.encode("utf-8")
    )


def criar_access_token(sub: str) -> tuple[str, int]:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": sub,
        "type": ACCESS_TOKEN_TYPE,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    expires_in = int(settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    return token, expires_in


def criar_refresh_token(sub: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload = {
        "sub": sub,
        "type": REFRESH_TOKEN_TYPE,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decodificar_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != ACCESS_TOKEN_TYPE:
            return None
        return payload.get("sub")
    except JWTError:
        return None


def decodificar_refresh_token(token: str) -> str | None:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != REFRESH_TOKEN_TYPE:
            return None
        return payload.get("sub")
    except JWTError:
        return None
