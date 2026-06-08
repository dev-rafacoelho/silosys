from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models.adicao import Adicao
from models.talhao import Talhao
from models.usuario import Usuario
from routers.auth import get_current_user
from schemas.talhao import TalhaoCreate, TalhaoResponse, TalhaoUpdate

router = APIRouter(prefix="/talhoes", tags=["Talhões"])

KG_POR_SACA = 60


def _media_sc_ha(db: Session, talhao: Talhao) -> float | None:
    tamanho = float(talhao.tamanho_hectares) if talhao.tamanho_hectares else 0.0
    if tamanho <= 0:
        return None
    quantidade_kg = int(
        db.query(
            func.coalesce(
                func.sum(
                    Adicao.peso_bruto - Adicao.tara - func.coalesce(Adicao.desconto, 0)
                ),
                0,
            )
        )
        .filter(Adicao.talhao_id == talhao.id, Adicao.deleted_at.is_(None))
        .scalar()
        or 0
    )
    quantidade_kg = max(0, quantidade_kg)
    sacas = quantidade_kg / KG_POR_SACA
    return round(sacas / tamanho, 2)


def _to_response(db: Session, talhao: Talhao) -> TalhaoResponse:
    return TalhaoResponse(
        id=talhao.id,
        nome=talhao.nome,
        tamanho_hectares=float(talhao.tamanho_hectares)
        if talhao.tamanho_hectares is not None
        else None,
        media_sc_ha=_media_sc_ha(db, talhao),
    )


@router.get("", response_model=list[TalhaoResponse])
def listar(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=999),
):
    talhoes = (
        db.query(Talhao)
        .order_by(Talhao.nome)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_to_response(db, t) for t in talhoes]


@router.post("", response_model=TalhaoResponse, status_code=201)
def criar(
    body: TalhaoCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    talhao = Talhao(nome=body.nome.strip(), tamanho_hectares=body.tamanho_hectares)
    db.add(talhao)
    db.commit()
    db.refresh(talhao)
    return _to_response(db, talhao)


@router.patch("/{talhao_id}", response_model=TalhaoResponse)
def atualizar(
    talhao_id: int,
    body: TalhaoUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    talhao = db.query(Talhao).filter(Talhao.id == talhao_id).first()
    if not talhao:
        raise HTTPException(status_code=404, detail="Talhão não encontrado")
    data = body.model_dump(exclude_unset=True)
    if "nome" in data and data["nome"] is not None:
        data["nome"] = data["nome"].strip()
    for k, v in data.items():
        setattr(talhao, k, v)
    db.commit()
    db.refresh(talhao)
    return _to_response(db, talhao)


@router.delete("/{talhao_id}", status_code=204)
def excluir(
    talhao_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    talhao = db.query(Talhao).filter(Talhao.id == talhao_id).first()
    if not talhao:
        raise HTTPException(status_code=404, detail="Talhão não encontrado")
    vinculado = (
        db.query(Adicao.id)
        .filter(Adicao.talhao_id == talhao_id, Adicao.deleted_at.is_(None))
        .first()
    )
    if vinculado is not None:
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir: existem movimentações vinculadas a este talhão.",
        )
    db.delete(talhao)
    db.commit()
    return None
