/**
 * Serviço de Scheduler (Mensagens Automáticas)
 * Kevin Hussein Tattoo Studio
 * 
 * RODA NO BACKEND - Não depende do navegador estar aberto
 */

import cron from 'node-cron';
import { BookingModel, MessageTemplateModel } from '../models/index.js';
import whatsappService from './whatsapp.service.js';
import config from '../config/env.js';

class SchedulerService {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
  }

  /**
   * Inicia o scheduler
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Scheduler já está rodando');
      return;
    }

    if (!config.scheduler.enabled) {
      console.log('⚠️ Scheduler desabilitado via configuração');
      return;
    }

    console.log('🚀 Iniciando Scheduler de Mensagens...');
    this.isRunning = true;

    // Job: Verificar lembretes a cada hora (minuto 0)
    const reminderJob = cron.schedule('0 * * * *', () => {
      this.checkAndSendReminders();
    });
    this.jobs.push(reminderJob);

    // Job: Limpeza de dados antigos (todo dia às 3h)
    const cleanupJob = cron.schedule('0 3 * * *', () => {
      this.cleanupOldData();
    });
    this.jobs.push(cleanupJob);

    console.log('✅ Scheduler iniciado');
    console.log(`   - Lembretes: verificados a cada hora`);
    console.log(`   - Horário comercial: ${config.scheduler.businessHours.start}h - ${config.scheduler.businessHours.end}h`);

    // Executar verificação inicial
    setTimeout(() => {
      this.checkAndSendReminders();
    }, 5000);
  }

  /**
   * Para o scheduler
   */
  stop() {
    if (!this.isRunning) return;

    console.log('🛑 Parando Scheduler...');
    
    for (const job of this.jobs) {
      job.stop();
    }
    
    this.jobs = [];
    this.isRunning = false;
    
    console.log('✅ Scheduler parado');
  }

  /**
   * Verifica se está no horário comercial
   */
  isBusinessHours() {
    const now = new Date();
    const hour = now.getHours();
    return hour >= config.scheduler.businessHours.start && 
           hour < config.scheduler.businessHours.end;
  }

  /**
   * Verifica e envia lembretes
   */
  async checkAndSendReminders() {
    console.log('\n🔍 Verificando lembretes pendentes...');

    // Verificar horário comercial
    if (!this.isBusinessHours()) {
      console.log('⏰ Fora do horário comercial. Pulando...');
      return;
    }

    // Verificar se WhatsApp está conectado
    if (!whatsappService.isReady()) {
      console.log('❌ WhatsApp não conectado. Pulando...');
      return;
    }

    // Verificar se template está habilitado
    const reminderTemplate = MessageTemplateModel.findByType('reminder');
    if (!reminderTemplate || !reminderTemplate.enabled) {
      console.log('⚠️ Template de lembrete desabilitado');
      return;
    }

    try {
      // Buscar agendamentos de amanhã sem lembrete enviado
      const bookings = BookingModel.findPendingReminders();
      
      console.log(`📅 ${bookings.length} agendamentos precisam de lembrete`);

      let sent = 0;
      let failed = 0;

      for (const booking of bookings) {
        try {
          // Processar template com todos os dados do agendamento
          const result = MessageTemplateModel.processTemplate('reminder', {
            id: booking.id,
            clientName: booking.client_name,
            clientPhone: booking.client_phone,
            clientEmail: booking.client_email,
            date: this.formatDate(booking.date),
            time: booking.time,
            type: booking.type === 'reuniao' ? 'Reunião' : booking.type === 'sessao' ? 'Sessão' : 'Retoque',
            clientMessage: booking.client_message,
          });

          if (result && result.message) {
            // Enviar mensagem
            await whatsappService.sendMessage(booking.client_phone, result.message);
            
            // Marcar como enviado
            BookingModel.update(booking.id, {
              reminderSent: true,
              reminderSentAt: new Date().toISOString()
            });

            sent++;
            console.log(`✅ Lembrete enviado para ${booking.client_name}`);
          }

          // Delay entre mensagens para evitar bloqueio
          await this.delay(3000);
        } catch (err) {
          failed++;
          console.error(`❌ Erro ao enviar lembrete para ${booking.client_name}:`, err.message);
        }
      }

      console.log(`📊 Resultado: ${sent} enviados, ${failed} falharam`);
    } catch (err) {
      console.error('❌ Erro no scheduler de lembretes:', err.message);
    }
  }

  /**
   * Envia confirmação de agendamento
   */
  async sendConfirmation(booking) {
    if (!whatsappService.isReady()) {
      console.log('❌ WhatsApp não conectado. Confirmação não enviada.');
      return false;
    }

    const confirmTemplate = MessageTemplateModel.findByType('confirmation');
    if (!confirmTemplate || !confirmTemplate.enabled) {
      console.log('⚠️ Template de confirmação desabilitado');
      return false;
    }

    try {
      // Passar todos os dados do agendamento para o template
      const result = MessageTemplateModel.processTemplate('confirmation', {
        id: booking.id,
        clientName: booking.client_name,
        clientPhone: booking.client_phone,
        clientEmail: booking.client_email,
        date: this.formatDate(booking.date),
        time: booking.time,
        type: booking.type === 'reuniao' ? 'Reunião' : booking.type === 'sessao' ? 'Sessão' : 'Retoque',
        clientMessage: booking.client_message,
      });

      if (result && result.message) {
        await whatsappService.sendMessage(booking.client_phone, result.message);
        
        BookingModel.update(booking.id, {
          confirmationSent: true,
          confirmationSentAt: new Date().toISOString()
        });

        console.log(`✅ Confirmação enviada para ${booking.client_name}`);
        return true;
      }
    } catch (err) {
      console.error(`❌ Erro ao enviar confirmação:`, err.message);
    }

    return false;
  }

  /**
   * Limpa dados antigos
   */
  cleanupOldData() {
    console.log('🧹 Limpeza de dados antigos...');
    // Implementar se necessário
  }

  /**
   * Formata data para exibição
   */
  formatDate(dateStr) {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton
const schedulerService = new SchedulerService();

export default schedulerService;
