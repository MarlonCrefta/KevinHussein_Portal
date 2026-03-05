/**
 * Serviço de WhatsApp (Baileys)
 * Kevin Hussein Tattoo Studio
 */

import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  Browsers
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import config from '../config/env.js';

class WhatsAppService {
  constructor() {
    this.sock = null;
    this.qrCodeData = null;
    this.isConnected = false;
    this.clientInfo = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnecting = false;
    this.onQRCodeCallback = null;
    this.onConnectedCallback = null;
    this.onDisconnectedCallback = null;
  }

  /**
   * Limpa sessão corrompida
   */
  _cleanSession() {
    const sessionPath = path.resolve(process.cwd(), config.whatsapp.sessionPath);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log('🗑️  Sessão antiga removida:', sessionPath);
    }
  }

  /**
   * Conecta ao WhatsApp
   */
  async connect() {
    // Evitar conexões simultâneas
    if (this.isConnecting) {
      console.log('⚠️  Já existe uma conexão em andamento');
      return;
    }

    // Se já está conectado, não reconectar
    if (this.isConnected && this.sock) {
      console.log('✅ WhatsApp já está conectado');
      return;
    }

    this.isConnecting = true;
    this.qrCodeData = null;

    try {
      // Fechar socket anterior se existir
      if (this.sock) {
        try {
          this.sock.end(undefined);
        } catch (e) {
          // ignorar
        }
        this.sock = null;
      }

      const sessionPath = path.resolve(process.cwd(), config.whatsapp.sessionPath);
      console.log('📂 Caminho da sessão:', sessionPath);

      // Se a sessão existe mas não está conectado, pode estar corrompida
      // Limpar para forçar novo QR Code
      if (fs.existsSync(sessionPath) && !this.isConnected) {
        const credsFile = path.join(sessionPath, 'creds.json');
        if (fs.existsSync(credsFile)) {
          try {
            const creds = JSON.parse(fs.readFileSync(credsFile, 'utf-8'));
            // Se não tem registrationId, a sessão está incompleta
            if (!creds.registered) {
              console.log('⚠️  Sessão incompleta detectada, limpando...');
              this._cleanSession();
            }
          } catch (e) {
            console.log('⚠️  Sessão corrompida detectada, limpando...');
            this._cleanSession();
          }
        }
      }

      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
      
      let version;
      try {
        const versionInfo = await fetchLatestBaileysVersion();
        version = versionInfo.version;
        console.log('📱 Versão WhatsApp Web:', version.join('.'));
      } catch (e) {
        console.log('⚠️  Não foi possível obter versão, usando padrão');
        version = [2, 3000, 1015901307];
      }

      const logger = pino({ level: 'warn' });

      this.sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: true,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        browser: Browsers.ubuntu('Chrome'),
        connectTimeoutMs: 120000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
        retryRequestDelayMs: 500,
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
          if (msg.key.fromMe) continue;
          console.log('📨 Mensagem recebida de:', msg.key.remoteJid);
        }
      });

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        console.log('🔄 Connection update:', JSON.stringify({ 
          connection, 
          hasQR: !!qr, 
          disconnectReason: lastDisconnect?.error?.output?.statusCode,
          disconnectMessage: lastDisconnect?.error?.message
        }));

        if (qr) {
          try {
            this.qrCodeData = await QRCode.toDataURL(qr, {
              width: 300,
              margin: 2,
              color: { dark: '#000000', light: '#FFFFFF' }
            });
            console.log('✅ QR Code gerado com sucesso! Escaneie com seu celular.');
            
            if (this.onQRCodeCallback) {
              this.onQRCodeCallback(this.qrCodeData);
            }
          } catch (err) {
            console.error('❌ Erro ao gerar QR Code:', err.message);
          }
        }

        if (connection === 'close') {
          this.isConnected = false;
          this.isConnecting = false;
          this.clientInfo = null;

          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const errorMessage = lastDisconnect?.error?.message || 'Desconhecido';
          
          console.log(`❌ Conexão fechada - Status: ${statusCode}, Motivo: ${errorMessage}`);
          
          if (this.onDisconnectedCallback) {
            this.onDisconnectedCallback();
          }

          // Decidir se deve reconectar
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;
          const isBadSession = statusCode === DisconnectReason.badSession;
          const isStreamError = statusCode === 515;
          const isRestartRequired = statusCode === DisconnectReason.restartRequired;
          const isConnectionLost = statusCode === DisconnectReason.connectionLost;
          const isTimedOut = statusCode === DisconnectReason.timedOut;

          if (isLoggedOut || isBadSession) {
            console.log('🗑️  Sessão inválida, limpando para novo QR Code...');
            this._cleanSession();
            this.qrCodeData = null;
            this.sock = null;
            this.reconnectAttempts = 0;
            return;
          }

          if ((isStreamError || isRestartRequired || isConnectionLost || isTimedOut) 
              && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(2000 * this.reconnectAttempts, 10000);
            console.log(`🔄 Reconectando em ${delay/1000}s (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(async () => {
              try {
                await this.connect();
              } catch (err) {
                console.error('❌ Erro ao reconectar:', err.message);
                this.qrCodeData = null;
                this.sock = null;
                this.isConnecting = false;
              }
            }, delay);
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('❌ Máximo de tentativas atingido. Limpando sessão...');
            this._cleanSession();
            this.qrCodeData = null;
            this.sock = null;
            this.reconnectAttempts = 0;
          }
        } else if (connection === 'open') {
          console.log('✅ WhatsApp conectado com sucesso!');
          this.isConnected = true;
          this.isConnecting = false;
          this.qrCodeData = null;
          this.reconnectAttempts = 0;

          try {
            const info = this.sock.user;
            this.clientInfo = {
              name: info?.name || 'Usuário',
              phone: info?.id?.split(':')[0] || 'N/A',
              platform: 'WhatsApp'
            };
            console.log('👤 Conectado como:', this.clientInfo.name, '-', this.clientInfo.phone);
            
            if (this.onConnectedCallback) {
              this.onConnectedCallback(this.clientInfo);
            }
          } catch (err) {
            console.error('⚠️  Erro ao obter info do usuário:', err.message);
          }
        } else if (connection === 'connecting') {
          console.log('⏳ Conectando ao WhatsApp...');
        }
      });

      console.log('⏳ Aguardando QR Code... (escaneie no celular)');
    } catch (error) {
      this.isConnecting = false;
      console.error('❌ Erro crítico ao conectar:', error.message);
      console.error('   Stack:', error.stack?.split('\n').slice(0, 3).join('\n'));
      throw error;
    }
  }

  /**
   * Desconecta do WhatsApp
   */
  async disconnect() {
    this.isConnecting = false;
    
    if (this.sock) {
      try {
        await this.sock.logout();
      } catch (err) {
        // Tentar fechar de outra forma
        try {
          this.sock.end(undefined);
        } catch (e) {
          // ignorar
        }
      }
      
      this.sock = null;
      this.isConnected = false;
      this.qrCodeData = null;
      this.clientInfo = null;
      this.reconnectAttempts = 0;

      this._cleanSession();
      console.log('✅ WhatsApp desconectado e sessão limpa');
    }
  }

  /**
   * Envia mensagem
   */
  async sendMessage(phone, message) {
    if (!this.isConnected || !this.sock) {
      throw new Error('WhatsApp não está conectado');
    }

    // Formatar número - remover caracteres não numéricos
    let formattedPhone = phone.replace(/\D/g, '');
    
    // Adicionar código do país (55 para Brasil) se não tiver
    if (formattedPhone.length === 10 || formattedPhone.length === 11) {
      formattedPhone = `55${formattedPhone}`;
    }
    
    let jid = `${formattedPhone}@s.whatsapp.net`;

    try {
      const [result] = await this.sock.onWhatsApp(formattedPhone);
      if (result && result.jid) {
        jid = result.jid;
      }
    } catch (err) {
      console.log('⚠️ Usando JID padrão');
    }

    await this.sock.sendMessage(jid, { text: message });
    
    console.log('✅ Mensagem enviada para:', formattedPhone);
    
    return {
      success: true,
      to: formattedPhone,
      jid
    };
  }

  /**
   * Verifica se está conectado
   */
  isReady() {
    return this.isConnected && this.sock !== null;
  }

  /**
   * Retorna status atual
   */
  getStatus() {
    return {
      isReady: this.isConnected,
      isConnecting: this.isConnecting,
      qrCode: this.qrCodeData,
      clientInfo: this.isConnected ? this.clientInfo : null
    };
  }

  /**
   * Define callbacks
   */
  onQRCode(callback) {
    this.onQRCodeCallback = callback;
  }

  onConnected(callback) {
    this.onConnectedCallback = callback;
  }

  onDisconnected(callback) {
    this.onDisconnectedCallback = callback;
  }
}

// Singleton
const whatsappService = new WhatsAppService();

export default whatsappService;
