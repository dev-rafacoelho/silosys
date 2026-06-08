# Talhões: CRUD + tamanho em hectares + média sc/ha

Data: 2026-06-08

## Objetivo

Permitir gerenciar talhões (criar/editar/excluir) com um campo de **tamanho em hectares** e
exibir a **produtividade média em sacas por hectare (sc/ha)** de cada talhão, calculada a partir
das adições (entradas de grão) já vinculadas a ele.

## Contexto atual

- `Talhao` (`backend/models/talhao.py`) tem apenas `id` e `nome`. Criado via seed (Talhão 1/2/3).
- Não existe router, schema nem tela para talhão. Na tela de Movimentações o `talhao_id` é
  digitado como número à mão.
- Cada `Adicao` referencia `talhao_id` (FK opcional) e guarda `peso_bruto`, `tara`, `desconto`.
- Padrão de CRUD do projeto: router + schema + soft-delete (`deleted_at`) + tela com `Modal`
  (ex.: Armazéns). Auth via `Depends(get_current_user)`.

## Decisões

- **Saca = 60 kg** (padrão soja/milho/milheto).
- **Quantidade líquida por adição** = `peso_bruto − tara − desconto` (desconto nulo = 0).
  Decisão do usuário: descontar também o `desconto`.
- **Excluir talhão**: bloquear (HTTP 400) se houver adições não-deletadas vinculadas. Preserva
  histórico — requisito "caso não for interferir em nada".
- **Escopo**: somente website (Next.js). Mobile (Flutter) fora de escopo.
- Talhões permanecem globais (não filtrados por usuário), como hoje no seed e no `_validar_talhao`.

## Backend

1. `models/talhao.py`: adicionar `tamanho_hectares = Column(Numeric, nullable=True)`.
   `Base.metadata.create_all` cria a coluna em bancos novos; para o banco existente a coluna é
   adicionada via `ALTER TABLE` (migração manual pontual, ver Notas).
2. `schemas/talhao.py`:
   - `TalhaoCreate`: `nome: str (min_length 1)`, `tamanho_hectares: float | None (gt 0)`.
   - `TalhaoUpdate`: ambos opcionais.
   - `TalhaoResponse`: `id`, `nome`, `tamanho_hectares`, `media_sc_ha: float | None`.
3. `routers/talhao.py` (prefix `/talhoes`), todos com `get_current_user`:
   - `GET ""` — lista talhões, cada um com `media_sc_ha` calculada.
   - `POST ""` — cria.
   - `PATCH "/{id}"` — edita (parcial).
   - `DELETE "/{id}"` — bloqueia se houver adições vinculadas; senão remove (hard delete; tabela
     não tem `deleted_at` e é um cadastro simples).
   - Cálculo: `media = ((Σ(peso_bruto − tara − coalesce(desconto,0)) das adições não-deletadas do
     talhão) / 60) / tamanho_hectares`. Se `tamanho_hectares` nulo/zero → `None`.
4. `main.py`: registrar `talhoes_router`.

## Frontend (website)

5. `lib/talhao.js`: `listarTalhoes`, `criarTalhao`, `atualizarTalhao`, `excluirTalhao`.
6. `app/(dashboard)/talhoes/page.js`: lista em cards/linhas mostrando nome, tamanho (ha) e
   média sc/ha; botão "Adicionar Talhão"; editar e excluir por item; `Modal` para criar/editar.
   Erro de exclusão bloqueada é exibido ao usuário.
7. `components/Sidebar.js`: novo `NAV_ITEM` `{ href: "/talhoes", icon: Plant, label: "Talhões" }`.

## Fora de escopo (follow-up possível)

- Trocar o input numérico de talhão na tela de Movimentações por um select alimentado pelo novo
  `GET /talhoes`.
- Versão mobile (Flutter).

## Notas

- O projeto não possui suíte de testes; segue-se a convenção existente (sem testes novos).
  Verificação: import do app FastAPI sem erro + build/lint do website.
- Banco existente em produção precisa de `ALTER TABLE talhoes ADD COLUMN tamanho_hectares NUMERIC;`
  (executado uma vez), pois `create_all` não altera tabelas já existentes.
