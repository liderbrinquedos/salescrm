# Conferencia NF-e — Contexto do Projeto

## Visao Geral

Sistema de conferencia de notas fiscais (NF-e) para verificacao de mercadorias recebidas. O operador le codigos de barras (EAN13/EAN14) dos produtos e o sistema compara com os itens da nota fiscal, indicando conferidos, faltas e excessos em tempo real.

## Stack

| Componente | Tecnologia |
|---|---|
| Frontend | Vue 3 + TypeScript + Tailwind CSS |
| Estado | Pinia (stores: auth, conferencia) |
| Roteamento | Vue Router |
| Backend | Express + TypeScript |
| Banco de dados | SQLite via sql.js (in-memory, persistido em arquivo) |
| Auth | JWT + bcrypt |
| Container | Docker Compose (Nginx + Node) |
| Tema | Clean Tech / Precision Minimalism (ADR-001) |

## Tema

Clean Tech / Precision Minimalism — padrao visual do projeto mwms (ver [[decisions/001-frontend-mwms-pattern]]).

- Fonte display: Sora (Google Fonts)
- Fonte corpo: SF Pro Text / system-ui
- Paleta light: bg #f5f5f7, accent #0071e3, text #1d1d1f
- Paleta dark: bg #1d1d1f, accent #0071e3, text #f5f5f7
- Dark mode via `data-theme="dark"` no `<html>`

## Estrutura do Projeto

```
conferencia/
├── docker-compose.yml
├── test-data/
│   ├── produtos-test.xlsx        # Dados de teste para importacao
│   └── notas-test.xlsx           # Dados de teste para importacao
├── .wiki/                        # Documentacao do projeto
│   ├── INDEX.md
│   ├── decisions/
│   ├── architecture/
│   ├── patterns/
│   ├── projects/
│   ├── integrations/
│   └── snippets/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Entry point Express
│   │   ├── seed.ts               # Seed usuario admin
│   │   ├── db/
│   │   │   ├── index.ts          # Helpers query/run/save
│   │   │   ├── schema.sql        # Schema SQLite
│   │   │   └── types/
│   │   │       └── sql.js.d.ts   # Tipos para sql.js
│   │   └── routes/
│   │       ├── auth.ts           # Login + CRUD usuarios (admin)
│   │       ├── produtos.ts       # List + import xlsx
│   │       ├── notas.ts          # List + get + import xlsx
│   │       ├── conferencias.ts   # List com leituras
│   │       ├── locks.ts          # Check/acquire/release lock
│   │       ├── sync.ts           # Sync leituras + finalizar
│   │       └── reports.ts        # List + export json/xlsx
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue               # Header + theme toggle + settings
│   │   ├── router/index.ts
│   │   ├── services/api.ts       # HTTP client
│   │   ├── stores/
│   │   │   ├── auth.ts           # Token + user
│   │   │   └── conferencia.ts    # Itens + leituras + status
│   │   ├── views/
│   │   │   ├── LoginView.vue
│   │   │   ├── HomeView.vue      # Dashboard + stats + lista notas
│   │   │   └── ConferenceView.vue # Leitura de codigo de barras
│   │   ├── components/
│   │   │   ├── ImportModal.vue
│   │   │   └── SettingsModal.vue  # Admin: import/export/usuarios
│   │   └── assets/main.css       # Tema Clean Tech (mwms)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── nginx.conf
│   └── Dockerfile
└── docker-compose.yml
```

## Funcionalidades

- Login com usuario/senha (JWT)
- Dashboard com stats (total, pendentes, conferidas)
- Importacao de notas fiscais via .xlsx (admin)
- Importacao de catalogo de produtos via .xlsx (admin)
- Conferencia por leitura de codigo de barras (EAN13/EAN14)
- Lock de nota para evitar concorrencia entre operadores
- Status em tempo real: pendente, parcial, conferido, excesso
- Finalizacao de conferencia com sync para backend
- Exportacao de relatorio de conferencias em .xlsx (admin)
- Gerenciamento de usuarios (admin)
- Tema dark/light
- Padrao visual Clean Tech (mwms)

## Permissoes

| Acao | Admin | Operador |
|---|---|---|
| Login | Sim | Sim |
| Ver dashboard | Sim | Sim |
| Conferir notas | Sim | Sim |
| Importar produtos | Sim | Nao |
| Importar notas | Sim | Nao |
| Exportar relatorio | Sim | Nao |
| Gerenciar usuarios | Sim | Nao |

## Portas

- Frontend: `:80` (exposta)
- Backend: `:3001` (exposta + proxy via Nginx `/api`)

## Comandos

```bash
# Docker (producao)
docker compose up -d           # Iniciar
docker compose down            # Parar
docker compose up -d --build   # Reconstruir e iniciar

# Credenciais padrao
Usuario: admin
Senha: admin123

# Test data
test-data/produtos-test.xlsx   # 10 produtos
test-data/notas-test.xlsx      # 3 notas, 10 itens
```

## Fluxo de Uso

1. Admin faz login com `admin`/`admin123`
2. Abre Settings (⚙) e importa catalogo de produtos (.xlsx)
3. Importa notas fiscais (.xlsx)
4. Operador faz login e ve lista de notas pendentes
5. Clica numa nota para iniciar conferencia
6. Le codigos de barras com scanner
7. Sistema mostra progresso: OK / Falta / Excesso
8. Quando tudo conferido, clica "Finalizar"
9. Admin exporta relatorio em .xlsx
