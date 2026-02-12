from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text

from models.usuario import Base


class Armazen(Base):
    __tablename__ = "armazens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    capacidade = Column(Integer, nullable=False)
    nome = Column(Text, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
