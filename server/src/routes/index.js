/**
 * Índice de Rotas
 * Kevin Hussein Tattoo Studio
 */

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import bookingRoutes from './booking.routes.js';
import clientRoutes from './client.routes.js';
import slotRoutes from './slot.routes.js';
import messageRoutes, { setWhatsAppService as setMessageWhatsApp } from './message.routes.js';
import whatsappRoutes, { setWhatsAppService as setWhatsAppRouteService } from './whatsapp.routes.js';
import settingsRoutes from './settings.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Kevin Hussein Tattoo Studio',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Montar rotas
router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);
router.use('/clients', clientRoutes);
router.use('/slots', slotRoutes);
router.use('/messages', messageRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/settings', settingsRoutes);

// Exportar função para injetar serviço WhatsApp
export function setWhatsAppService(service) {
  setMessageWhatsApp(service);
  setWhatsAppRouteService(service);
}

export default router;
