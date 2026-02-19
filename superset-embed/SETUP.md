# Superset Embed - Angular Application

## Overview

This Angular 21 application embeds a Superset dashboard using the `@superset-ui/embedded-sdk`.

**Dashboard ID:** `831dce15-b177-4423-bf54-4f439a3624db`

## Prerequisites

- Node.js 20+
- npm 6.14.18+
- Running Superset instance at http://localhost:8088

## Installation

```bash
npm install
```

## Development Server

```bash
npm start
```

Navigate to http://localhost:4200

## Configuration

### Dashboard Component

The dashboard is configured in `src/app/dashboard/dashboard.component.ts`:

```typescript
id: '831dce15-b177-4423-bf54-4f439a3624db'
supersetDomain: 'http://localhost:8088'
```

### Guest Token

The component fetches guest tokens directly from Superset at:
```
http://localhost:8088/api/v1/security/guest_token/
```

## Superset Configuration Required

### 1. Enable Dashboard Embedding

1. Login to Superset (http://localhost:8088)
2. Go to Dashboards
3. Find your dashboard
4. Edit → Settings → Check "Embedded"
5. Save

### 2. Grant Public Role Permissions

```bash
docker exec -it superset_sqlcdc superset fab add-permission-to-role --role Public --permission "can read" --view-menu "Dashboard"

docker exec -it superset_sqlcdc superset fab add-permission-to-role --role Public --permission "can read" --view-menu "Chart"

docker exec -it superset_sqlcdc superset fab add-permission-to-role --role Public --permission "can read" --view-menu "Dataset"
```

### 3. Enable CORS in Superset

In `superset_config.py`:

```python
CORS_OPTIONS = {
    'supports_credentials': True,
    'allow_headers': ['*'],
    'origins': ['http://localhost:4200']
}

FEATURE_FLAGS = {
    "EMBEDDED_SUPERSET": True,
}
```

## Project Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── dashboard.component.ts    # Main dashboard component
│   │   ├── dashboard.component.html  # Template with container
│   │   └── dashboard.component.css   # Styles
│   ├── app.ts                        # Root component
│   ├── app.routes.ts                 # Route configuration
│   └── app.config.ts                 # App configuration
├── main.ts                           # Bootstrap
└── index.html                        # HTML entry point
```

## Build

```bash
npm run build
```

Build artifacts will be in `dist/superset-embed/browser/`

## Troubleshooting

### Dashboard Not Loading

1. Check browser console (F12) for errors
2. Verify Superset is running at http://localhost:8088
3. Ensure dashboard embedding is enabled
4. Check Public role has required permissions

### CORS Errors

- Verify CORS_OPTIONS in superset_config.py includes http://localhost:4200
- Restart Superset after config changes

### Guest Token Errors

Test the endpoint:
```bash
curl -X POST http://localhost:8088/api/v1/security/guest_token/ \
  -H "Content-Type: application/json" \
  -d '{
    "resources": [{"type": "dashboard", "id": "831dce15-b177-4423-bf54-4f439a3624db"}],
    "rls": [],
    "user": {"username": "guest"}
  }'
```

## Technologies

- Angular 21.1.0
- @superset-ui/embedded-sdk 0.3.0
- TypeScript 5.9.2
- RxJS 7.8.0

## License

Private
