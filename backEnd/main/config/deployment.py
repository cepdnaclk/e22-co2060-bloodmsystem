"""
Deployment settings module alias.
The unified production configuration is dynamically handled in config.settings
via standard environment variables (DATABASE_URL, DJANGO_SECRET_KEY, ALLOWED_HOSTS, etc.).
"""
from config.settings import *
