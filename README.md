# Kevin Hussein Tattoo Studio

Sistema profissional de agendamentos para estúdio de tatuagem.

## Arquitetura

```
tattoo-studio/
├── src/                    # Frontend React
│   ├── components/         # Componentes reutilizáveis
│   │   ├── ui/            # UI Kit (Button, Card, Spinner...)
│   │   ├── AdminLayout.tsx
│   │   └── ...
│   ├── contexts/          # React Contexts
│   │   └── AuthContext.tsx
│   ├── hooks/             # Custom Hooks
│   │   ├── useAuth.ts
│   │   ├── useBookings.ts
│   │   ├── useSlots.ts
│   │   └── useWhatsApp.ts
│   ├── pages/             # Páginas da aplicação
│   │   ├── admin/         # Painel administrativo
│   │   └── ...            # Páginas públicas
│   ├── services/          # Cliente da API
│   │   └── api.ts
│   └── App.tsx            # Rotas principais
│
├── server/                 # Backend Node.js
│   ├── src/
│   │   ├── config/        # Configurações (DB, env)
│   │   ├── middleware/    # JWT, error handler, validation
│   │   ├── models/        # Models SQLite
│   │   ├── routes/        # Rotas da API
│   │   └── services/      # WhatsApp, scheduler
│   ├── data/              # Banco SQLite
│   └── index.js           # Entry point
│
├── docker-compose.yml     # Orquestração Docker
├── Dockerfile.frontend    # Build frontend
└── nginx/                 # Configuração Nginx
```

## Tecnologias

### Frontend
- React 18 + TypeScript
- Vite 5
- TailwindCSS
- Framer Motion
- date-fns

### Backend
- Node.js + Express
- SQLite (better-sqlite3)
- JWT (jsonwebtoken)
- Baileys (WhatsApp Web API)
- Zod (validação)
- node-cron (agendamento)

## Instalação

### Desenvolvimento Local

```bash
# Frontend
npm install
npm run dev

# Backend (em outro terminal)
cd server
npm install
npm start
```

### Variáveis de Ambiente

**Frontend (.env)**
```
VITE_API_URL=http://localhost:3001/api
```

**Backend (server/.env)**
```
PORT=3001
JWT_SECRET=seu_secret_jwt_aqui
JWT_REFRESH_SECRET=seu_refresh_secret_aqui
ADMIN_USERNAME=kevin
ADMIN_PASSWORD=2026
```

## Scripts

```bash
# Frontend
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run preview      # Preview build

# Backend
cd server
npm start            # Inicia servidor
```

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Login admin
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dados do usuário

### Agendamentos
- `GET /api/bookings` - Listar agendamentos
- `GET /api/bookings/:id` - Detalhes
- `GET /api/bookings/cpf/:cpf` - Buscar por CPF (público)
- `POST /api/bookings` - Criar (público)
- `PATCH /api/bookings/:id/status` - Atualizar status

### Slots (Vagas)
- `GET /api/slots` - Listar slots
- `GET /api/slots/available/:date` - Disponíveis por data (público)
- `POST /api/slots` - Criar
- `POST /api/slots/bulk` - Criar múltiplos
- `DELETE /api/slots/:id` - Remover

### Clientes
- `GET /api/clients` - Listar
- `GET /api/clients/cpf/:cpf` - Buscar por CPF

### WhatsApp
- `GET /api/whatsapp/status` - Status conexão
- `POST /api/whatsapp/connect` - Conectar
- `POST /api/whatsapp/send` - Enviar mensagem

## Credenciais Padrão

```
Usuário: kevin
Senha: 2026
```

## Deploy com Docker

```bash
# Build e iniciar
docker-compose up -d

# Parar
docker-compose down
```

## Licença

MIT
