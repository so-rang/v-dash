import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        // 빌드 시 또는 DATABASE_URL 미설정 시 빈 클라이언트 반환 방지
        throw new Error('DATABASE_URL is not set');
    }
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool as any);
    return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
    if (globalForPrisma.prisma) return globalForPrisma.prisma;
    const client = createPrismaClient();
    if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = client;
    }
    return client;
}

// lazy getter - prisma가 실제로 사용될 때만 초기화
export const prisma = new Proxy({} as PrismaClient, {
    get(_target, prop) {
        const client = getPrismaClient();
        return Reflect.get(client, prop);
    },
});
