# Guia de Deploy — Kevin Hussein Tattoo Studio

> Este guia é para quem vai rodar o sistema no servidor. Segue o passo a passo completo.

## Requisitos Mínimos do Servidor

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 512 MB | 1 GB |
| Disco | 1 GB | 5 GB |
| OS | Ubuntu 22.04+ / Debian 12+ | Ubuntu 24.04 LTS |
| Node.js | 18.x | 20.x LTS |

> O sistema é leve: SQLite (sem MySQL/Postgres), Express (sem overhead), frontend estático servido por Nginx.

---

## Opção 1: Deploy Rápido com PM2 (Recomendado)

### 1. Instalar Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v  # deve mostrar v20.x
```

### 2. Instalar PM2 (gerenciador de processo)

```bash
sudo npm install -g pm2
```

### 3. Clonar o projeto

```bash
cd /opt
sudo git clone https://github.com/MarlonCrefta/KevinHussein_Portal.git kevin-hussein
sudo chown -R $USER:$USER /opt/kevin-hussein
cd /opt/kevin-hussein
```

### 4. Instalar dependências

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 5. Configurar variáveis de ambiente

```bash
# Backend
cp server/.env.example server/.env
nano server/.env
```

Editar `server/.env`:
```env
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
FRONTEND_URL=https://seudominio.com
JWT_SECRET=GERAR_UM_SECRET_FORTE_AQUI
JWT_REFRESH_SECRET=GERAR_OUTRO_SECRET_AQUI
ADMIN_USERNAME=kevin
ADMIN_PASSWORD=SenhaForte123!
```

> **IMPORTANTE:** Gere secrets seguros com: `openssl rand -base64 32`

### 6. Build do frontend

```bash
npm run build
# Isso cria a pasta dist/ com os arquivos estáticos otimizados
```

### 7. Iniciar backend com PM2

```bash
cd server
pm2 start index.js --name "kevin-api" --node-args="--experimental-modules"
pm2 save
pm2 startup  # Configura auto-start no boot
cd ..
```

### 8. Instalar e configurar Nginx

```bash
sudo apt install -y nginx
```

Criar config do site:
```bash
sudo nano /etc/nginx/sites-available/kevin-hussein
```

Conteúdo:
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
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # Cache de assets estáticos (1 ano)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Cache de imagens (30 dias)
    location ~* \.(png|jpg|jpeg|gif|ico|svg|webp)$ {
        expires 30d;
        add_header Cache-Control "public";
    }

    # Proxy reverso para API
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

    # Segurança
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
sudo nginx -t
sudo systemctl restart nginx
```

### 9. SSL com Let's Encrypt (HTTPS gratuito)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com -d www.seudominio.com
# Seguir instruções na tela
# Renovação automática já é configurada
```

---

## Opção 2: Deploy com Docker

```bash
cd /opt/kevin-hussein
docker-compose up -d --build
```

O `docker-compose.yml` já está configurado no projeto.

---

## Comandos Úteis

```bash
# Ver logs do backend
pm2 logs kevin-api

# Reiniciar backend
pm2 restart kevin-api

# Status dos processos
pm2 status

# Monitoramento em tempo real
pm2 monit

# Atualizar o sistema
cd /opt/kevin-hussein
git pull origin main
npm install
npm run build
cd server && npm install && cd ..
pm2 restart kevin-api
sudo systemctl restart nginx
```

---

## Backup do Banco de Dados

O banco SQLite fica em `server/data/`. Faça backup regularmente:

```bash
# Backup manual
cp /opt/kevin-hussein/server/data/tattoo_studio.db /opt/backups/tattoo_studio_$(date +%Y%m%d).db

# Backup automático (cron — todo dia às 3h)
crontab -e
# Adicionar:
0 3 * * * cp /opt/kevin-hussein/server/data/tattoo_studio.db /opt/backups/tattoo_studio_$(date +\%Y\%m\%d).db
```

---

## Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

> **NÃO** exponha a porta 3001 diretamente. O Nginx faz proxy reverso.

---

## Consumo Esperado

| Métrica | Idle | Carga Normal |
|---------|------|--------------|
| RAM (backend) | ~40 MB | ~80 MB |
| RAM (nginx) | ~5 MB | ~15 MB |
| CPU | < 1% | < 5% |
| Disco (DB) | ~1 MB | ~50 MB (anos) |
| Banda | negligível | ~100 KB/req |

O sistema é extremamente leve. Um VPS de $5/mês (DigitalOcean, Hetzner, Contabo) é mais que suficiente.

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Frontend não carrega | Verificar se `npm run build` foi executado e `dist/` existe |
| API retorna 502 | `pm2 restart kevin-api` e verificar `pm2 logs kevin-api` |
| CORS error | Verificar `FRONTEND_URL` no `server/.env` |
| Banco corrompido | Restaurar backup de `server/data/` |
| SSL expirado | `sudo certbot renew` |

---

## Contato Técnico

Em caso de problemas técnicos com o sistema:
- **Desenvolvedor:** Marlon Crefta
- **GitHub:** https://github.com/MarlonCrefta/KevinHussein_Portal
