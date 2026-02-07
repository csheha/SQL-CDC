To Add a new Database to Superset:

1. Go to Settings → Databases
2. Click "+ Database"
3. Select "SQL Server"
4. Fill in the connection details:

    - SQLAlchemy URI: 
    mssql+pyodbc://sa:XXXXXXXXXX@sqlserver-web:1433/InvoiceDB?Encrypt=yes&TrustServerCertificate=yes&driver=ODBC+Driver+18+for+SQL+Server

    (Here XXXXXXXXXX is the password for the sa user in SQL Server)

   - Database name: InvoiceDB

5. Test connection
6. Save