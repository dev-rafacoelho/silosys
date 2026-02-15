from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.grao import Grao
from routers.auth import get_current_user
from schemas.grao import GraoResponse

router = APIRouter(prefix="/graos", tags=["Grãos"])


@router.get("", response_model=list[GraoResponse])
def listar(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Grao).order_by(Grao.nome).all()
