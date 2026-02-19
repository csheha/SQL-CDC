# Invoice API

Express.js API server for processing invoice changes from SQL Server using Change Tracking and saving them as BSON files.

## Features

- Change Tracking integration with SQL Server
- BSON file generation for invoices
- Guest token generation for Superset dashboard embedding
- Performance tracking and metrics
- Multiple consumer support with position tracking

## Prerequisites

- Node.js 18+
- SQL Server with Change Tracking enabled
- Running Superset instance (for guest token endpoint)

## Installation

```bash
npm install
```

## Configuration

All configuration is managed through environment variables in the `.env` file located in the project root.

### Required Environment Variables

```env
# Database
DB_SERVER=localhost
MSSQL_USER=sa
MSSQL_SA_PASSWORD=StrongPass@123
MSSQL_DB=InvoiceDB
DB_PORT=1433
DB_ENCRYPT=false

# API
API_PORT=3000

# Superset
SUPERSET_URL=http://localhost:8088
SUPERSET_USERNAME=admin
SUPERSET_PASSWORD=admin
```

See **ENVIRONMENT_VARIABLES.md** in the project root for complete documentation.

## Running

```bash
npm start
```

Server runs on http://localhost:3000

## API Endpoints

### 1. Get Invoice Changes

```
GET /api/invoices/changes?syncName=MyApp&limit=1000
```

Fetches changed invoices since last sync and saves them as BSON files.

**Query Parameters:**
- `syncName` (optional): Consumer name for tracking position (default: "DefaultConsumer")
- `limit` (optional): Maximum number of invoices to fetch (default: 1000)

**Response:**
```json
{
  "consumer": "MyApp",
  "fromVersion": 0,
  "toVersion": 1234,
  "processedUpTo": 1234,
  "lastInvoiceId": 5678,
  "hasMore": false,
  "count": 100,
  "saved": 100,
  "failed": 0,
  "performance": {
    "totalTimeMs": 1234,
    "throughput": {
      "invoicesPerSecond": "81.30",
      "filesPerSecond": "125.00"
    }
  }
}
```

### 2. List BSON Files

```
GET /api/files
```

Lists all saved BSON files.

**Response:**
```json
{
  "folder": "../invoices-output/processed",
  "count": 100,
  "files": [
    {
      "filename": "INV-001_v1_20260219_120000.bson",
      "size": 2048,
      "created": "2026-02-19T12:00:00.000Z"
    }
  ]
}
```

### 3. Read BSON File

```
GET /api/files/:filename
```

Reads and deserializes a specific BSON file.

**Response:**
```json
{
  "invoiceId": 1,
  "invoiceNumber": "INV-001",
  "customerCode": "CUST-001",
  "invoiceDate": "2026-02-19T00:00:00.000Z",
  "totalAmount": 1000.00,
  "changeVersion": 1234,
  "lines": [...]
}
```

### 4. Reset Consumer

```
POST /api/consumers/:name/reset
```

Resets a consumer's position to version 0.

**Response:**
```json
{
  "message": "Reset MyApp to version 0",
  "durationMs": 45
}
```

### 5. Get Guest Token (for Superset)

```
POST /api/guest-token
```

Generates a guest token for Superset dashboard embedding.

**Request Body:**
```json
{
  "dashboardId": "831dce15-b177-4423-bf54-4f439a3624db"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Output Directories

- `../invoices-output/processed/` - Successfully processed BSON files
- `../invoices-output/error/` - Failed processing attempts

## BSON File Naming

Files are named: `{invoiceNumber}_v{changeVersion}_{timestamp}.bson`

Example: `INV-001_v1234_20260219_120000.bson`

## Performance Tracking

The API tracks and reports:
- Database query time
- Data parsing time
- BSON file save time
- State update time
- Overall throughput (invoices/second)

## Database Requirements

### Change Tracking Table

```sql
CREATE TABLE ChangeTrackingSyncState (
    SyncName VARCHAR(100) PRIMARY KEY,
    LastSyncVersion BIGINT NOT NULL,
    LastProcessedInvoiceId INT NOT NULL,
    LastSyncTime DATETIME2
);
```

### Stored Procedure

The API uses `sp_GetInvoiceChanges` stored procedure for efficient change retrieval.

## CORS Configuration

CORS is enabled for all origins. Modify in server.js if needed:

```javascript
app.use(cors({
  origin: 'http://localhost:4200'
}));
```

## Dependencies

- express: Web server
- mssql: SQL Server client
- bson: BSON serialization
- cors: CORS middleware
- dotenv: Environment variables
- node-fetch: HTTP client for Superset API

## License

ISC
