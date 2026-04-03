# Turso Database Setup for Vercel Deployment

This guide helps you migrate from SQLite to Turso for serverless deployment on Vercel.

## Why Turso?

- ✅ **SQLite-compatible**: Keep your existing SQL queries
- ✅ **Serverless-ready**: Works perfectly with Vercel functions
- ✅ **Edge replication**: Global performance
- ✅ **Free tier**: 500 databases, 1B row reads/month
- ✅ **Zero code changes**: Drop-in SQLite replacement

## Setup Steps

### 1. Install Turso CLI

```bash
# macOS/Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Or via Homebrew
brew install tursodatabase/tap/turso
```

### 2. Create Turso Account & Database

```bash
# Authenticate
turso auth signup

# Create your database
turso db create matts-corner-restaurants

# Get database URL
turso db show matts-corner-restaurants --url

# Create auth token
turso db tokens create matts-corner-restaurants
```

### 3. Configure Environment Variables

Add to your `.env.local`:

```bash
# Turso Database Configuration
TURSO_DATABASE_URL=libsql://your-database-url.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here
```

Add to your **Vercel environment variables** (Production):
- `TURSO_DATABASE_URL`: Your database URL from step 2
- `TURSO_AUTH_TOKEN`: Your auth token from step 2

### 4. Migrate Your Data

```bash
# Install dependencies
npm install

# Run migration
npm run migrate:turso
```

### 5. Update Your Code

The migration is already prepared! Just update your imports:

```typescript
// OLD (doesn't work on Vercel)
import RestaurantRepository from '@/lib/database';

// NEW (works everywhere)
import RestaurantRepository from '@/lib/database-turso';
```

**The API routes are already updated for you!**

### 6. Test Locally

```bash
# Start development server
npm run dev

# Verify it works with Turso
curl http://localhost:3000/api/restaurants
```

### 7. Deploy to Vercel

```bash
# Deploy with environment variables set
vercel --prod
```

## How It Works

### Development Mode
- **Without Turso env vars**: Uses local SQLite file
- **With Turso env vars**: Uses Turso cloud database

### Production Mode (Vercel)
- Always uses Turso cloud database
- Automatically creates tables on first run
- Supports all your existing queries

## Performance Improvements

The Turso version includes several optimizations:

1. **Pagination**: Added `limit` and `offset` for large datasets
2. **Better indexes**: Added coordinate indexing for map queries
3. **Batch operations**: Faster bulk inserts
4. **Connection pooling**: Reused connections
5. **Async operations**: Non-blocking database calls

## Troubleshooting

### Common Issues

1. **"Database not found"**
   ```bash
   turso db list  # Check if database exists
   ```

2. **"Invalid auth token"**
   ```bash
   turso db tokens create matts-corner-restaurants  # Generate new token
   ```

3. **"Connection failed"**
   - Check your internet connection
   - Verify environment variables are set correctly

### Debugging

Enable debug logging by adding to `.env.local`:
```bash
DEBUG=libsql*
```

## Cost & Limits

### Turso Free Tier (More than enough for personal use)
- **Databases**: 500
- **Row reads**: 1 billion/month  
- **Row writes**: 25 million/month
- **Storage**: 9 GB total
- **Locations**: 3

### Typical Usage (Restaurant app)
- **~100 restaurants**: ~0.01 MB storage
- **Daily usage**: ~1000 reads, ~10 writes
- **Monthly**: ~30k reads, ~300 writes
- **Cost**: $0 (well within free tier)

## Alternative Options

If you prefer other solutions:

### Neon (PostgreSQL)
```bash
npm install @neondatabase/serverless
```

### Supabase (PostgreSQL + Features)  
```bash
npm install @supabase/supabase-js
```

### PlanetScale (MySQL)
```bash
npm install @planetscale/database
```

---

## Summary

Turso gives you:
- **Same SQLite syntax** (no learning curve)
- **Vercel compatibility** (serverless-ready)
- **Better performance** (edge replication)
- **Zero cost** (free tier)
- **Minimal changes** (drop-in replacement)

Perfect for your restaurant tracker! 🍕