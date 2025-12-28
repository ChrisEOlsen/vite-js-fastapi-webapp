import logging
import os
from logging.handlers import RotatingFileHandler

# Create a logs directory if it doesn't exist
LOGS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs")
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

def get_file_handler(log_file):
    """Returns a rotating file handler with standard formatting."""
    handler = RotatingFileHandler(os.path.join(LOGS_DIR, log_file), maxBytes=5*1024*1024, backupCount=5)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    
    # Add filter to rename 'uvicorn.error' -> 'uvicorn'
    handler.addFilter(UvicornLogFilter())
    return handler

class UvicornLogFilter(logging.Filter):
    """
    Renames 'uvicorn.error' logger to 'uvicorn' for clarity.
    Uvicorn uses 'uvicorn.error' for standard INFO logs (startup/shutdown), which is confusing.
    """
    def filter(self, record):
        if record.name == "uvicorn.error":
            record.name = "uvicorn"
        return True

# --- Centralized Logging Configuration ---
# Mirror container logs to a file for AI auditing while keeping stdout/stderr for the user.

# 1. Setup the main file handler
main_file_handler = get_file_handler("backend.log")

# 2. Configure the Root Logger
# This captures all logs from the app and most libraries.
# We ONLY attach the handler here to avoid duplicate logs when children propagate.
root_logger = logging.getLogger()
root_logger.addHandler(main_file_handler)
if root_logger.level == logging.NOTSET:
    root_logger.setLevel(logging.INFO)

# 3. Explicitly link Uvicorn and FastAPI loggers
# We ensure 'propagate=True' so they bubble up to the root logger (and our file handler).
# We do NOT add the handler directly to them, preventing duplication.
for logger_name in ["uvicorn", "uvicorn.error", "uvicorn.access", "fastapi"]:
    lib_logger = logging.getLogger(logger_name)
    lib_logger.propagate = True

# 4. Create the specific application logger for convenience
backend_logger = logging.getLogger("backend")
backend_logger.setLevel(logging.INFO)
# (Inherits file handler from root)