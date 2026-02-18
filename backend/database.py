import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.adicao import Adicao
from models.armazen import Armazen
from models.contrato import Contrato
from models.grao import Grao
from models.retirada import Retirada
from models.talhao import Talhao
from models.usuario import Base

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:3cfc346134c70b9ff5ce@147.93.8.33:5433/linkedin?sslmode=disable",
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    _ = Adicao, Armazen, Contrato, Grao, Retirada, Talhao
    Base.metadata.create_all(bind=engine)
    from seed import seed_graos, seed_talhoes
    seed_graos(engine)
    seed_talhoes(engine)
