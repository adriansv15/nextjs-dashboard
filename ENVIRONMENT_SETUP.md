# Production Environment Setup Guide

## Overview
This guide ensures your app securely handles environment variables in production.

## Local Development Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your credentials in `.env`:**
   - Get `DATABASE_URL` from your database provider (Neon, Vercel Postgres, etc.)
   - Generate `AUTH_SECRET` with: `openssl rand -hex 32`
   - Never commit `.env` to git

3. **Verify the setup works:**
   ```bash
   npm run dev
   ```
   If environment variables are missing, you'll see a clear error message.

## Production Deployment (Vercel)

1. **In Vercel Dashboard:**
   - Go to Project Settings → Environment Variables
   - Add each variable from your `.env`:
     - `AUTH_SECRET`
     - `DATABASE_URL`
     - `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

2. **Do NOT commit `.env` to git** before deploying

## Security Checklist

- ✓ `.env` is in `.gitignore`
- ✓ `.env.example` is committed (with placeholder values only)
- ✓ Environment variables are validated on startup
- ✓ Credentials are rotated (if exposed)
- ✓ Production credentials are different from development

## Environment Variables Required

| Variable | Purpose | Example |
|----------|---------|---------|
| `AUTH_SECRET` | NextAuth.js secret key | Generated via `openssl rand -hex 32` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `PGHOST` | Database host | `host.c-3.us-east-1.aws.neon.tech` |
| `PGUSER` | Database username | `neon_user` |
| `PGPASSWORD` | Database password | Your secure password |
| `PGDATABASE` | Database name | `mydb` |

## Troubleshooting

**Error: Missing required environment variables**
- Make sure you copied `.env.example` to `.env`
- Verify all required variables are set
- Restart your dev server after updating `.env`

**Error: Authentication fails in production**
- Make sure `AUTH_SECRET` is set in Vercel
- Ensure the same `AUTH_SECRET` is used across all production instances
- Never use different secrets in different deployments
