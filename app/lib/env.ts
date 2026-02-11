/**
 * Environment variable validation
 * Ensures all required env vars are set at runtime
 */

const requiredEnvVars = [
  'AUTH_SECRET',
  'DATABASE_URL',
  'PGUSER',
  'PGDATABASE',
  'PGPASSWORD',
] as const;

function validateEnv() {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please copy .env.example to .env and fill in the required values.'
    );
  }
}

// Validate on import
if (typeof window === 'undefined') {
  // Server-side only
  validateEnv();
}

export { validateEnv };
