### Option1: Use the runscript.sh automation

    # Make sure the script is executable
    chmod +x ./sqls/runscript.sh

    # Load environment variables from .env
    source .env

    # Run the automation script
    ./sqls/runscript.sh

### Option2: Manual Setup

    # Load environment variables from .env
    source .env

    # Step 1: Copy the SQL scripts to the container
    docker cp sqls/setup-invoice-db.sql $SQLSERVER_CONTAINER:/setup-invoice-db.sql
    docker cp sqls/insert-invoices.sql $SQLSERVER_CONTAINER:/insert-invoices.sql

    # Step 2: Run the SQL scripts using the env variable
    docker exec -i $SQLSERVER_CONTAINER sh -c "/opt/mssql-tools18/bin/sqlcmd -S 127.0.0.1 -U sa -P \$SA_PASSWORD -C -i /setup-invoice-db.sql"
    docker exec -i $SQLSERVER_CONTAINER sh -c "/opt/mssql-tools18/bin/sqlcmd -S 127.0.0.1 -U sa -P \$SA_PASSWORD -C -i /insert-invoices.sql"

    # Step 3: Setup the Superset database
    docker cp sqls/init-superset-db.sql $SQLSERVER_CONTAINER:/init-superset-db.sql
    docker exec -i $SQLSERVER_CONTAINER sh -c "/opt/mssql-tools18/bin/sqlcmd -S 127.0.0.1 -U sa -P \$SA_PASSWORD -C -i /init-superset-db.sql"

    # Optional: Login to SQL Server
    docker exec -it $SQLSERVER_CONTAINER sh -c "/opt/mssql-tools18/bin/sqlcmd -S 127.0.0.1 -U sa -P \$SA_PASSWORD -C"


