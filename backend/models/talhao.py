from sqlalchemy import Column, Integer, Text

from models.usuario import Base


class Talhao(Base):
    __tablename__ = "talhoes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(Text, nullable=False)
