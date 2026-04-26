/**
 * Kevin Hussein Tattoo Studio - API Server
 * Versão 2.0.0 - Refatorado
 * 
 * Servidor Express com:
 * - API RESTful
 * - Banco de dados SQLite
 * - Autenticação JWT
 * - Integração WhatsApp (Baileys)
 * - Scheduler de mensagens automáticas
 */

// App Express (middlewares, rotas, error handlers)
import app, { setWhatsAppService } from './app.js';

// Configuração
import config from './src/config/env.js';
import { initializeDatabase, closeDatabase } from './src/config/database.js';

// Models (para inicialização)
import { UserModel, MessageTemplateModel } from './src/models/index.js';

// Serviços
import { whatsappService, schedulerService } from './src/services/index.js';

// Logger estruturado
import logger from './src/config/logger.js';

logger.info('╔══════════════════════════════════════════════════════════╗');
logger.info('║       KEVIN HUSSEIN TATTOO STUDIO - API SERVER          ║');
logger.info('║                     Versão 2.0.0                        ║');
logger.info('╚══════════════════════════════════════════════════════════╝');

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================

async function startServer() {
  try {
    // 1. Inicializar banco de dados (executa migrations pendentes)
    logger.info('Configurando banco de dados...');
    await initializeDatabase();

    // 2. Criar admin padrão se não existir
    const adminCount = UserModel.count();
    if (adminCount === 0) {
      logger.info('Criando usuário admin padrão...');
      await UserModel.create({
        username: config.defaultAdmin.username,
        password: config.defaultAdmin.password,
        name: config.defaultAdmin.name,
        role: 'admin',
      });
      logger.info({ username: config.defaultAdmin.username }, 'Admin criado');
    }

    // 3. Inicializar templates de mensagem
    logger.info('Configurando templates de mensagem...');
    MessageTemplateModel.initializeDefaults();

    // 4. Configurar serviço WhatsApp nas rotas
    setWhatsAppService(whatsappService);

    // 4.1 Auto iniciar conexão WhatsApp (Baileys) junto ao backend
    if (config.whatsapp.autoConnect) {
      logger.info('Iniciando conexão automática do WhatsApp...');
      whatsappService.connect()
        .then(() => {
          logger.info('Conexão automática do WhatsApp iniciada');
        })
        .catch((err) => {
          logger.error({ err }, 'Falha ao iniciar conexão automática do WhatsApp');
        });
    } else {
      logger.info('Auto conexão do WhatsApp desabilitada por configuração');
    }

    // 5. Iniciar scheduler
    logger.info('Iniciando scheduler de mensagens...');
    schedulerService.start();

    // 6. Iniciar servidor
    const server = app.listen(config.port, () => {
      logger.info({ host: config.host, port: config.port, env: config.env }, 'Servidor rodando');
      logger.info({ frontend: config.frontendUrl }, 'Frontend esperado');
    });

    // Timeout para conexões lentas (30s)
    server.keepAliveTimeout = 30000;

    // ============================================
    // GRACEFUL SHUTDOWN
    // ============================================
    async function gracefulShutdown(signal) {
      logger.info({ signal }, 'Encerrando servidor...');

      try {
        await whatsappService.shutdown();
        logger.info('WhatsApp encerrado sem limpar sessão');
      } catch (e) {
        logger.error({ err: e }, 'Erro ao encerrar WhatsApp no shutdown');
      }
      
      // 1. Parar de aceitar novas conexões
      server.close(() => {
        logger.info('Servidor HTTP fechado');
        
        // 2. Parar scheduler
        schedulerService.stop();
        logger.info('Scheduler parado');
        
        // 3. Fechar banco de dados
        try {
          closeDatabase();
          logger.info('Banco de dados fechado');
        } catch (e) {
          logger.error({ err: e }, 'Erro ao fechar banco');
        }
        
        logger.info('Shutdown completo');
        process.exit(0);
      });

      // Forçar saída após 10s se graceful falhar
      setTimeout(() => {
        logger.error('Forçando encerramento após timeout');
        process.exit(1);
      }, 10000);
    }

    process.once('SIGINT', () => gracefulShutdown('SIGINT'));
    process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    logger.fatal({ err: error }, 'Erro ao iniciar servidor');
    process.exit(1);
  }
}

// Iniciar
startServer();
