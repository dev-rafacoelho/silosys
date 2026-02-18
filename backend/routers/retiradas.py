from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models.adicao import Adicao
from models.retirada import Retirada
from models.usuario import Usuario
from routers.auth import get_current_user
from schemas.retirada import RetiradaCreate, RetiradaResponse, RetiradaUpdate

router = APIRouter(prefix="/retiradas", tags=["Retiradas"])


def _nao_deletado():
    return Retirada.deleted_at.is_(None)


def _nao_deletado_adicao():
    return Adicao.deleted_at.is_(None)


def _nao_deletado_retirada():
    return Retirada.deleted_at.is_(None)


def _estoque_armazen(
    db: Session, armazen_id: int, excluir_retirada_id: int | None = None
) -> int:
    total_entrada = int(
        db.query(func.coalesce(func.sum(Adicao.quantidade), 0))
        .filter(Adicao.armazen_id == armazen_id, _nao_deletado_adicao())
        .scalar()
        or 0
    )
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
    estoque = max(0, total_entrada - (int(bruto) - int(tara)))
    if excluir_retirada_id:
        r = (
            db.query(Retirada)
            .filter(Retirada.id == excluir_retirada_id, _nao_deletado())
            .first()
        )
        if r:
            estoque += (r.peso_bruto or 0) - (r.tara or 0)
    return max(0, estoque)


def _validar_estoque_retirada(
    db: Session,
    armazen_id: int,
    peso_bruto: int | None,
    tara: int | None,
    excluir_retirada_id: int | None = None,
) -> None:
    quantidade = (peso_bruto or 0) - (tara or 0)
    if quantidade <= 0:
        return
    estoque = _estoque_armazen(db, armazen_id, excluir_retirada_id=excluir_retirada_id)
    if quantidade > estoque:
        raise HTTPException(
            status_code=400,
            detail=f"Não é permitido retirar mais do que o estoque atual. Estoque disponível: {estoque} kg.",
        )


def _validar_grao_do_armazen(
    db: Session, armazen_id: int, grao_id: int, excluir_retirada_id: int | None = None
) -> None:
    outra_adicao = (
        db.query(Adicao)
        .filter(
            Adicao.armazen_id == armazen_id,
            Adicao.grao_id != grao_id,
            _nao_deletado_adicao(),
        )
        .first()
    )
    if outra_adicao is not None:
        raise HTTPException(
            status_code=400,
            detail="Não é permitido retirar esse grão deste armazém. O armazém possui movimentações apenas com outro grão.",
        )
    q = db.query(Retirada).filter(
        Retirada.armazen_id == armazen_id,
        Retirada.grao_id != grao_id,
        _nao_deletado(),
    )
    if excluir_retirada_id is not None:
        q = q.filter(Retirada.id != excluir_retirada_id)
    if q.first() is not None:
        raise HTTPException(
            status_code=400,
            detail="Não é permitido retirar esse grão deste armazém. O armazém possui movimentações apenas com outro grão.",
        )


@router.get("", response_model=list[RetiradaResponse])
def listar(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=999),
):
    return (
        db.query(Retirada)
        .filter(Retirada.usuario_id == usuario.id, _nao_deletado())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{retirada_id}", response_model=RetiradaResponse)
def obter(
    retirada_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    retirada = (
        db.query(Retirada)
        .filter(
            Retirada.id == retirada_id,
            Retirada.usuario_id == usuario.id,
            _nao_deletado(),
        )
        .first()
    )
    if not retirada:
        raise HTTPException(status_code=404, detail="Retirada não encontrada")
    return retirada


@router.post("", response_model=RetiradaResponse, status_code=201)
def criar(
    body: RetiradaCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _validar_grao_do_armazen(db, body.armazen_id, body.grao_id)
    _validar_estoque_retirada(db, body.armazen_id, body.peso_bruto, body.tara)
    retirada = Retirada(
        usuario_id=usuario.id,
        armazen_id=body.armazen_id,
        grao_id=body.grao_id,
        contrato_id=body.contrato_id,
        placa=body.placa,
        tara=body.tara,
        peso_bruto=body.peso_bruto,
    )
    db.add(retirada)
    db.commit()
    db.refresh(retirada)
    return retirada


@router.patch("/{retirada_id}", response_model=RetiradaResponse)
def atualizar(
    retirada_id: int,
    body: RetiradaUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    retirada = (
        db.query(Retirada)
        .filter(
            Retirada.id == retirada_id,
            Retirada.usuario_id == usuario.id,
            _nao_deletado(),
        )
        .first()
    )
    if not retirada:
        raise HTTPException(status_code=404, detail="Retirada não encontrada")
    data = body.model_dump(exclude_unset=True)
    if "armazen_id" in data or "grao_id" in data:
        armazen_id = data.get("armazen_id", retirada.armazen_id)
        grao_id = data.get("grao_id", retirada.grao_id)
        _validar_grao_do_armazen(db, armazen_id, grao_id, excluir_retirada_id=retirada.id)
    if "armazen_id" in data or "peso_bruto" in data or "tara" in data:
        armazen_id = data.get("armazen_id", retirada.armazen_id)
        peso_bruto = data.get("peso_bruto", retirada.peso_bruto)
        tara = data.get("tara", retirada.tara)
        _validar_estoque_retirada(
            db, armazen_id, peso_bruto, tara, excluir_retirada_id=retirada.id
        )
    for k, v in data.items():
        setattr(retirada, k, v)
    db.commit()
    db.refresh(retirada)
    return retirada


@router.delete("/{retirada_id}", status_code=204)
def excluir(
    retirada_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    retirada = (
        db.query(Retirada)
        .filter(
            Retirada.id == retirada_id,
            Retirada.usuario_id == usuario.id,
            _nao_deletado(),
        )
        .first()
    )
    if not retirada:
        raise HTTPException(status_code=404, detail="Retirada não encontrada")
    retirada.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return None
