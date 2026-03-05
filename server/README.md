# Servidor WhatsApp - Kevin Hussein Tattoo Studio

## 🚀 Solução Simples com WhatsApp Web

Este servidor usa **whatsapp-web.js** para conectar via WhatsApp Web e enviar mensagens automáticas de confirmação e lembretes de agendamentos.

## ✨ Vantagens

- ✅ **Configuração instantânea** - Apenas escaneie o QR Code
- ✅ **100% Gratuito** - Sem custos de API
- ✅ **Sem burocracia** - Não precisa aprovação da Meta
- ✅ **Simples** - Funciona com seu número pessoal ou comercial
- ✅ **Confiável** - Usa a mesma tecnologia do WhatsApp Web

## 📋 Pré-requisitos

- Node.js 18+ instalado
- WhatsApp instalado no celular
- Conexão com internet

## 🔧 Instalação

1. **Navegue até a pasta do servidor:**
```bash
cd server
```

2. **Instale as dependências:**
```bash
npm install
```

## 🚀 Como Usar

### 1. Inicie o Servidor

```bash
npm start
```

O servidor iniciará na porta **3001**.

### 2. Conecte o WhatsApp

1. Acesse o painel admin: `http://localhost:5173/admin/whatsapp`
2. Clique em **"Conectar WhatsApp"**
3. Escaneie o QR Code que aparecerá na tela com seu celular:
   - Abra o WhatsApp no celular
   - Vá em **Menu (⋮) > Dispositivos Conectados**
   - Toque em **"Conectar um dispositivo"**
   - Escaneie o QR Code

### 3. Pronto!

Após conectar, o status mudará para **"Online"** e as mensagens serão enviadas automaticamente após cada agendamento.

## 📡 API Endpoints

### GET `/status`
Retorna o status atual da conexão WhatsApp.

**Resposta:**
```json
{
  "isReady": true,
  "qrCode": null,
  "clientInfo": {
    "pushname": "Seu Nome",
    "wid": "5541999999999",
    "platform": "android"
  }
}
```

### POST `/start`
Inicia a conexão com WhatsApp e gera QR Code.

### POST `/disconnect`
Desconecta o WhatsApp.

### POST `/send-message`
Envia uma mensagem personalizada.

**Body:**
```json
{
  "phone": "5541999999999",
  "message": "Sua mensagem aqui"
}
```

### POST `/send-confirmation`
Envia mensagem de confirmação de agendamento.

**Body:**
```json
{
  "booking": {
    "id": "booking_123",
    "type": "reuniao",
    "clientName": "João Silva",
    "clientPhone": "5541999999999",
    "date": "Segunda-feira, 6 de janeiro de 2026",
    "time": "14:00"
  }
}
```

### POST `/send-reminder`
Envia lembrete de agendamento.

**Body:**
```json
{
  "booking": {
    "id": "booking_123",
    "type": "sessao",
    "clientName": "Maria Santos",
    "clientPhone": "5541999999999",
    "date": "Terça-feira, 7 de janeiro de 2026",
    "time": "10:00"
  }
}
```

## 📱 Formato das Mensagens

### Mensagem de Confirmação

```
🎨 Kevin Hussein Tattoo Studio

Olá, João Silva!

✅ Seu agendamento foi confirmado com sucesso!

📋 Detalhes do Agendamento:
• Tipo: Reunião de Criação
• Data: Segunda-feira, 6 de janeiro de 2026
• Horário: 14:00

📍 Localização:
[Endereço do estúdio]

📞 Contato:
(41) 99999-9999

⚠️ Importante:
Em caso de imprevistos, avise com antecedência.
Não comparecimentos sem aviso podem resultar em cobrança antecipada no próximo agendamento.

Nos vemos em breve! 🖤
```

### Mensagem de Lembrete

```
🔔 Lembrete de Agendamento

Olá, Maria Santos!

Este é um lembrete do seu agendamento:

📋 Detalhes:
• Tipo: Sessão de Tatuagem
• Data: Terça-feira, 7 de janeiro de 2026
• Horário: 10:00

📍 [Endereço do estúdio]

Estamos te esperando! 🎨
```

## 🔒 Segurança

- A sessão do WhatsApp fica salva localmente na pasta `.wwebjs_auth`
- Não é necessário escanear o QR Code toda vez (sessão persiste)
- Para desconectar completamente, use o botão "Desconectar" no painel admin

## 🐛 Solução de Problemas

### Servidor não inicia
```bash
# Verifique se a porta 3001 está disponível
netstat -ano | findstr :3001

# Ou mude a porta no arquivo index.js
const PORT = 3002;
```

### QR Code não aparece
- Aguarde alguns segundos após clicar em "Conectar WhatsApp"
- Verifique o console do servidor para mensagens de erro
- Tente deletar a pasta `.wwebjs_auth` e reconectar

### Mensagens não são enviadas
- Verifique se o status está "Online" no painel admin
- Confirme que o número de telefone está no formato correto (com DDI)
- Verifique os logs do servidor para erros

### Desconexão frequente
- Mantenha o servidor rodando continuamente
- Não faça logout do WhatsApp Web manualmente
- Verifique sua conexão com internet

## 📝 Notas Importantes

1. **Mantenha o servidor rodando** - O servidor precisa estar ativo para enviar mensagens
2. **Não faça logout** - Evite desconectar o WhatsApp Web manualmente no celular
3. **Um dispositivo por vez** - Você pode ter apenas uma sessão WhatsApp Web ativa
4. **Números válidos** - Certifique-se de que os números têm WhatsApp ativo

## 🔄 Desenvolvimento

Para desenvolvimento com auto-reload:

```bash
npm run dev
```

## 📦 Dependências

- **whatsapp-web.js** - Cliente WhatsApp Web
- **qrcode** - Geração de QR Codes
- **express** - Servidor HTTP
- **cors** - Habilita CORS para frontend

## 🎯 Próximos Passos

- [ ] Adicionar agendamento de lembretes automáticos
- [ ] Implementar fila de mensagens
- [ ] Adicionar logs de mensagens enviadas
- [ ] Criar dashboard de estatísticas
- [ ] Suporte a envio de imagens/mídia
- [ ] Webhooks para status de entrega

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs do servidor
2. Consulte a documentação do whatsapp-web.js
3. Reinicie o servidor e reconecte o WhatsApp
