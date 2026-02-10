# Use Superset 5.0.0 base image
FROM apache/superset:5.0.0

USER root

ENV PLAYWRIGHT_BROWSERS_PATH=/usr/local/share/playwright-browsers

# Install system dependencies + ODBC
RUN apt-get update && apt-get install -y \
    vim \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    libpq-dev \
    python3-dev \
    unixodbc \
    unixodbc-dev \
    curl \
    gnupg \
    apt-transport-https \
    && rm -rf /var/lib/apt/lists/*

# ---- FIXED: Proper Microsoft GPG key handling (Debian 12) ----
RUN curl -fsSL https://packages.microsoft.com/keys/microsoft.asc \
    | gpg --dearmor \
    | tee /usr/share/keyrings/microsoft-prod.gpg > /dev/null

RUN echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] \
    https://packages.microsoft.com/debian/12/prod bookworm main" \
    > /etc/apt/sources.list.d/mssql-release.list

RUN apt-get update && \
    ACCEPT_EULA=Y apt-get install -y msodbcsql18 && \
    rm -rf /var/lib/apt/lists/*

# Python packages (ONLY add pyodbc)
RUN . /app/.venv/bin/activate && \
    uv pip install \
    flask-cors \
    psycopg2 \
    psycopg2-binary \
    mysqlclient \
    redis \
    pillow \
    openpyxl \
    pyodbc

# Playwright
# RUN playwright install-deps && \
#     PLAYWRIGHT_BROWSERS_PATH=/usr/local/share/playwright-browsers playwright install chromium

USER superset

ENV SUPERSET_HOME=/app/superset_home
ENV LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1

CMD ["/app/docker/entrypoints/run-server.sh"]
