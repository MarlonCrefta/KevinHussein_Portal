# SSL Certificates

Coloque seus certificados SSL aqui:

- `certificate.crt` - Certificado público
- `private.key` - Chave privada
- `ca_bundle.crt` - Bundle CA (opcional)

## Gerando certificado auto-assinado (apenas desenvolvimento)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout private.key \
  -out certificate.crt \
  -subj "/CN=localhost"
```

## Let's Encrypt (produção)

Use Certbot para obter certificados gratuitos:

```bash
certbot certonly --standalone -d seu-dominio.com
```

⚠️ **NUNCA faça commit de chaves privadas!**
