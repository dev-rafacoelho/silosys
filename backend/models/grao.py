from sqlalchemy import Column, Integer, Text

from models.usuario import Base


class Grao(Base):
    __tablename__ = "graos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(Text, nullable=False)
