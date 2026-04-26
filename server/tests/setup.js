/**
 * Setup de testes — Kevin Hussein Tattoo Studio (Backend)
 * 
 * Configura variáveis de ambiente para testes
 */

import { existsSync, unlinkSync } from 'fs';
import { resolve } from 'path';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-not-for-production';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-not-for-production';
process.env.ADMIN_USERNAME = 'testadmin';
process.env.ADMIN_PASSWORD = 'TestPassword123!';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.DATABASE_PATH = './data/test-database.sqlite';

// Limpa estado de banco persistido entre execucoes para evitar conflitos em testes de API.
const baseDbPath = resolve(process.cwd(), 'data', 'test-database.sqlite');
const dbArtifacts = [baseDbPath, `${baseDbPath}-wal`, `${baseDbPath}-shm`];

for (const filePath of dbArtifacts) {
	if (existsSync(filePath)) {
		unlinkSync(filePath);
	}
}
