import os


class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sua-chave-secreta-altere-em-producao")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7


settings = Settings()
