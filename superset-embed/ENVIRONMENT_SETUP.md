# Quick Environment Setup

## What Was Done

All hardcoded URLs and IDs have been externalized to environment configuration files.

## Files Created

1. **src/environments/environment.ts** - Development configuration
2. **src/environments/environment.prod.ts** - Production configuration
3. **CONFIGURATION.md** - Detailed documentation

## Configuration Values

### Development (localhost)
```typescript
apiUrl: 'http://localhost:3000'
supersetUrl: 'http://localhost:8088'
dashboardId: '831dce15-b177-4423-bf54-4f439a3624db'
```

### Production (change these!)
```typescript
apiUrl: 'https://api.yourdomain.com'
supersetUrl: 'https://superset.yourdomain.com'
dashboardId: '831dce15-b177-4423-bf54-4f439a3624db'
```

## How to Change Configuration

### For Development
Edit `src/environments/environment.ts`

### For Production
Edit `src/environments/environment.prod.ts`

## No Code Changes Needed

The dashboard component now automatically uses these environment values. You don't need to modify any component code to change URLs or IDs.

## Build Commands

```bash
# Development (uses environment.ts)
npm start

# Production (uses environment.prod.ts)
npm run build
```

## See CONFIGURATION.md for Full Details

Read the complete guide for:
- Adding new environments (staging, testing, etc.)
- Best practices
- Troubleshooting
- Advanced configuration
