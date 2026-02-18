from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models.adicao import Adicao
from models.armazen import Armazen
from models.retirada import Retirada
from models.talhao import Talhao
from models.usuario import Usuario
from routers.auth import get_current_user
from schemas.adicao import AdicaoCreate, AdicaoResponse, AdicaoUpdate

router = APIRouter(prefix="/adicoes", tags=["Adições"])


def _nao_deletado_adicao():
    return Adicao.deleted_at.is_(None)


def _nao_deletado_retirada():
    return Retirada.deleted_at.is_(None)


def _estoque_armazen(db: Session, armazen_id: int, excluir_adicao_id: int | None = None) -> int:
    q = db.query(func.coalesce(func.sum(Adicao.quantidade), 0)).filter(
        Adicao.armazen_id == armazen_id,
        _nao_deletado_adicao(),
    )
    if excluir_adicao_id is not None:
        q = q.filter(Adicao.id != excluir_adicao_id)
    total_entrada = int(q.scalar() or 0)
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
    total_saida = int(bruto) - int(tara)
    return max(0, total_entrada - total_saida)


@router.get("", response_model=list[AdicaoResponse])
def listar(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=999),
):
    return (
        db.query(Adicao)
        .filter(Adicao.usuario_id == usuario.id, _nao_deletado_adicao())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{adicao_id}", response_model=AdicaoResponse)
def obter(
    adicao_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    adicao = (
        db.query(Adicao)
        .filter(
            Adicao.id == adicao_id,
            Adicao.usuario_id == usuario.id,
            _nao_deletado_adicao(),
        )
        .first()
    )
    if not adicao:
        raise HTTPException(status_code=404, detail="Adição não encontrada")
    return adicao


def _validar_capacidade_armazen(
    db: Session, usuario_id: int, armazen_id: int, quantidade: int, excluir_adicao_id: int | None = None
) -> None:
    armazen = (
        db.query(Armazen)
        .filter(
            Armazen.id == armazen_id,
            Armazen.usuario_id == usuario_id,
            Armazen.deleted_at.is_(None),
        )
        .first()
    )
    if not armazen:
        raise HTTPException(status_code=404, detail="Armazém não encontrado")
    estoque = _estoque_armazen(db, armazen_id, excluir_adicao_id=excluir_adicao_id)
    if estoque + quantidade > armazen.capacidade:
        raise HTTPException(
            status_code=400,
            detail=f"Capacidade do armazém excedida. Estoque atual: {estoque}. Capacidade: {armazen.capacidade}. Máximo a adicionar: {armazen.capacidade - estoque}.",
        )


def _validar_grao_unico_por_armazen(
    db: Session, armazen_id: int, grao_id: int, excluir_adicao_id: int | None = None
) -> None:
    outra_adicao = (
        db.query(Adicao)
        .filter(
            Adicao.armazen_id == armazen_id,
            Adicao.grao_id != grao_id,
            _nao_deletado_adicao(),
        )
    )
    if excluir_adicao_id is not None:
        outra_adicao = outra_adicao.filter(Adicao.id != excluir_adicao_id)
    if outra_adicao.first() is not None:
        raise HTTPException(
            status_code=400,
            detail="Não é permitido adicionar grãos diferentes no mesmo armazém. O armazém já possui movimentações com outro grão.",
        )
    outra_retirada = (
        db.query(Retirada)
        .filter(
            Retirada.armazen_id == armazen_id,
            Retirada.grao_id != grao_id,
            _nao_deletado_retirada(),
        )
        .first()
    )
    if outra_retirada is not None:
        raise HTTPException(
            status_code=400,
            detail="Não é permitido adicionar grãos diferentes no mesmo armazém. O armazém já possui movimentações com outro grão.",
        )


def _validar_talhao(db: Session, talhao_id: int | None) -> None:
    if talhao_id is None:
        return
    if db.query(Talhao).filter(Talhao.id == talhao_id).first() is None:
        raise HTTPException(status_code=400, detail="Talhão não encontrado.")


@router.post("", response_model=AdicaoResponse, status_code=201)
def criar(
    body: AdicaoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _validar_talhao(db, body.talhao_id)
    _validar_grao_unico_por_armazen(db, body.armazen_id, body.grao_id)
    _validar_capacidade_armazen(db, usuario.id, body.armazen_id, body.quantidade)
    adicao = Adicao(
        usuario_id=usuario.id,
        armazen_id=body.armazen_id,
        grao_id=body.grao_id,
        quantidade=body.quantidade,
        placa=body.placa,
        umidade=body.umidade,
        tara=body.tara,
        peso_bruto=body.peso_bruto,
        desconto=body.desconto,
        talhao_id=body.talhao_id,
    )
    db.add(adicao)
    db.commit()
    db.refresh(adicao)
    return adicao


@router.patch("/{adicao_id}", response_model=AdicaoResponse)
def atualizar(
    adicao_id: int,
    body: AdicaoUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    adicao = (
        db.query(Adicao)
        .filter(
            Adicao.id == adicao_id,
            Adicao.usuario_id == usuario.id,
            _nao_deletado_adicao(),
        )
        .first()
    )
    if not adicao:
        raise HTTPException(status_code=404, detail="Adição não encontrada")
    data = body.model_dump(exclude_unset=True)
    armazen_id = data.get("armazen_id", adicao.armazen_id)
    grao_id = data.get("grao_id", adicao.grao_id)
    quantidade = data.get("quantidade", adicao.quantidade)
    if "talhao_id" in data:
        _validar_talhao(db, data.get("talhao_id"))
    if "armazen_id" in data or "grao_id" in data:
        _validar_grao_unico_por_armazen(db, armazen_id, grao_id, excluir_adicao_id=adicao.id)
    if "armazen_id" in data or "quantidade" in data:
        _validar_capacidade_armazen(db, usuario.id, armazen_id, quantidade, excluir_adicao_id=adicao.id)
    for k, v in data.items():
        setattr(adicao, k, v)
    db.commit()
    db.refresh(adicao)
    return adicao


@router.delete("/{adicao_id}", status_code=204)
def excluir(
    adicao_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    adicao = (
        db.query(Adicao)
        .filter(
            Adicao.id == adicao_id,
            Adicao.usuario_id == usuario.id,
            _nao_deletado_adicao(),
        )
        .first()
    )
    if not adicao:
        raise HTTPException(status_code=404, detail="Adição não encontrada")
    adicao.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return None
