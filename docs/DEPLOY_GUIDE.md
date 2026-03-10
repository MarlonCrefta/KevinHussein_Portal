# Guia de Deploy — Kevin Hussein Tattoo Studio

> Deploy na **VPS Hostinger — Ubuntu 24.04 LTS**.
> Passo a passo completo, do SSH até HTTPS funcionando.

---

## Requisitos

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| Plano Hostinger | KVM 1 | KVM 2 |
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Disco | 20 GB SSD | 40 GB+ |
| OS | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |
| Node.js | 20.x LTS | 20.x LTS |

> O sistema é leve: SQLite (sem MySQL/Postgres), Express, frontend estático via Nginx.

---

## Passo 0 — Acessar a VPS

1. Acesse o **hPanel** da Hostinger → **VPS** → selecione seu servidor
2. Copie o **IP** e a **senha root** (ou use a chave SSH configurada)
3. No terminal do seu computador:

```bash
ssh root@SEU_IP_HOSTINGER
```

> Na primeira vez, digite `yes` para aceitar a fingerprint.

---

## Passo 1 — Atualizar o sistema e criar usuário

```bash
# Atualizar pacotes
apt update && apt upgrade -y

# Criar usuário para o app (não rodar como root)
adduser deploy
usermod -aG sudo deploy

# Permitir SSH para o novo usuário
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Trocar para o usuário deploy
su - deploy
```

---

## Passo 2 — Criar swap (VPS com 1 GB RAM)

Se seu plano tem **1 GB de RAM**, crie swap para evitar crash no build:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Tornar permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Passo 3 — Instalar Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

node -v   # deve mostrar v20.x
npm -v    # deve mostrar 10.x
```

---

## Passo 4 — Instalar PM2

```bash
sudo npm install -g pm2
```

---

## Passo 5 — Clonar o projeto

```bash
cd /opt
sudo git clone https://github.com/MarlonCrefta/KevinHussein_Portal.git kevin-hussein
sudo chown -R deploy:deploy /opt/kevin-hussein
cd /opt/kevin-hussein
```

---

## Passo 6 — Instalar dependências

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

---

## Passo 7 — Configurar variáveis de ambiente

```bash
cp server/.env.example server/.env
nano server/.env
```

Preencher com valores reais:

```env
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Domínio final (com https)
FRONTEND_URL=https://seudominio.com

# Banco de dados
DATABASE_PATH=./data/database.sqlite

# OBRIGATÓRIO — gere cada um com: openssl rand -base64 32
JWT_SECRET=COLE_AQUI_O_PRIMEIRO_SECRET
JWT_REFRESH_SECRET=COLE_AQUI_O_SEGUNDO_SECRET

# WhatsApp
WHATSAPP_SESSION_PATH=./auth_info_baileys

# Admin — use senha forte
ADMIN_USERNAME=kevin
ADMIN_PASSWORD=SuaSenhaForteAqui!
ADMIN_NAME=Kevin Hussein

# Logs
LOG_LEVEL=warn
LOG_FILE=./logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Scheduler
SCHEDULER_ENABLED=true
```

**Gerar os secrets:**
```bash
openssl rand -base64 32   # copie e cole no JWT_SECRET
openssl rand -base64 32   # copie e cole no JWT_REFRESH_SECRET
```

> Salvar: `Ctrl+O` → Enter → `Ctrl+X`

---

## Passo 8 — Build do frontend

```bash
cd /opt/kevin-hussein
npm run build
# Cria a pasta dist/ com os arquivos estáticos otimizados
```

---

## Passo 9 — Iniciar backend com PM2

```bash
cd /opt/kevin-hussein/server

# Criar diretórios necessários
mkdir -p data logs

# Iniciar
pm2 start index.js --name "kevin-api"
pm2 save
```

Configurar auto-start no boot:
```bash
pm2 startup
# PM2 vai mostrar um comando sudo — copie e execute ele
pm2 save
```

Verificar se está rodando:
```bash
pm2 status
pm2 logs kevin-api --lines 20
```

---

## Passo 10 — Instalar e configurar Nginx

```bash
sudo apt install -y nginx
```

Criar config do site:
```bash
sudo nano /etc/nginx/sites-available/kevin-hussein
```

Colar o conteúdo abaixo (**substituir `seudominio.com` pelo domínio real**):

```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    # Frontend (arquivos estáticos)
    root /opt/kevin-hussein/dist;
    index index.html;

    # Compressão gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # Cache de assets (hash no nome = imutável)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Cache de imagens
    location ~* \.(png|jpg|jpeg|gif|ico|svg|webp)$ {
        expires 30d;
        add_header Cache-Control "public";
    }

    # Proxy reverso para API backend
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 30s;
        proxy_connect_timeout 10s;
    }

    # SPA fallback (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

Ativar o site:
```bash
sudo ln -s /etc/nginx/sites-available/kevin-hussein /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t        # deve dizer "syntax is ok"
sudo systemctl restart nginx
sudo systemctl enable nginx
```

> Neste ponto, acessar `http://SEU_IP_HOSTINGER` deve mostrar o site.

---

## Passo 11 — Apontar domínio na Hostinger

1. No **hPanel** → **Domínios** → selecione o domínio
2. **DNS / Nameservers** → adicione registro **A**:
   - **Nome:** `@` → **Valor:** `SEU_IP_VPS`
   - **Nome:** `www` → **Valor:** `SEU_IP_VPS`
3. Aguarde propagação DNS (5 min a 48h, geralmente ~15 min na Hostinger)

Verificar:
```bash
dig seudominio.com +short    # deve retornar o IP da VPS
```

---

## Passo 12 — SSL com Let's Encrypt (HTTPS grátis)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com -d www.seudominio.com
```

Seguir as instruções na tela (email, aceitar termos).

Testar renovação automática:
```bash
sudo certbot renew --dry-run
```

> O Certbot já configura o cron de renovação automática.

---

## Passo 13 — Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

> **NÃO** exponha a porta 3001. O Nginx faz proxy reverso internamente.

---

## Comandos do Dia a Dia

```bash
# ─── Backend ─────────────────────────────
pm2 status                        # ver processos
pm2 logs kevin-api --lines 50     # ver logs
pm2 restart kevin-api             # reiniciar
pm2 monit                         # monitor em tempo real

# ─── Atualizar o sistema ─────────────────
cd /opt/kevin-hussein
git pull origin main
npm install && npm run build
cd server && npm install && cd ..
pm2 restart kevin-api

# ─── Nginx ───────────────────────────────
sudo nginx -t                     # testar config
sudo systemctl restart nginx      # reiniciar
sudo tail -f /var/log/nginx/error.log   # ver erros
```

---

## Backup Automático do Banco

O banco SQLite fica em `server/data/`. Configure backup diário:

```bash
# Criar pasta de backups
sudo mkdir -p /opt/backups

# Adicionar ao cron (backup todo dia às 3h)
crontab -e
```

Adicionar a linha:
```
0 3 * * * cp /opt/kevin-hussein/server/data/database.sqlite /opt/backups/db_$(date +\%Y\%m\%d).sqlite
```

Limpar backups com mais de 30 dias:
```
0 4 * * * find /opt/backups -name "db_*.sqlite" -mtime +30 -delete
```

---

## Consumo Esperado na VPS

| Métrica | Idle | Carga Normal |
|---------|------|--------------|
| RAM (Node + PM2) | ~50 MB | ~90 MB |
| RAM (Nginx) | ~5 MB | ~15 MB |
| RAM (total SO) | ~200 MB | ~300 MB |
| CPU | < 1% | < 5% |
| Disco (DB) | ~1 MB | ~50 MB (anos) |
| Banda | negligível | ~100 KB/req |

> Com o plano **KVM 1** (1 vCPU, 4 GB RAM) da Hostinger já sobra bastante.

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Site não abre pelo IP | Verificar se Nginx está rodando: `sudo systemctl status nginx` |
| Domínio não resolve | Verificar DNS no hPanel e `dig seudominio.com` |
| Frontend branco / 404 | Verificar se `npm run build` criou `/opt/kevin-hussein/dist/` |
| API retorna 502 | `pm2 restart kevin-api` → `pm2 logs kevin-api` |
| CORS error no navegador | Verificar `FRONTEND_URL` no `server/.env` (deve ser `https://seudominio.com`) |
| Banco corrompido | Restaurar backup: `cp /opt/backups/db_YYYYMMDD.sqlite server/data/database.sqlite` |
| SSL expirado | `sudo certbot renew` |
| Servidor não reinicia API | Verificar `pm2 startup` e `pm2 save` |
| Build falha por RAM | Criar swap (Passo 2) |

---

## Contato Técnico

Em caso de problemas técnicos com o sistema:
- **Desenvolvedor:** Marlon Crefta
- **GitHub:** https://github.com/MarlonCrefta/KevinHussein_Portal
