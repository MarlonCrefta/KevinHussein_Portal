/**
 * Testes — Schemas de Validação (Zod)
 * 
 * Testa validação de CPF, telefone, schemas de auth, booking, client
 */

import { describe, it, expect } from 'vitest';
import { authSchemas, clientSchemas, bookingSchemas, slotSchemas } from '../src/middleware/validation.js';

describe('Auth Schemas', () => {
  describe('login', () => {
    it('aceita credenciais válidas', () => {
      const result = authSchemas.login.safeParse({
        username: 'kevin',
        password: 'Senha12345',
      });
      expect(result.success).toBe(true);
    });

    it('rejeita username curto', () => {
      const result = authSchemas.login.safeParse({
        username: 'ab',
        password: 'Senha12345',
      });
      expect(result.success).toBe(false);
    });

    it('rejeita senha < 8 chars', () => {
      const result = authSchemas.login.safeParse({
        username: 'kevin',
        password: '1234567',
      });
      expect(result.success).toBe(false);
    });

    it('rejeita campos vazios', () => {
      const result = authSchemas.login.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('register', () => {
    it('aceita registro válido', () => {
      const result = authSchemas.register.safeParse({
        username: 'novouser',
        password: 'SenhaForte123',
        name: 'Novo Usuário',
      });
      expect(result.success).toBe(true);
    });

    it('aceita role opcional', () => {
      const result = authSchemas.register.safeParse({
        username: 'admin2',
        password: 'SenhaForte123',
        name: 'Admin 2',
        role: 'admin',
      });
      expect(result.success).toBe(true);
      expect(result.data.role).toBe('admin');
    });

    it('rejeita role inválida', () => {
      const result = authSchemas.register.safeParse({
        username: 'admin2',
        password: 'SenhaForte123',
        name: 'Admin 2',
        role: 'superadmin',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Client Schemas', () => {
  describe('CPF validation', () => {
    it('aceita CPF válido (números)', () => {
      const result = clientSchemas.create.safeParse({
        name: 'João Silva',
        phone: '41999308946',
        cpf: '52998224725',
      });
      expect(result.success).toBe(true);
    });

    it('aceita CPF válido com máscara', () => {
      const result = clientSchemas.create.safeParse({
        name: 'João Silva',
        phone: '41999308946',
        cpf: '529.982.247-25',
      });
      expect(result.success).toBe(true);
    });

    it('rejeita CPF com dígitos repetidos', () => {
      const result = clientSchemas.create.safeParse({
        name: 'João Silva',
        phone: '41999308946',
        cpf: '11111111111',
      });
      expect(result.success).toBe(false);
    });

    it('rejeita CPF com checksum inválido', () => {
      const result = clientSchemas.create.safeParse({
        name: 'João Silva',
        phone: '41999308946',
        cpf: '52998224726',
      });
      expect(result.success).toBe(false);
    });

    it('aceita CPF vazio (opcional)', () => {
      const result = clientSchemas.create.safeParse({
        name: 'João Silva',
        phone: '41999308946',
        cpf: '',
      });
      expect(result.success).toBe(true);
    });

    it('aceita sem CPF (opcional)', () => {
      const result = clientSchemas.create.safeParse({
        name: 'João Silva',
        phone: '41999308946',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Phone validation', () => {
    it('aceita telefone com 11 dígitos', () => {
      const result = clientSchemas.create.safeParse({
        name: 'Test',
        phone: '41999308946',
      });
      expect(result.success).toBe(true);
    });

    it('aceita telefone com 10 dígitos', () => {
      const result = clientSchemas.create.safeParse({
        name: 'Test',
        phone: '4133224455',
      });
      expect(result.success).toBe(true);
    });

    it('aceita telefone formatado', () => {
      const result = clientSchemas.create.safeParse({
        name: 'Test',
        phone: '(41)99930-8946',
      });
      expect(result.success).toBe(true);
    });

    it('rejeita telefone curto', () => {
      const result = clientSchemas.create.safeParse({
        name: 'Test',
        phone: '12345',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Booking Schemas', () => {
  const validBooking = {
    type: 'reuniao',
    date: '2026-04-15',
    time: '14:00',
    clientName: 'João Silva',
    clientPhone: '41999308946',
  };

  it('aceita agendamento válido', () => {
    const result = bookingSchemas.create.safeParse(validBooking);
    expect(result.success).toBe(true);
  });

  it('rejeita tipo inválido', () => {
    const result = bookingSchemas.create.safeParse({
      ...validBooking,
      type: 'corte_cabelo',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita data em formato errado', () => {
    const result = bookingSchemas.create.safeParse({
      ...validBooking,
      date: '15/04/2026',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita horário em formato errado', () => {
    const result = bookingSchemas.create.safeParse({
      ...validBooking,
      time: '2pm',
    });
    expect(result.success).toBe(false);
  });

  it('aceita todos os tipos válidos', () => {
    const types = ['reuniao', 'teste_anatomico', 'sessao', 'retoque'];
    types.forEach(type => {
      const result = bookingSchemas.create.safeParse({ ...validBooking, type });
      expect(result.success).toBe(true);
    });
  });

  it('aceita duração dentro do limite', () => {
    const result = bookingSchemas.create.safeParse({
      ...validBooking,
      duration: 120,
    });
    expect(result.success).toBe(true);
  });

  it('rejeita duração > 480min', () => {
    const result = bookingSchemas.create.safeParse({
      ...validBooking,
      duration: 600,
    });
    expect(result.success).toBe(false);
  });

  describe('update status', () => {
    it('aceita status válidos', () => {
      const statuses = ['pendente', 'confirmado', 'concluido', 'cancelado', 'nao_compareceu'];
      statuses.forEach(status => {
        const result = bookingSchemas.updateStatus.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });

    it('rejeita status inválido', () => {
      const result = bookingSchemas.updateStatus.safeParse({ status: 'em_andamento' });
      expect(result.success).toBe(false);
    });
  });
});

describe('Slot Schemas', () => {
  it('aceita slot válido', () => {
    const result = slotSchemas.create.safeParse({
      date: '2026-04-15',
      time: '10:00',
      type: 'sessao',
    });
    expect(result.success).toBe(true);
  });

  it('aceita array de slots', () => {
    const result = slotSchemas.createMany.safeParse({
      slots: [
        { date: '2026-04-15', time: '10:00', type: 'sessao' },
        { date: '2026-04-15', time: '14:00', type: 'reuniao' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejeita array vazio de slots', () => {
    const result = slotSchemas.createMany.safeParse({ slots: [] });
    expect(result.success).toBe(false);
  });
});
