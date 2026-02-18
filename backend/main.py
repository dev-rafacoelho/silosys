from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers.adicoes import router as adicoes_router
from routers.armazens import router as armazens_router
from routers.auth import router as auth_router
from routers.contratos import router as contratos_router
from routers.graos import router as graos_router
from routers.retiradas import router as retiradas_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="SiloSys API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(adicoes_router)
app.include_router(auth_router)
app.include_router(armazens_router)
app.include_router(contratos_router)
app.include_router(graos_router)
app.include_router(retiradas_router)