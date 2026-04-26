# Kevin Hussein Tattoo Studio

Sistema de agendamento para estúdio de tatuagem com frontend React, API Express, banco SQLite e integração com WhatsApp.

## Limite do repositório

O repositório Git real é esta pasta `tattoo-studio/`.

Os arquivos existentes na pasta pai do workspace, como `RELATORIO_FALHAS.md`, `IMG_5957.jpeg` e scripts de conveniência fora desta árvore, não fazem parte do versionamento deste projeto e não devem ser tratados como conteúdo do repo.

## Visão geral

O sistema possui duas superfícies principais:

- Portal do cliente para consultar agenda disponível e criar agendamentos.
- Painel administrativo para gerir clientes, slots, mensagens, configurações e status do WhatsApp.

## Stack

- Frontend: React 18, TypeScript, Vite 5, TailwindCSS, Framer Motion, date-fns, Lucide React
- Backend: Node.js, Express, ESM em JavaScript, Zod, JWT, better-sqlite3, Baileys, node-cron, Pino
- Banco: SQLite
- Infra: Docker Compose, Docker multi-stage, Nginx
- Testes: Vitest no frontend e no backend, Supertest no backend

## Desenvolvimento local

### Pré-requisitos

- Node.js 20 LTS
- npm 10+

### Instalação

```bash
npm install
cd server
npm install
cd ..
cp server/.env.example server/.env
```

### Executar em desenvolvimento

Frontend:

```bash
npm run dev
```

Backend:

```bash
cd server
npm run dev
```

Ou ambos em paralelo a partir da raiz do repo:

```bash
npm run start
```

## Produção com Docker

Há dois arquivos de ambiente com propósitos diferentes:

- `.env.example`: variáveis usadas pelo `docker-compose.yml`
- `server/.env.example`: variáveis usadas diretamente pela API Express

Fluxo básico:

```bash
cp .env.example .env
cp server/.env.example server/.env
docker-compose build
docker-compose up -d
```

O guia detalhado de deploy está em `docs/DEPLOY_GUIDE.md`.

## Migrations e backup

Rodar migrations no backend:

```bash
cd server
npm run migrate
npm run migrate:status
npm run migrate:rollback
```

Gerar backup do banco:

```bash
cd server
npm run backup
```

Em ambiente Linux/container, também existe o script shell:

```bash
cd server
./scripts/backup.sh
```

## Testes

Frontend:

```bash
npm test
```

Backend:

```bash
cd server
npm test
```

## Estrutura de pastas

```text
.
├── .github/                  # Workflows e instruções auxiliares
├── docs/                     # Documentação do projeto
├── nginx/                    # Configuração do Nginx
├── public/                   # Assets públicos do frontend
├── scripts/                  # Scripts auxiliares da raiz
├── server/                   # API Express e arquivos do backend
│   ├── migrations/           # Migrations SQLite
│   ├── scripts/              # Backup e CLI de migration
│   ├── src/
│   │   ├── config/           # Ambiente, logger, banco, constantes
│   │   ├── middleware/       # Auth, validação e tratamento de erros
│   │   ├── models/           # Acesso a dados
│   │   ├── routes/           # Rotas HTTP
│   │   └── services/         # Scheduler e WhatsApp
│   └── tests/                # Testes do backend
├── src/                      # Aplicação React
│   ├── components/           # Layout e UI
│   ├── contexts/             # Context providers
│   ├── hooks/                # Hooks do frontend
│   ├── pages/                # Páginas públicas e admin
│   ├── services/             # Cliente HTTP e serviços do frontend
│   └── test/                 # Setup de testes do frontend
├── docker-compose.yml
├── Dockerfile.frontend
├── package.json
└── README.md
```

## Arquivos ignorados pelo Git

O repositório foi padronizado para não versionar artefatos locais e sensíveis, incluindo:

- `node_modules/`
- `dist/`
- `server/data/`
- `server/auth_info_baileys/`
- `server/auth_info_baileys_diag/`
- `server/backups/`
- `.env` e variantes, exceto `.env.example`
- arquivos SQLite temporários `.sqlite-shm` e `.sqlite-wal`

## Documentação disponível

- `docs/DEPLOY_GUIDE.md`: deploy e operação
- `docs/DESIGN_SYSTEM.md`: diretrizes visuais já usadas no frontend
- `docs/EMAIL_EVALUATION.md`: análise exploratória para canal de e-mail, ainda fora do escopo atual
- `docs/README.md`: índice e status da documentação

## Licença

Software proprietário desenvolvido sob encomenda para Kevin Hussein.
