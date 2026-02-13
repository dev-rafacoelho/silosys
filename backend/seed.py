from sqlalchemy.orm import sessionmaker

from models.grao import Grao

GRAOS_PADRAO = ["milho", "soja", "milheto"]


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
