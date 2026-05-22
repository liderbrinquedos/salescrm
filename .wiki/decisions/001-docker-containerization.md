# ADR-001: Docker Containerization — Use Node.js no build em vez de Bun

> **Data:** 2026-05-21  
> **Status:** accepted  
> **Autor:** equipe SalesCRM

## Contexto

O projeto SalesCRM é uma aplicação Next.js 16 + Prisma + SQLite. Inicialmente tentamos dockerizar usando:

- Multi-stage com `oven/bun:1.1` para instalar dependências e build.
- `bun.lock` presente no repositório.

Erros ocorreram:
1. `InvalidLockfileVersion` — o lockfile do Bun (v1) não é compatível com a versão da imagem `oven/bun:1.1` no ambiente de build.
2. `ChunkLoadError` / `SyntaxError` durante `bun run build` — Next.js/Turbopack encontra problemas de sintaxe ao rodar no runtime do Bun.

Objetivo: ter uma imagem Docker de produção estável, com build reproduzível e container leve.

## Decisão

Adotar **apenas Node.js 20 Alpine** para todas as etapas (deps, builder, runner). Detalhes:

- **Stage deps**: `node:20-alpine`, copiar `package.json` (e `bun.lock` ignorado) e rodar `npm install`.
- **Stage builder**: 
  - Copiar `node_modules` do stage anterior.
  - Copiar código-fonte.
  - Gerar Prisma Client via `npx prisma generate`.
  - Build do Next.js via `npx next build`.
  - Copiar estáticos conforme script de build original.
- **Stage runner**: 
  - `node:20-alpine` minimal.
  - Copiar saída standalone e estáticos.
  - Criar usuário não-root (`nextjs`).
  - Volume para `/app/db` (SQLite persistido fora do container).
  - `CMD ["node", "server.js"]`.

Variável de ambiente `DATABASE_URL` será definida no `docker-compose.yml` como `file:/app/db/custom.db`.

Build multiplataforma; container final ~150–200 MB.

## Alternativas Consideradas

| Alternativa | Prós | Contras |
|------------|------|---------|
| Bun para instalar + Node para build | Aproveita lockfile do Bun, evita erro de build | Lockfile incompatível ainda impede instalação; mistura de ferramentas |
| Bun latest e manter tudo no Bun | Aborda problema do lockfile com versão mais recente | Turbopack/Next.js no Bun ainda instável; risco de novos erros |
| NPM apenas + `package-lock.json` | Padrão do ecossistema Node; lockfile estável | Gera novo lockfile, diverge do `bun.lock` (mas não afeta runtime) |

## Consequências

- **Positivas**:
  - Build estável e previsível com ferramentas amplamente suportadas.
  - Elimina dependência do Bun em produção.
  - Fácil debug e manutenção (Node oficial).
  - Compatibilidade total com Prisma e Next.js.

- **Negativas**:
  - Desalinhamento com o ambiente de desenvolvimento local (que usa Bun). Desenvolvedores devem garantir que as versões das dependências no `package.json` sejam compatíveis com npm.
  - `bun.lock` deixa de ser usado no CI/Docker; pode-se removê-lo do repo ou ignorá-lo.

- **Código**:
  - Dockerfile simplificado, sem necessidade de `oven/bun`.
  - `docker-compose.yml` mapeia porta 3080:3000 e volume `sqlite-data:/app/db`.

## Links Relacionados

- [[../patterns/component-structure]] — Organização de componentes/rotas após refatoração.
- `Dockerfile` (raiz)
- `docker-compose.yml` (raiz)
- [[../../.wiki/patterns/frontend-standards]] — Padrão visual adotado
