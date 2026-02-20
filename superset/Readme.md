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
  Password: ####


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

------------------
### Embedded Dashboard Setup

This README explains how to import a dashboard, configure the database connection, update permissions, and embed the dashboard into your application using Apache Superset.

# 1. Import Dashboard

    Open Superset and navigate to Dashboards.
    Click Import.
    Select the provided ZIP file.
    If prompted, enter the admin password.
    Click Import to complete the process.

# 2. Add Database Connection

    Go to Settings → Databases.
    Click + Database.
    Select SQL Server.
  
    Enter the following connection details:

    SQLAlchemy URI:
    mssql+pyodbc://sa:XXXXXXXXXX@sqlserver-web:1433/InvoiceDB?Encrypt=yes&TrustServerCertificate=yes&driver=ODBC+Driver+18+for+SQL+Server

    Notes:

    Replace XXXXXXXXXX with the SQL Server sa user password.
    If the password contains @, replace it with %40.
    Example database name: Invoices.

    Click Test Connection.
    If successful, click Save.

# 3. Update Dataset Database Connection

    Navigate to Datasets.
    Select your dataset and click Edit Dataset.
    Change the database connection to the newly created database (e.g., Invoices).
    Click Save.

# 4. Configure Public Role Permissions

    Go to Settings → User Roles.
    Select the Public role and click Edit.

    Add the following permissions:
      can read on dataset
      can read on dashboard
      can read on chart
      can embed dashboard

    Click Save.

# 5. Embed the Dashboard

    Open the target Dashboard.

    Add allowed domain (ex:http://localhost:4200)

    Click the Embed button.

    Copy the generated embed code.

    Backend Configuration


# 6. Update the dashboard ID in:

    SQL-CDC/.env
    DASHBOARD_ID=<your_dashboard_id>
    Frontend Configuration

# 7. Update the dashboard ID in:

    frontend/src/environment.ts
    dashboardId: '<your_dashboard_id>'

# 8. Start backend
  cd invoice-api
  npm start

# 9. Start frontend
  cd frontend
  ng serve
