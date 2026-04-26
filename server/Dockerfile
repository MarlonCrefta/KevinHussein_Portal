# Backend Dockerfile — Multi-stage build
# Stage 1: Build (com ferramentas de compilação para better-sqlite3)
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev

# Stage 2: Produção (imagem limpa, sem ferramentas de build)
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

# Copiar node_modules compilados do builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copiar código fonte
COPY . .

# Criar diretórios necessários
RUN mkdir -p /app/data /app/auth_info_baileys /app/backups

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Iniciar servidor
CMD ["node", "index.js"]
