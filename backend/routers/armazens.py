from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models.adicao import Adicao
from models.armazen import Armazen
from models.retirada import Retirada
from models.usuario import Usuario
from routers.auth import get_current_user
from schemas.armazen import ArmazenCreate, ArmazenResponse, ArmazenUpdate

router = APIRouter(prefix="/armazens", tags=["Armazéns"])


def _nao_deletado():
    return Armazen.deleted_at.is_(None)


def _nao_deletado_adicao():
    return Adicao.deleted_at.is_(None)


def _nao_deletado_retirada():
    return Retirada.deleted_at.is_(None)


def _estoque_armazen(db: Session, armazen_id: int) -> int:
    entrada_bruto = int(
        db.query(func.coalesce(func.sum(Adicao.peso_bruto), 0))
        .filter(Adicao.armazen_id == armazen_id, _nao_deletado_adicao())
        .scalar()
        or 0
    )
    entrada_tara = int(
        db.query(func.coalesce(func.sum(Adicao.tara), 0))
        .filter(Adicao.armazen_id == armazen_id, _nao_deletado_adicao())
        .scalar()
        or 0
    )
    total_entrada = entrada_bruto - entrada_tara
    bruto = (
        db.query(func.coalesce(func.sum(Retirada.peso_bruto), 0))
        .filter(Retirada.armazen_id == armazen_id, _nao_deletado_retirada())
        .scalar()
        or 0
    )
    tara = (
        db.query(func.coalesce(func.sum(Retirada.tara), 0))
        .filter(Retirada.armazen_id == armazen_id, _nao_deletado_retirada())
        .scalar()
        or 0
    )
    return max(0, total_entrada - (int(bruto) - int(tara)))


def _grao_armazen(db: Session, armazen_id: int) -> int | None:
    graos_adicao = (
        db.query(Adicao.grao_id)
        .filter(Adicao.armazen_id == armazen_id, _nao_deletado_adicao())
        .distinct()
        .all()
    )
    graos_retirada = (
        db.query(Retirada.grao_id)
        .filter(Retirada.armazen_id == armazen_id, _nao_deletado_retirada())
        .distinct()
        .all()
    )
    todos = {g[0] for g in graos_adicao} | {g[0] for g in graos_retirada}
    if len(todos) == 1:
        return next(iter(todos))
    return None


@router.get("", response_model=list[ArmazenResponse])
def listar(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=999),
):
    armazens = (
        db.query(Armazen)
        .filter(Armazen.usuario_id == usuario.id, _nao_deletado())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        ArmazenResponse(
            id=a.id,
            usuario_id=a.usuario_id,
            capacidade=a.capacidade,
            nome=a.nome,
            estoque=_estoque_armazen(db, a.id),
            grao_id=_grao_armazen(db, a.id),
        )
        for a in armazens
    ]


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
