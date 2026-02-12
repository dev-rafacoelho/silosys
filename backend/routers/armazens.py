from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models.armazen import Armazen
from models.usuario import Usuario
from routers.auth import get_current_user
from schemas.armazen import ArmazenCreate, ArmazenResponse, ArmazenUpdate

router = APIRouter(prefix="/armazens", tags=["Armazéns"])


def _nao_deletado():
    return Armazen.deleted_at.is_(None)


@router.get("", response_model=list[ArmazenResponse])
def listar(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    return (
        db.query(Armazen)
        .filter(Armazen.usuario_id == usuario.id, _nao_deletado())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("", response_model=ArmazenResponse, status_code=201)
def criar(
    body: ArmazenCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    armazen = Armazen(
        usuario_id=usuario.id,
        capacidade=body.capacidade,
        nome=body.nome,
    )
    db.add(armazen)
    db.commit()
    db.refresh(armazen)
    return armazen


@router.patch("/{armazen_id}", response_model=ArmazenResponse)
def atualizar(
    armazen_id: int,
    body: ArmazenUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    armazen = (
        db.query(Armazen)
        .filter(
            Armazen.id == armazen_id,
            Armazen.usuario_id == usuario.id,
            _nao_deletado(),
        )
        .first()
    )
    if not armazen:
        raise HTTPException(status_code=404, detail="Armazém não encontrado")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(armazen, k, v)
    db.commit()
    db.refresh(armazen)
    return armazen


@router.delete("/{armazen_id}", status_code=204)
def excluir(
    armazen_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    armazen = (
        db.query(Armazen)
        .filter(
            Armazen.id == armazen_id,
            Armazen.usuario_id == usuario.id,
            _nao_deletado(),
        )
        .first()
    )
    if not armazen:
        raise HTTPException(status_code=404, detail="Armazém não encontrado")
    armazen.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return None
