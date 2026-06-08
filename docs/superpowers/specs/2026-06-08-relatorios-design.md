# Aba Relatórios

Data: 2026-06-08

## Objetivo

Aba "Relatórios" no menu lateral da web para extrair relatórios operacionais/agronômicos,
com filtro por período e exportação CSV.

## Escopo (decidido com o usuário)

Relatórios da v1: **produtividade por talhão**, **produção por grão**, **estoque por armazém**,
**movimentações por período**. Consumo: **tela + exportar**. **Com filtro de datas** (início/fim).

## Decisões

- Sem biblioteca de gráficos (nenhuma instalada): usar tabelas + barras CSS, como já existe no app.
- Exportação: **CSV gerado no cliente** (separador `;`, BOM UTF-8 p/ Excel pt-BR). Sem dependências
  novas. PDF fica como follow-up.
- Período: `inicio`/`fim` opcionais (vazio = acumulado). Filtra `created_at` de adições/retiradas
  (`fim` inclusivo: `created_at < fim + 1 dia`).
- Estoque por armazém é **snapshot atual** (não usa período) — rotulado como "estoque atual".
- Dados de fluxo escopados ao **usuário logado** (`usuario_id`), como nas telas existentes.
- Saca = 60 kg. Produtividade/produção subtraem `desconto` (kg = peso_bruto − tara − desconto),
  coerente com a tela de Talhões. Movimentações usam líquido operacional (peso_bruto − tara),
  coerente com o cálculo de estoque.

## Backend

`routers/relatorios.py` (prefix `/relatorios`, todos com `get_current_user`); `schemas/relatorio.py`.

- `GET /produtividade-talhao?inicio&fim` → por talhão: `{id, nome, tamanho_hectares, kg, sacas,
  media_sc_ha}` (média = sacas/ha; None se sem tamanho). Ordenado por média desc.
- `GET /producao-grao?inicio&fim` → por grão: `{grao_id, nome, kg, sacas}`.
- `GET /estoque-armazem` → por armazém: `{id, nome, capacidade, estoque, ocupacao_pct, grao_nome}`.
- `GET /movimentacoes?inicio&fim` → `{entradas:[{data, grao, armazen, talhao, quantidade}],
  saidas:[{data, grao, armazen, quantidade}], total_entradas, total_saidas}`.
- Registrar router no `main.py`.

## Frontend (website)

- `lib/relatorio.js`: chamadas aos 4 endpoints + `exportarCSV(nome, colunas, linhas)`.
- `app/(dashboard)/relatorios/page.js`: filtro de datas no topo (início/fim + Aplicar/Limpar),
  abas para os 4 relatórios, cada um com tabela (+ barras onde fizer sentido) e botão Exportar CSV.
- `components/Sidebar.js`: novo item `{ href:"/relatorios", icon: ChartBar, label:"Relatórios" }`.

## Fora de escopo

- PDF, gráficos avançados, agendamento de relatórios, versão mobile.

## Verificação

- Backend importa + smoke test dos agregadores contra o banco real (read-only).
- ESLint dos arquivos novos/alterados.
