/**
 * Cliente da API
 * Kevin Hussein Tattoo Studio
 * 
 * Centraliza todas as chamadas HTTP para o backend
 */

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

// Token storage
const TOKEN_KEY = 'kh_token';
const REFRESH_TOKEN_KEY = 'kh_refresh_token';

/**
 * Obtém o token de autenticação
 */
function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Salva os tokens
 */
function setTokens(token: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

/**
 * Remove os tokens
 */
function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Faz uma requisição HTTP
 */
const REQUEST_TIMEOUT_MS = 15000; // 15 segundos

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Adicionar token se existir
  const token = getToken();
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // Timeout via AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Tempo de conexão esgotado. Verifique sua internet.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  // Tentar refresh token se 401
  if (response.status === 401 && localStorage.getItem(REFRESH_TOKEN_KEY)) {
    const refreshed = await refreshToken();
    if (refreshed) {
      // Tentar novamente com novo token
      (headers as Record<string, string>)['Authorization'] = `Bearer ${getToken()}`;
      const retryResponse = await fetch(url, { ...options, headers });
      return handleResponse<T>(retryResponse);
    }
  }

  return handleResponse<T>(response);
}

/**
 * Processa a resposta da API
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || 'Erro na requisição');
    (error as any).status = response.status;
    (error as any).details = data.details;
    throw error;
  }

  return data;
}

/**
 * Tenta renovar o token
 */
async function refreshToken(): Promise<boolean> {
  const refreshTokenValue = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshTokenValue) return false;

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
    });

    if (response.ok) {
      const data = await response.json();
      setTokens(data.data.token, data.data.refreshToken);
      return true;
    }
  } catch {
    // Ignorar erros de refresh
  }

  clearTokens();
  return false;
}

// ============================================
// API DE AUTENTICAÇÃO
// ============================================

export const authApi = {
  async login(username: string, password: string) {
    const response = await request<{
      success: boolean;
      data: {
        user: { id: string; username: string; name: string; role: string };
        token: string;
        refreshToken: string;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (response.success) {
      setTokens(response.data.token, response.data.refreshToken);
    }

    return response;
  },

  async logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      clearTokens();
    }
  },

  async me() {
    return request<{
      success: boolean;
      data: { user: { id: string; username: string; name: string; role: string } };
    }>('/auth/me');
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return request<{ success: boolean; message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  isAuthenticated(): boolean {
    return getToken() !== null;
  },

  getToken,
  clearTokens,
};

// ============================================
// API DE AGENDAMENTOS
// ============================================

// Helper para converter snake_case para camelCase
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function transformBooking(data: any): Booking {
  if (!data) return data;
  const transformed: any = {};
  for (const key in data) {
    transformed[snakeToCamel(key)] = data[key];
  }
  return transformed as Booking;
}

export interface Booking {
  id: string;
  type: string;
  status: string;
  date: string;
  time: string;
  duration: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCpf: string;
  clientMessage: string;
  clientReputation: string;
  adminNotes: string;
  notes?: string;
  confirmationSent: boolean;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookingFormData {
  type: 'reuniao' | 'teste_anatomico' | 'sessao' | 'retoque';
  date: string;
  time: string;
  duration?: number;
  clientName: string;
  clientEmail?: string;
  clientPhone: string;
  clientCpf?: string;
  clientMessage?: string;
}

export const bookingsApi = {
  async list(params?: {
    status?: string;
    type?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const query = searchParams.toString();
    const response = await request<{
      success: boolean;
      data: { bookings: any[]; total: number };
    }>(`/bookings${query ? `?${query}` : ''}`);
    
    if (response.success && response.data?.bookings) {
      response.data.bookings = response.data.bookings.map(transformBooking);
    }
    return response as { success: boolean; data: { bookings: Booking[]; total: number } };
  },

  async getById(id: string) {
    const response = await request<{ success: boolean; data: any }>(`/bookings/${id}`);
    if (response.success && response.data) {
      response.data = transformBooking(response.data);
    }
    return response as { success: boolean; data: Booking };
  },

  async getStats() {
    return request<{
      success: boolean;
      data: {
        total: number;
        pendentes: number;
        confirmados: number;
        hoje: number;
        semana: number;
        mes: number;
      };
    }>('/bookings/stats');
  },

  async getUpcoming(limit = 10) {
    const response = await request<{ success: boolean; data: any[] }>(`/bookings/upcoming?limit=${limit}`);
    if (response.success && response.data) {
      response.data = response.data.map(transformBooking);
    }
    return response as { success: boolean; data: Booking[] };
  },

  async getByDate(date: string) {
    const response = await request<{ success: boolean; data: any[] }>(`/bookings/date/${date}`);
    if (response.success && response.data) {
      response.data = response.data.map(transformBooking);
    }
    return response as { success: boolean; data: Booking[] };
  },

  async create(data: BookingFormData) {
    const response = await request<{ success: boolean; data: any; message: string }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.success && response.data) {
      response.data = transformBooking(response.data);
    }
    return response as { success: boolean; data: Booking; message: string };
  },

  async update(id: string, data: Partial<Booking>) {
    const response = await request<{ success: boolean; data: any }>(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (response.success && response.data) {
      response.data = transformBooking(response.data);
    }
    return response as { success: boolean; data: Booking };
  },

  async updateStatus(id: string, status: string) {
    const response = await request<{ success: boolean; data: any }>(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (response.success && response.data) {
      response.data = transformBooking(response.data);
    }
    return response as { success: boolean; data: Booking };
  },

  async delete(id: string) {
    return request<{ success: boolean }>(`/bookings/${id}`, {
      method: 'DELETE',
    });
  },

  async getByCpf(cpf: string) {
    const cleanCpf = cpf.replace(/\D/g, '');
    const response = await request<{
      success: boolean;
      data: { bookings: any[]; client: Client | null };
    }>(`/bookings/cpf/${cleanCpf}`);
    if (response.success && response.data?.bookings) {
      response.data.bookings = response.data.bookings.map(transformBooking);
    }
    return response as { success: boolean; data: { bookings: Booking[]; client: Client | null } };
  },
};

// ============================================
// API DE CLIENTES
// ============================================

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  reputation: string;
  totalBookings: number;
  completedBookings: number;
  noShowCount: number;
  notes: string;
  termsAccepted: boolean;
  termsAcceptedAt: string | null;
  imageRightsAccepted: boolean;
  imageRightsAcceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function transformClient(data: any): Client {
  if (!data) return data;
  const transformed: any = {};
  for (const key in data) {
    transformed[snakeToCamel(key)] = data[key];
  }
  return transformed as Client;
}

export const clientsApi = {
  async list(params?: { search?: string; limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const query = searchParams.toString();
    const response = await request<{
      success: boolean;
      data: { clients: any[]; total: number };
    }>(`/clients${query ? `?${query}` : ''}`);
    if (response.success && response.data?.clients) {
      response.data.clients = response.data.clients.map(transformClient);
    }
    return response as { success: boolean; data: { clients: Client[]; total: number } };
  },

  async getById(id: string) {
    const response = await request<{ success: boolean; data: any }>(`/clients/${id}`);
    if (response.success && response.data) {
      const bookings = response.data.bookings;
      response.data = transformClient(response.data);
      if (bookings) {
        response.data.bookings = bookings.map(transformBooking);
      }
    }
    return response as { success: boolean; data: Client & { bookings: Booking[] } };
  },

  async create(data: { name: string; email?: string; phone: string; cpf?: string; notes?: string }) {
    const response = await request<{ success: boolean; data: any }>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.success && response.data) {
      response.data = transformClient(response.data);
    }
    return response as { success: boolean; data: Client };
  },

  async update(id: string, data: Partial<Client>) {
    const response = await request<{ success: boolean; data: any }>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (response.success && response.data) {
      response.data = transformClient(response.data);
    }
    return response as { success: boolean; data: Client };
  },

  async delete(id: string) {
    return request<{ success: boolean }>(`/clients/${id}`, {
      method: 'DELETE',
    });
  },

  async findByPhone(phone: string) {
    const response = await request<{ success: boolean; data: any }>(`/clients/phone/${encodeURIComponent(phone)}`);
    if (response.success && response.data) {
      response.data = transformClient(response.data);
    }
    return response as { success: boolean; data: Client };
  },

  async findByCpf(cpf: string) {
    const cleanCpf = cpf.replace(/\D/g, '');
    const response = await request<{ success: boolean; data: any }>(`/clients/cpf/${cleanCpf}`);
    if (response.success && response.data) {
      response.data = transformClient(response.data);
    }
    return response as { success: boolean; data: Client };
  },
};

// ============================================
// API DE SLOTS
// ============================================

export interface Slot {
  id: string;
  date: string;
  time: string;
  type: string;
  duration: number;
  isAvailable: boolean;
  bookingId: string | null;
  createdAt: string;
}

function transformSlot(data: any): Slot {
  if (!data) return data;
  const transformed: any = {};
  for (const key in data) {
    transformed[snakeToCamel(key)] = data[key];
  }
  return transformed as Slot;
}

export const slotsApi = {
  async list(params?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    available?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const query = searchParams.toString();
    const response = await request<{ success: boolean; data: any[] }>(`/slots${query ? `?${query}` : ''}`);
    if (response.success && response.data) {
      response.data = response.data.map(transformSlot);
    }
    return response as { success: boolean; data: Slot[] };
  },

  async getAvailable(date: string, type?: string) {
    const query = type ? `?type=${type}` : '';
    const response = await request<{ success: boolean; data: any[] }>(`/slots/available/${date}${query}`);
    if (response.success && response.data) {
      response.data = response.data.map(transformSlot);
    }
    return response as { success: boolean; data: Slot[] };
  },

  async getByDate(date: string) {
    const response = await request<{ success: boolean; data: any[] }>(`/slots/date/${date}`);
    if (response.success && response.data) {
      response.data = response.data.map(transformSlot);
    }
    return response as { success: boolean; data: Slot[] };
  },

  async create(data: { date: string; time: string; type: string; duration?: number }) {
    const response = await request<{ success: boolean; data: any }>('/slots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.success && response.data) {
      response.data = transformSlot(response.data);
    }
    return response as { success: boolean; data: Slot };
  },

  async createMany(slots: Array<{ date: string; time: string; type: string; duration?: number }>) {
    return request<{ success: boolean; count: number }>('/slots/bulk', {
      method: 'POST',
      body: JSON.stringify({ slots }),
    });
  },

  async delete(id: string) {
    return request<{ success: boolean }>(`/slots/${id}`, {
      method: 'DELETE',
    });
  },

  async deleteByDate(date: string) {
    return request<{ success: boolean }>(`/slots/date/${date}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// API DE WHATSAPP
// ============================================

export const whatsappApi = {
  async getStatus() {
    return request<{
      success: boolean;
      data: {
        isReady: boolean;
        qrCode: string | null;
        clientInfo: { name: string; phone: string } | null;
      };
    }>('/whatsapp/status');
  },

  async connect() {
    return request<{ success: boolean; message: string }>('/whatsapp/connect', {
      method: 'POST',
    });
  },

  async disconnect() {
    return request<{ success: boolean; message: string }>('/whatsapp/disconnect', {
      method: 'POST',
    });
  },

  async sendMessage(phone: string, message: string) {
    return request<{ success: boolean; message: string }>('/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({ phone, message }),
    });
  },
};

// ============================================
// API DE MENSAGENS/TEMPLATES
// ============================================

export interface MessageTemplate {
  id: string;
  type: string;
  name: string;
  template: string;
  enabled: boolean;
  updated_at: string;
}

export const messagesApi = {
  async getTemplates() {
    return request<{ success: boolean; data: MessageTemplate[] }>('/messages/templates');
  },

  async getTemplate(type: string) {
    return request<{ success: boolean; data: MessageTemplate }>(`/messages/templates/${type}`);
  },

  async updateTemplate(type: string, data: { name?: string; template?: string; enabled?: boolean }) {
    return request<{ success: boolean; data: MessageTemplate }>(`/messages/templates/${type}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async previewMessage(type: string, data: Record<string, string>) {
    return request<{ success: boolean; data: { message: string } }>('/messages/preview', {
      method: 'POST',
      body: JSON.stringify({ type, data }),
    });
  },

  async sendWithTemplate(type: string, phone: string, data: Record<string, string>) {
    return request<{ success: boolean; message: string }>('/messages/send-template', {
      method: 'POST',
      body: JSON.stringify({ type, phone, data }),
    });
  },
};

// ============================================
// HEALTH CHECK
// ============================================

export async function healthCheck() {
  return request<{
    success: boolean;
    message: string;
    version: string;
    timestamp: string;
  }>('/health');
}

// ============================================
// API DE CONFIGURAÇÕES
// ============================================

export interface Settings {
  late_tolerance_minutes: string;
  no_show_charge_enabled: string;
  no_show_charge_amount: string;
  session_deposit_amount: string;
  session_deposit_required: string;
  [key: string]: string;
}

export const settingsApi = {
  async getAll() {
    return request<{ success: boolean; data: Settings }>('/settings');
  },

  async get(key: string) {
    return request<{ success: boolean; data: { key: string; value: string } }>(`/settings/${key}`);
  },

  async update(key: string, value: string) {
    return request<{ success: boolean; data: { key: string; value: string } }>(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  },

  async updateMany(settings: Partial<Settings>) {
    return request<{ success: boolean; data: Partial<Settings> }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};

// Export default
export default {
  auth: authApi,
  bookings: bookingsApi,
  clients: clientsApi,
  slots: slotsApi,
  whatsapp: whatsappApi,
  messages: messagesApi,
  settings: settingsApi,
  healthCheck,
};
