from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models.contrato import Contrato
from models.retirada import Retirada
from models.usuario import Usuario
from routers.auth import get_current_user
from schemas.contrato import ContratoCreate, ContratoResponse, ContratoUpdate

router = APIRouter(prefix="/contratos", tags=["Contratos"])


def _nao_deletado_contrato():
    return Contrato.deleted_at.is_(None)


def _nao_deletado_retirada():
    return Retirada.deleted_at.is_(None)


def _quantidade_retirada_por_contrato(db: Session, contrato_ids: list[int]) -> dict[int, int]:
    if not contrato_ids:
        return {}
    rows = (
        db.query(
            Retirada.contrato_id,
            func.coalesce(
                func.sum(func.coalesce(Retirada.peso_bruto, 0) - func.coalesce(Retirada.tara, 0)),
                0,
            ).label("total"),
        )
        .filter(
            Retirada.contrato_id.in_(contrato_ids),
            _nao_deletado_retirada(),
        )
        .group_by(Retirada.contrato_id)
        .all()
    )
    return {r.contrato_id: max(0, int(r.total)) for r in rows}


@router.get("", response_model=list[ContratoResponse])
def listar(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=999),
):
    contratos = (
        db.query(Contrato)
        .filter(Contrato.usuario_id == usuario.id, _nao_deletado_contrato())
        .offset(skip)
        .limit(limit)
        .all()
    )
    ids = [c.id for c in contratos]
    retiradas_map = _quantidade_retirada_por_contrato(db, ids)
    return [
        ContratoResponse(
            id=c.id,
            usuario_id=c.usuario_id,
            empresa=c.empresa,
            grao_id=c.grao_id,
            grao_nome=c.grao_nome,
            vencimento=c.vencimento,
            valor=c.valor,
            data_pagamento=c.data_pagamento,
            quantidade=c.quantidade,
            quantidade_retirada=retiradas_map.get(c.id, 0),
        )
        for c in contratos
    ]


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
            _nao_deletado_contrato(),
        )
        .first()
    )
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    retiradas_map = _quantidade_retirada_por_contrato(db, [contrato.id])
    return ContratoResponse(
        id=contrato.id,
        usuario_id=contrato.usuario_id,
        empresa=contrato.empresa,
        grao_id=contrato.grao_id,
        grao_nome=contrato.grao_nome,
        vencimento=contrato.vencimento,
        valor=contrato.valor,
        data_pagamento=contrato.data_pagamento,
        quantidade=contrato.quantidade,
        quantidade_retirada=retiradas_map.get(contrato.id, 0),
    )


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
            _nao_deletado_contrato(),
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
            _nao_deletado_contrato(),
        )
        .first()
    )
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    contrato.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return None
