import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import postgres from 'postgres';

vi.mock('postgres', () => ({ default: vi.fn(() => { throw new Error('connection factory reached'); }) }));
describe('isolated database connection guard', () => {
  beforeEach(() => {
    vi.resetModules(); vi.clearAllMocks();
    for (const name of ['VERCEL','POSTGRES_URL','POSTGRES_PRISMA_URL','POSTGRES_URL_NON_POOLING']) vi.stubEnv(name,'');
    vi.stubEnv('MCP_LOCAL_DATABASE','true');
  });
  afterEach(() => vi.unstubAllEnvs());
  it.each([
    'postgresql://postgres:example@db.example.org:5432/postgres',
    'postgresql://postgres:example@127.0.0.1:5432/postgres',
    'postgresql://postgres:example@127.0.0.1:55432/production',
    'postgresql://postgres:example@localhost:55432/postgres',
  ])('rejects unexpected destination before opening a client: %s',async (url) => {
    vi.stubEnv('DATABASE_URL',url);
    await expect(import('@/db')).rejects.toThrow('isolated loopback endpoint');
    expect(postgres).not.toHaveBeenCalled();
  });
  it('accepts only the dedicated loopback endpoint in local mode',async () => {
    vi.stubEnv('DATABASE_URL','postgresql://postgres:example@127.0.0.1:55432/postgres');
    await expect(import('@/db')).rejects.toThrow('connection factory reached');
    expect(postgres).toHaveBeenCalledWith(expect.any(String),expect.objectContaining({max:1}));
  });
  it('preserves ordinary database selection when local mode is disabled',async () => {
    vi.stubEnv('MCP_LOCAL_DATABASE','false');
    vi.stubEnv('DATABASE_URL','postgresql://postgres:example@db.example.org:5432/postgres');
    await expect(import('@/db')).rejects.toThrow('connection factory reached');
    expect(postgres).toHaveBeenCalledTimes(1);
  });
});
