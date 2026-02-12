## 1️⃣ First-Time Superset Build

Run these commands manually **inside the Superset container** (or your environment) to initialize Superset:


# Upgrade Superset metadata database (idempotent)
superset db upgrade || true

# Create admin user (only if it doesn't already exist)
superset fab create-admin --username admin --firstname Admin --lastname User --email admin@example.com --password admin || echo "ℹ️ Admin already exists"

# Initialize roles, permissions, and example data (idempotent)
superset init || true

## Then Login to Superset

  http://localhost:8088

  Username: admin
  Password: admin


## 2️⃣ Add a new Database to Superset:

1. Go to Settings → Databases
2. Click "+ Database"
3. Select "SQL Server"
4. Fill in the connection details:

    - SQLAlchemy URI: 
    mssql+pyodbc://sa:XXXXXXXXXX@sqlserver-web:1433/InvoiceDB?Encrypt=yes&TrustServerCertificate=yes&driver=ODBC+Driver+18+for+SQL+Server

    (Here XXXXXXXXXX is the password for the sa user in SQL Server )
    (if password contain @ should be replaced with %40)

   - Database name: InvoiceDB

5. Test connection
6. Save