from datetime import date, datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models.adicao import Adicao
from models.armazen import Armazen
from models.grao import Grao
from models.retirada import Retirada
from models.talhao import Talhao
from models.usuario import Usuario
from routers.auth import get_current_user
from schemas.relatorio import (
    EstoqueArmazemItem,
    MovimentacaoItem,
    MovimentacoesResponse,
    ProducaoGraoItem,
    ProdutividadeTalhaoItem,
)

router = APIRouter(prefix="/relatorios", tags=["Relatórios"])

KG_POR_SACA = 60

# Quantidade líquida agronômica (desconta umidade/impurezas): peso_bruto - tara - desconto.
_QTD_LIQUIDA = Adicao.peso_bruto - Adicao.tara - func.coalesce(Adicao.desconto, 0)
# Quantidade líquida operacional (coerente com estoque): peso_bruto - tara.
_QTD_OPERACIONAL = Adicao.peso_bruto - Adicao.tara


def _sacas(kg: int) -> float:
    return round(kg / KG_POR_SACA, 2)


def _aplicar_periodo(query, coluna, inicio: date | None, fim: date | None):
    if inicio is not None:
        ini = datetime.combine(inicio, time.min, tzinfo=timezone.utc)
        query = query.filter(coluna >= ini)
    if fim is not None:
        # fim inclusivo: tudo antes do início do dia seguinte
        limite = datetime.combine(fim + timedelta(days=1), time.min, tzinfo=timezone.utc)
        query = query.filter(coluna < limite)
    return query


@router.get("/produtividade-talhao", response_model=list[ProdutividadeTalhaoItem])
def produtividade_talhao(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
    inicio: date | None = Query(None),
    fim: date | None = Query(None),
):
    talhoes = db.query(Talhao).order_by(Talhao.nome).all()
    itens: list[ProdutividadeTalhaoItem] = []
    for t in talhoes:
        q = db.query(func.coalesce(func.sum(_QTD_LIQUIDA), 0)).filter(
            Adicao.talhao_id == t.id,
            Adicao.usuario_id == usuario.id,
            Adicao.deleted_at.is_(None),
        )
        q = _aplicar_periodo(q, Adicao.created_at, inicio, fim)
        kg = max(0, int(q.scalar() or 0))
        sacas = _sacas(kg)
        tamanho = float(t.tamanho_hectares) if t.tamanho_hectares else None
        media = round(sacas / tamanho, 2) if tamanho and tamanho > 0 else None
        itens.append(
            ProdutividadeTalhaoItem(
                id=t.id,
                nome=t.nome,
                tamanho_hectares=tamanho,
                kg=kg,
                sacas=sacas,
                media_sc_ha=media,
            )
        )
    itens.sort(key=lambda i: (i.media_sc_ha is None, -(i.media_sc_ha or 0)))
    return itens


@router.get("/producao-grao", response_model=list[ProducaoGraoItem])
def producao_grao(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
    inicio: date | None = Query(None),
    fim: date | None = Query(None),
):
    q = (
        db.query(
            Grao.id,
            Grao.nome,
            func.coalesce(func.sum(_QTD_LIQUIDA), 0).label("kg"),
        )
        .join(Adicao, Adicao.grao_id == Grao.id)
        .filter(Adicao.usuario_id == usuario.id, Adicao.deleted_at.is_(None))
        .group_by(Grao.id, Grao.nome)
        .order_by(func.coalesce(func.sum(_QTD_LIQUIDA), 0).desc())
    )
    q = _aplicar_periodo(q, Adicao.created_at, inicio, fim)
    itens = []
    for grao_id, nome, kg in q.all():
        kg = max(0, int(kg or 0))
        itens.append(ProducaoGraoItem(grao_id=grao_id, nome=nome, kg=kg, sacas=_sacas(kg)))
    return itens


@router.get("/estoque-armazem", response_model=list[EstoqueArmazemItem])
def estoque_armazem(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    armazens = (
        db.query(Armazen)
        .filter(Armazen.usuario_id == usuario.id, Armazen.deleted_at.is_(None))
        .order_by(Armazen.nome)
        .all()
    )
    itens: list[EstoqueArmazemItem] = []
    for a in armazens:
        entrada = int(
            db.query(func.coalesce(func.sum(_QTD_OPERACIONAL), 0))
            .filter(Adicao.armazen_id == a.id, Adicao.deleted_at.is_(None))
            .scalar()
            or 0
        )
        saida = int(
            db.query(
                func.coalesce(func.sum(Retirada.peso_bruto - func.coalesce(Retirada.tara, 0)), 0)
            )
            .filter(Retirada.armazen_id == a.id, Retirada.deleted_at.is_(None))
            .scalar()
            or 0
        )
        estoque = max(0, entrada - saida)
        ocupacao = round(min(100.0, estoque / a.capacidade * 100), 1) if a.capacidade else 0.0
        graos = {
            g[0]
            for g in db.query(Adicao.grao_id)
            .filter(Adicao.armazen_id == a.id, Adicao.deleted_at.is_(None))
            .distinct()
            .all()
        }
        grao_nome = None
        if len(graos) == 1:
            g = db.query(Grao).filter(Grao.id == next(iter(graos))).first()
            grao_nome = g.nome if g else None
        itens.append(
            EstoqueArmazemItem(
                id=a.id,
                nome=a.nome,
                capacidade=a.capacidade,
                estoque=estoque,
                ocupacao_pct=ocupacao,
                grao_nome=grao_nome,
            )
        )
    return itens


@router.get("/movimentacoes", response_model=MovimentacoesResponse)
def movimentacoes(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
    inicio: date | None = Query(None),
    fim: date | None = Query(None),
):
    q_ad = (
        db.query(Adicao)
        .filter(Adicao.usuario_id == usuario.id, Adicao.deleted_at.is_(None))
        .order_by(Adicao.created_at.desc())
    )
    q_ad = _aplicar_periodo(q_ad, Adicao.created_at, inicio, fim)
    entradas: list[MovimentacaoItem] = []
    total_entradas = 0
    for a in q_ad.all():
        qtd = max(0, (a.peso_bruto or 0) - (a.tara or 0))
        total_entradas += qtd
        entradas.append(
            MovimentacaoItem(
                id=a.id,
                data=a.created_at.date().isoformat() if a.created_at else "",
                grao=a.grao_nome,
                armazen=a.armazen.nome if a.armazen else "",
                talhao=a.talhao_nome or None,
                quantidade=qtd,
            )
        )

    q_ret = (
        db.query(Retirada)
        .filter(Retirada.usuario_id == usuario.id, Retirada.deleted_at.is_(None))
        .order_by(Retirada.created_at.desc())
    )
    q_ret = _aplicar_periodo(q_ret, Retirada.created_at, inicio, fim)
    saidas: list[MovimentacaoItem] = []
    total_saidas = 0
    for r in q_ret.all():
        qtd = max(0, (r.peso_bruto or 0) - (r.tara or 0))
        total_saidas += qtd
        saidas.append(
            MovimentacaoItem(
                id=r.id,
                data=r.created_at.date().isoformat() if r.created_at else "",
                grao=r.grao_nome,
                armazen=r.armazen.nome if r.armazen else "",
                talhao=None,
                quantidade=qtd,
            )
        )

    return MovimentacoesResponse(
        entradas=entradas,
        saidas=saidas,
        total_entradas=total_entradas,
        total_saidas=total_saidas,
    )
