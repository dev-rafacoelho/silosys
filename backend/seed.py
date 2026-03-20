from sqlalchemy.orm import sessionmaker

from models.grao import Grao
from models.talhao import Talhao
from models.usuario import Usuario
from auth import hash_senha

USUARIO_PADRAO = {
    "nome": "Admin",
    "email": "admin@silosys.com",
    "senha": "admin123",
}

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


def seed_usuario_padrao(engine):
    Session = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = Session()
    try:
        existe = session.query(Usuario).filter(Usuario.email == USUARIO_PADRAO["email"]).first()
        if not existe:
            session.add(Usuario(
                nome=USUARIO_PADRAO["nome"],
                email=USUARIO_PADRAO["email"],
                hash_senha=hash_senha(USUARIO_PADRAO["senha"]),
            ))
            session.commit()
    finally:
        session.close()
