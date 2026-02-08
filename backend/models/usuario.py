from sqlalchemy import Column, Integer, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Usuario(Base):
    
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(Text, nullable=False)
    foto_perfil = Column(Text, nullable=True)
    email = Column(Text, nullable=False, unique=True)
    hash_senha = Column(Text, nullable=False)
