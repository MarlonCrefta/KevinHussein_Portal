# Kevin Hussein Tattoo Studio

> Sistema de gestão e agendamentos para o estúdio de tatuagem de Kevin Hussein.  
> Desenvolvido por **Marlon Crefta** sob encomenda.

---

## Visão Geral

Portal completo com duas interfaces:

- **Portal do Cliente** — Agendamento online em 3 etapas (Reunião → Teste Anatômico → Sessão), consulta de agendamentos por CPF
- **Painel Admin** — Dashboard semanal, gestão de agendamentos/clientes/slots, configurações, integração WhatsApp

### Cronograma Fixo do Estúdio

| Dia | Atividade | Duração | Horários |
|-----|-----------|---------|----------|
| Terça | Teste Anatômico | 2h | 10h, 12h, 14h, 16h, 18h |
| Quarta | Reunião Estratégica | 2h | 10h, 12h, 14h, 16h, 18h |
| Quinta a Domingo | Sessão de Tatuagem | variável | 10h, 12h, 14h, 16h, 18h |
| Segunda | Folga | — | — |

---

## Stack Tecnológica

### Frontend
- **React 18** + TypeScript + Vite 5
- **TailwindCSS** (design system customizado)
- **Framer Motion** (animações)
- **date-fns** (datas em pt-BR)
- **Lucide React** (ícones)
- Code splitting com `React.lazy` + `Suspense`

### Backend
- **Node.js** + **Express** (API RESTful)
- **SQLite** via better-sqlite3 (sem servidor de banco)
- **JWT** (autenticação com refresh token)
- **Baileys** (WhatsApp Web API)
- **Zod** (validação de dados)
- **node-cron** (scheduler de mensagens)
- Rate limiting adaptável (dev/prod)

### Infraestrutura
- **Nginx** (proxy reverso + gzip + cache)
- **PM2** (process manager)
- **Docker** (opcional)
- **Let's Encrypt** (SSL gratuito)

---

## Estrutura do Projeto

```
tattoo-studio/
├── src/                          # Frontend React
│   ├── components/               # Layout, Header, Footer, AdminLayout
│   ├── contexts/                 # AuthContext
│   ├── hooks/                    # useAuth, useBookings, useSlots, useWhatsApp
│   ├── pages/                    # Páginas públicas
│   │   └── admin/                # Painel administrativo (8 páginas)
│   ├── services/                 # api.ts (cliente HTTP + transformações)
│   └── App.tsx                   # Rotas com lazy loading
│
├── server/                       # Backend Node.js
│   ├── src/
│   │   ├── config/               # database.js, env.js
│   │   ├── middleware/           # auth (JWT), errorHandler, validation
│   │   ├── models/               # Booking, Client, Slot, User, MessageTemplate
│   │   ├── routes/               # auth, booking, client, slot, message, whatsapp, settings
│   │   └── services/             # whatsapp.service, scheduler.service
│   ├── data/                     # Banco SQLite (gitignored)
│   └── index.js                  # Entry point
│
├── public/                       # Assets estáticos (logo, imagens)
├── docs/                         # Documentação técnica
│   ├── DEPLOY_GUIDE.md           # Guia completo de deploy no servidor
│   ├── DESIGN_SYSTEM.md          # Tokens de design e paleta
│   └── EMAIL_EVALUATION.md       # Avaliação de comunicação
├── nginx/                        # Config Nginx para produção
├── docker-compose.yml            # Deploy Docker (opcional)
├── LICENSE                       # Licença proprietária
└── README.md                     # Este arquivo
```

---

## Instalação Local (Desenvolvimento)

### Pré-requisitos
- Node.js 18+ (recomendado 20 LTS)
- npm 9+

### Setup

```bash
# 1. Clonar
git clone https://github.com/MarlonCrefta/KevinHussein_Portal.git
cd KevinHussein_Portal

# 2. Frontend
npm install

# 3. Backend
cd server
npm install
cp .env.example .env   # Editar com seus dados
cd ..
```

### Rodar em Desenvolvimento

```bash
# Terminal 1 — Frontend (porta 3000)
npm run dev

# Terminal 2 — Backend (porta 3001)
cd server
npm start
```

### Variáveis de Ambiente

**`server/.env`**
```env
NODE_ENV=development
PORT=3001
HOST=localhost
FRONTEND_URL=http://localhost:3000
JWT_SECRET=dev_secret_aqui
JWT_REFRESH_SECRET=dev_refresh_secret_aqui
ADMIN_USERNAME=kevin
ADMIN_PASSWORD=2026
```

---

## Build para Produção

```bash
npm run build    # Gera dist/ otimizado com code splitting
```

Resultado:
- Chunks separados por vendor (react, framer-motion, date-fns, lucide)
- Minificação com Terser (sem console.log)
- Lazy loading de todas as páginas
- Assets com hash para cache busting

---

## Deploy em Servidor

Consulte o **[Guia de Deploy Completo](docs/DEPLOY_GUIDE.md)** com:
- Setup PM2 + Nginx + SSL
- Configuração de firewall
- Backups automáticos
- Estimativa de consumo (~40 MB RAM idle)
- Troubleshooting

---

## API Endpoints

### Públicos (sem autenticação)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/bookings` | Criar agendamento |
| GET | `/api/bookings/cpf/:cpf` | Buscar por CPF |
| GET | `/api/slots/available/:date` | Horários disponíveis |

### Admin (JWT obrigatório)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login |
| GET | `/api/bookings` | Listar agendamentos |
| PATCH | `/api/bookings/:id/status` | Atualizar status |
| GET | `/api/clients` | Listar clientes |
| POST | `/api/slots/bulk` | Publicar horários |
| GET | `/api/settings` | Configurações |
| PUT | `/api/settings` | Atualizar configurações |
| GET | `/api/whatsapp/status` | Status WhatsApp |

---

## Segurança

- **Autenticação JWT** com access + refresh tokens
- **Rate limiting** adaptável por ambiente (5 tentativas de login em produção)
- **bcrypt** para hash de senhas
- **CORS** restritivo por origem
- **Validação Zod** em todas as entradas da API
- **Nginx headers** de segurança (X-Frame-Options, X-Content-Type-Options, etc.)

---

## Conformidade LGPD

O sistema coleta dados pessoais de clientes (nome, CPF, e-mail, telefone) e segue as diretrizes da **Lei Geral de Proteção de Dados (Lei nº 13.709/2018)**:

- **Controlador dos dados:** Kevin Hussein (proprietário do estúdio)
- **Operador técnico:** Marlon Crefta (desenvolvedor)
- Dados armazenados **localmente** em SQLite (sem nuvem de terceiros)
- Termos de responsabilidade e direitos de imagem implementados
- Possibilidade de exclusão de dados sob demanda

---

## Licença

Este é um **software proprietário** desenvolvido sob encomenda.

- **Proprietário:** Kevin Hussein — titular dos direitos de uso e dados
- **Desenvolvedor:** Marlon Crefta — autor do código-fonte

Consulte o arquivo [LICENSE](LICENSE) para os termos completos.

---

## Créditos

| Papel | Nome |
|-------|------|
| **Desenvolvimento** | Marlon Crefta |
| **Proprietário & Design** | Kevin Hussein |
| **Contato Estúdio** | +55 41 99648-1275 |
