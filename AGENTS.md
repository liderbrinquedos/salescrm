# Workflow Global — SalesCRM

## Regra Principal
Antes de qualquer tarefa, consulte `.wiki/INDEX.md` para contexto, padrões e decisões arquiteturais do projeto.

## Workflow Obrigatório
1. **Antes de codar** — Leia `.wiki/INDEX.md`, consulte `.wiki/patterns/` e `.wiki/decisions/`
2. **Durante** — Siga padrões em `.wiki/patterns/`, busque com `rg`, mantenha a estrutura de componentes e estado existente
3. **Após decisões importantes** — Crie ADR em `.wiki/decisions/` usando `.wiki/templates/decision-template.md`, atualize `.wiki/INDEX.md`
4. **Ao criar novos padrões** — Documente em `.wiki/patterns/` usando `.wiki/templates/pattern-template.md`, atualize `.wiki/INDEX.md`

## Ferramentas de Busca
- Use `rg` ao invés de `grep` ou `find` para buscas mais rápidas
- Comandos: `rg "termo" .`, `rg -tpy "funcao" .`, `rg -C3 "contexto" .`

## Skills — Quando Carregar

| Skill | Quando usar |
|---|---|
| `brainstorming` | Antes de criar features, componentes, modificar comportamento |
| `frontend-design` | Criar/refinar interfaces, CSS, componentes visuais, páginas |
| `react-best-practices` | Otimização React/Next.js, performance |

## Padrões do Projeto
- `[[patterns/component-structure]]` — Estrutura de componentes Next.js (UI em `src/components/ui/`)
- `[[patterns/business-rules-engine]]` — Motor de Regras de Negócio (`src/lib/business-rules/`)
- `[[patterns/checkout-flow]]` — Fluxo de checkout Sheet com etapas cart → order

## Convenções
- Links wiki: `[[nome-do-arquivo]]` (sem extensão `.md`)
- ADRs numerados: `001-titulo.md` em `.wiki/decisions/`
- Tudo em markdown, sem emojis
- Idioma: português
- Estado global com Zustand (`src/store/`)
- API routes em `src/app/api/` com Prisma + SQLite
- Build: `npm run build` (Next.js standalone + Docker)
- Banco SQLite em `db/custom.db`
