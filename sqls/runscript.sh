#!/bin/bash
set -e

# Load .env safely
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo ".env file not found!"
    exit 1
fi

echo "Starting SQL Server setup for InvoiceDB and SupersetDB..."

# -------------------------------
# Step 1: Setup Invoice Database
# -------------------------------
echo "Copying Invoice SQL scripts to container..."
docker cp sqls/setup-invoice-db.sql $SQLSERVER_CONTAINER:/setup-invoice-db.sql
docker cp sqls/insert-invoices.sql $SQLSERVER_CONTAINER:/insert-invoices.sql
docker cp sqls/vw_Invoicedetails.sql $SQLSERVER_CONTAINER:/vw_Invoicedetails.sql
docker cp sqls/storedprocedure.sql $SQLSERVER_CONTAINER:/storedprocedure.sql
docker cp sqls/fn_get_customer_invoices.sql $SQLSERVER_CONTAINER:/fn_get_customer_invoices.sql

echo "Running setup-invoice-db.sql..."
MSYS_NO_PATHCONV=1 docker exec -i "$SQLSERVER_CONTAINER" sh -c "/opt/mssql-tools18/bin/sqlcmd -S 127.0.0.1 -U sa -P \"$SA_PASSWORD\" -C -i /setup-invoice-db.sql"

echo "Running insert-invoices.sql..."
MSYS_NO_PATHCONV=1 docker exec -i "$SQLSERVER_CONTAINER" sh -c "/opt/mssql-tools18/bin/sqlcmd -S 127.0.0.1 -U sa -P \"$SA_PASSWORD\" -C -i /insert-invoices.sql"

echo "Running vw_Invoicedetails.sql..."
MSYS_NO_PATHCONV=1 docker exec -i "$SQLSERVER_CONTAINER" sh -c "/opt/mssql-tools18/bin/sqlcmd -S 127.0.0.1 -U sa -P \"$SA_PASSWORD\" -C -i /vw_Invoicedetails.sql"

echo "Running storedprocedure.sql..."
MSYS_NO_PATHCONV=1 docker exec -i "$SQLSERVER_CONTAINER" sh -c "/opt/mssql-tools18/bin/sqlcmd -S 127.0.0.1 -U sa -P \"$SA_PASSWORD\" -C -i /storedprocedure.sql"

echo "Running fn_get_customer_invoices.sql..."
MSYS_NO_PATHCONV=1 docker exec -i "$SQLSERVER_CONTAINER" sh -c "/opt/mssql-tools18/bin/sqlcmd -S 127.0.0.1 -U sa -P \"$SA_PASSWORD\" -C -i /fn_get_customer_invoices.sql"

# -------------------------------
# Step 2: Setup Superset Database
# -------------------------------
echo "Copying Superset SQL script to container..."
docker cp sqls/init-superset-db.sql $SQLSERVER_CONTAINER:/init-superset-db.sql

echo "Running init-superset-db.sql..."
MSYS_NO_PATHCONV=1 docker exec -i "$SQLSERVER_CONTAINER" sh -c "/opt/mssql-tools18/bin/sqlcmd -S 127.0.0.1 -U sa -P \"$SA_PASSWORD\" -C -i /init-superset-db.sql"

echo "SQL Server setup completed successfully!"
