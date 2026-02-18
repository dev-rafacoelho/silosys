from sqlalchemy.orm import sessionmaker

from models.grao import Grao
from models.talhao import Talhao

GRAOS_PADRAO = ["milho", "soja", "milheto"]
TALHOES_PADRAO = ["Talhão 1", "Talhão 2", "Talhão 3"]


def seed_graos(engine):
    Session = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = Session()
    try:
        for nome in GRAOS_PADRAO:
            existe = session.query(Grao).filter(Grao.nome == nome).first()
            if not existe:
                session.add(Grao(nome=nome))
        session.commit()
    finally:
        session.close()


def seed_talhoes(engine):
    Session = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = Session()
    try:
        for nome in TALHOES_PADRAO:
            existe = session.query(Talhao).filter(Talhao.nome == nome).first()
            if not existe:
                session.add(Talhao(nome=nome))
        session.commit()
    finally:
        session.close()
