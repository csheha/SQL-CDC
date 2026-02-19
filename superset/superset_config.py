import os

# ------------------------------
# Secret Key for Flask sessions
# ------------------------------
SECRET_KEY = os.environ.get("SUPERSET_SECRET_KEY")

# Postgres connection for metadata
SQLALCHEMY_DATABASE_URI = "postgresql+psycopg2://superset:superset@db:5432/superset"

# Redis setup
RESULTS_BACKEND = "redis://redis:6379/0"
CACHE_CONFIG = {
    'CACHE_TYPE': 'RedisCache',
    'CACHE_DEFAULT_TIMEOUT': 300,
    'CACHE_KEY_PREFIX': 'superset_',
    'CACHE_REDIS_URL': 'redis://superset_redis:6379/0'
}

# ------------------------------
# CORS Configuration
# ------------------------------
# Read origins from environment variable with fallback
cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://localhost:4200")
cors_origins_list = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]

print(f"🌐 CORS Origins: {cors_origins_list}")  # Debug log

ENABLE_CORS = True
CORS_OPTIONS = {
    "supports_credentials": True,
    "allow_headers": ["*"],
    "resources": ["*"],  # Changed from [r"*"] to ["*"]
    "origins": cors_origins_list,
}

# ------------------------------
# Embedding Configuration
# ------------------------------
# Disable X-Frame-Options for embedding
ENABLE_X_FRAME_OPTIONS = False

# Feature flags
FEATURE_FLAGS = {
    "EMBEDDED_SUPERSET": True,
    "DASHBOARD_RBAC": True,
    "ENABLE_TEMPLATE_PROCESSING": True,
}

# Disable Talisman (security headers) for local development
TALISMAN_ENABLED = False
WTF_CSRF_ENABLED = False

# ------------------------------
# Guest Token Configuration (CRITICAL!)
# ------------------------------
GUEST_ROLE_NAME = "Public"
GUEST_TOKEN_JWT_SECRET = os.environ.get("SUPERSET_SECRET_KEY", "test-secret-change-me")
GUEST_TOKEN_JWT_ALGO = "HS256"
GUEST_TOKEN_JWT_EXP_SECONDS = 300

# ------------------------------
# Session & Security
# ------------------------------
# Allow cookies from embedded iframe
SESSION_COOKIE_HTTPONLY = False
SESSION_COOKIE_SECURE = False
SESSION_COOKIE_SAMESITE = None

# ------------------------------
# Additional Features
# ------------------------------
ENABLE_REACT_CRUD_VIEWS = True
ENABLE_ROW_LEVEL_SECURITY = True
ENABLE_ACCESS_REQUEST = True
PUBLIC_ROLE_LIKE_GAMMA = True
SQLALCHEMY_QUERY_TIMEOUT = 300