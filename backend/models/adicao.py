from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from models.usuario import Base


class Adicao(Base):
    __tablename__ = "adicoes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    armazen_id = Column(Integer, ForeignKey("armazens.id"), nullable=False)
    grao_id = Column(Integer, ForeignKey("graos.id"), nullable=False)
    quantidade = Column(Integer, nullable=False)
    placa = Column(Text, nullable=True)
    umidade = Column(Integer, nullable=True)
    tara = Column(Integer, nullable=True)
    peso_bruto = Column(Integer, nullable=True)
    desconto = Column(Integer, nullable=True)
    talhao_id = Column(Integer, ForeignKey("talhoes.id"), nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    armazen = relationship("Armazen", lazy="joined")
    grao = relationship("Grao", lazy="joined")
    talhao = relationship("Talhao", lazy="joined")

    @property
    def grao_nome(self) -> str:
        return self.grao.nome if self.grao else ""

    @property
    def talhao_nome(self) -> str:
        return self.talhao.nome if self.talhao else ""
