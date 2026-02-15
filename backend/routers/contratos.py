from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models.contrato import Contrato
from models.usuario import Usuario
from routers.auth import get_current_user
from schemas.contrato import ContratoCreate, ContratoResponse, ContratoUpdate

router = APIRouter(prefix="/contratos", tags=["Contratos"])


def _nao_deletado():
    return Contrato.deleted_at.is_(None)


@router.get("", response_model=list[ContratoResponse])
def listar(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=999),
):
    return (
        db.query(Contrato)
        .filter(Contrato.usuario_id == usuario.id, _nao_deletado())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{contrato_id}", response_model=ContratoResponse)
def obter(
    contrato_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    contrato = (
        db.query(Contrato)
        .filter(
            Contrato.id == contrato_id,
            Contrato.usuario_id == usuario.id,
            _nao_deletado(),
        )
        .first()
    )
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    return contrato


@router.post("", response_model=ContratoResponse, status_code=201)
def criar(
    body: ContratoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    contrato = Contrato(
        usuario_id=usuario.id,
        empresa=body.empresa,
        grao_id=body.grao_id,
        vencimento=body.vencimento,
        valor=body.valor,
        data_pagamento=body.data_pagamento,
        quantidade=body.quantidade,
    )
    db.add(contrato)
    db.commit()
    db.refresh(contrato)
    return contrato


@router.patch("/{contrato_id}", response_model=ContratoResponse)
def atualizar(
    contrato_id: int,
    body: ContratoUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    contrato = (
        db.query(Contrato)
        .filter(
            Contrato.id == contrato_id,
            Contrato.usuario_id == usuario.id,
            _nao_deletado(),
        )
        .first()
    )
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(contrato, k, v)
    db.commit()
    db.refresh(contrato)
    return contrato


@router.delete("/{contrato_id}", status_code=204)
def excluir(
    contrato_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    contrato = (
        db.query(Contrato)
        .filter(
            Contrato.id == contrato_id,
            Contrato.usuario_id == usuario.id,
            _nao_deletado(),
        )
        .first()
    )
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    contrato.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return None
