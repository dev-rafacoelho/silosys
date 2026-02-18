from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from models.usuario import Base


class Retirada(Base):
    __tablename__ = "retiradas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    armazen_id = Column(Integer, ForeignKey("armazens.id"), nullable=False)
    grao_id = Column(Integer, ForeignKey("graos.id"), nullable=False)
    contrato_id = Column(Integer, ForeignKey("contratos.id"), nullable=True)
    placa = Column(Text, nullable=True)
    tara = Column(Integer, nullable=True)
    peso_bruto = Column(Integer, nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    armazen = relationship("Armazen", lazy="joined")
    grao = relationship("Grao", lazy="joined")
    contrato = relationship("Contrato", lazy="joined")

    @property
    def grao_nome(self) -> str:
        return self.grao.nome if self.grao else ""
