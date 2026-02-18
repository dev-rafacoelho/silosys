"""
Migração: adiciona coluna armazen_id em adicoes e retiradas (e created_at se faltar).
Execute uma vez: python -m migrate_add_armazen_id
"""
import os
import sys

try:
    from sqlalchemy import text
    from sqlalchemy import create_engine
except ImportError:
    print("Instale sqlalchemy: pip install sqlalchemy psycopg2-binary")
    sys.exit(1)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:3cfc346134c70b9ff5ce@147.93.8.33:5433/linkedin?sslmode=disable",
)


def column_exists(engine, table: str, column: str) -> bool:
    with engine.connect() as conn:
        r = conn.execute(
            text(
                """
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = :t AND column_name = :c
            """
            ),
            {"t": table, "c": column},
        )
        return r.scalar() is not None


def main():
    engine = create_engine(DATABASE_URL)
    with engine.begin() as conn:
        if not column_exists(engine, "adicoes", "armazen_id"):
            print("Adicionando adicoes.armazen_id...")
            conn.execute(
                text(
                    "ALTER TABLE adicoes ADD COLUMN armazen_id INTEGER REFERENCES armazens(id)"
                )
            )
            print("  ok")
        else:
            print("adicoes.armazen_id já existe")

        if not column_exists(engine, "retiradas", "armazen_id"):
            print("Adicionando retiradas.armazen_id...")
            conn.execute(
                text(
                    "ALTER TABLE retiradas ADD COLUMN armazen_id INTEGER REFERENCES armazens(id)"
                )
            )
            print("  ok")
        else:
            print("retiradas.armazen_id já existe")

        if not column_exists(engine, "adicoes", "created_at"):
            print("Adicionando adicoes.created_at...")
            conn.execute(
                text(
                    "ALTER TABLE adicoes ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL"
                )
            )
            print("  ok")
        else:
            print("adicoes.created_at já existe")

        if not column_exists(engine, "retiradas", "created_at"):
            print("Adicionando retiradas.created_at...")
            conn.execute(
                text(
                    "ALTER TABLE retiradas ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL"
                )
            )
            print("  ok")
        else:
            print("retiradas.created_at já existe")

    print("Migração concluída.")


if __name__ == "__main__":
    main()
