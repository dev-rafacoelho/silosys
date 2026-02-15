from datetime import datetime, timezone

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from models.usuario import Base


class Contrato(Base):
    __tablename__ = "contratos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    empresa = Column(Text, nullable=False)
    grao_id = Column(Integer, ForeignKey("graos.id"), nullable=False)
    vencimento = Column(Date, nullable=False)
    valor = Column(Integer, nullable=False)
    data_pagamento = Column(Date, nullable=True)
    quantidade = Column(Integer, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    grao = relationship("Grao", lazy="joined")

    @property
    def grao_nome(self) -> str:
        return self.grao.nome if self.grao else ""
