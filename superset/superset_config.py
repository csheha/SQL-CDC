import os

# ------------------------------
# Secret Key for Flask sessions
# ------------------------------
SECRET_KEY = 'l5TxWwEoeFzMzx0e1lS7RZ2c5rXyDxrAZZBKiYQZRC6zidzzTtKtzH-VTLN0lSG0RjD0i'

# Postgres connection for metadata
SQLALCHEMY_DATABASE_URI = "postgresql+psycopg2://superset:superset@db:5432/superset"

# Redis setup
RESULTS_BACKEND = "redis://superset_redis:6379/0"
CACHE_CONFIG = {
    'CACHE_TYPE': 'RedisCache',
    'CACHE_DEFAULT_TIMEOUT': 300,
    'CACHE_KEY_PREFIX': 'superset_',
    'CACHE_REDIS_URL': 'redis://superset_redis:6379/0'
}

# Enable CORS for frontend
ENABLE_CORS = True
CORS_OPTIONS = {
    "supports_credentials": True,
    "allow_headers": ["*"],
    "resources": [r"*"],
     'origins': ['http://localhost:3000', 'your-production-domain.com'],
}
# Disable X-Frame-Options SAMEORIGIN for embedding
ENABLE_X_FRAME_OPTIONS = False

# Enable embedding
FEATURE_FLAGS = {
    "EMBEDDED_SUPERSET": True,
    "DASHBOARD_RBAC": True,  # NEW: Enable dashboard-level permissions
    "ENABLE_TEMPLATE_PROCESSING": True,  # NEW: Enable dynamic filtering
}


# Disable extra security that blocks embedding
TALISMAN_ENABLED = False

# Enable dashboard-level security
ENABLE_REACT_CRUD_VIEWS = True

# NEW: Enable row-level security and access requests
ENABLE_ROW_LEVEL_SECURITY = True
ENABLE_ACCESS_REQUEST = True

# NEW: Additional security features for user-specific dashboards
PUBLIC_ROLE_LIKE_GAMMA = True  # Allows public role to have gamma-like permissions

# NEW: Set a longer timeout for SQL queries (in seconds)
SQLALCHEMY_QUERY_TIMEOUT = 300