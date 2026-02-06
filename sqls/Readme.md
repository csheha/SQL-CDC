### Step 1: Setup the database in SQL Server

# Step 1: Copy the SQL scripts to the container
docker cp sqls/setup-invoice-db.sql sqlserver-web:/setup-invoice-db.sql
docker cp sqls/insert-invoices.sql sqlserver-web:/insert-invoices.sql


# Step 2: Run the SQL scripts
docker exec -it sqlserver-web sh
/opt/mssql-tools18/bin/sqlcmd -S 127.0.0.1 -U sa -P "StrongPass@123" -C -i /setup-invoice-db.sql
/opt/mssql-tools18/bin/sqlcmd -S 127.0.0.1 -U sa -P "StrongPass@123" -C -i /insert-invoices.sql


# To Login to SQL Server
/opt/mssql-tools18/bin/sqlcmd -S 127.0.0.1 -U sa -P "StrongPass@123" -C


