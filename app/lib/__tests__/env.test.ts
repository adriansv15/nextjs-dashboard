import { validateEnv } from '../env';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should not throw when all required env vars are set', () => {
    process.env.AUTH_SECRET = 'test-secret-123';
    process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
    process.env.PGUSER = 'testuser';
    process.env.PGDATABASE = 'testdb';
    process.env.PGPASSWORD = 'testpass';

    expect(() => {
      validateEnv();
    }).not.toThrow();
  });

  it('should throw error when AUTH_SECRET is missing', () => {
    process.env.AUTH_SECRET = undefined;
    process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
    process.env.PGUSER = 'testuser';
    process.env.PGDATABASE = 'testdb';
    process.env.PGPASSWORD = 'testpass';

    expect(() => {
      validateEnv();
    }).toThrow('Missing required environment variables: AUTH_SECRET');
  });

  it('should throw error when DATABASE_URL is missing', () => {
    process.env.AUTH_SECRET = 'test-secret-123';
    process.env.DATABASE_URL = undefined;
    process.env.PGUSER = 'testuser';
    process.env.PGDATABASE = 'testdb';
    process.env.PGPASSWORD = 'testpass';

    expect(() => {
      validateEnv();
    }).toThrow('Missing required environment variables: DATABASE_URL');
  });

  it('should throw error when multiple env vars are missing', () => {
    process.env.AUTH_SECRET = undefined;
    process.env.DATABASE_URL = undefined;
    process.env.PGUSER = 'testuser';
    process.env.PGDATABASE = undefined;
    process.env.PGPASSWORD = 'testpass';

    expect(() => {
      validateEnv();
    }).toThrow('Missing required environment variables: AUTH_SECRET, DATABASE_URL, PGDATABASE');
  });

  it('should include helpful error message', () => {
    process.env.AUTH_SECRET = undefined;
    process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
    process.env.PGUSER = 'testuser';
    process.env.PGDATABASE = 'testdb';
    process.env.PGPASSWORD = 'testpass';

    try {
      validateEnv();
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('Please copy .env.example to .env');
    }
  });
});
