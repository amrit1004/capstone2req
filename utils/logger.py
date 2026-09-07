"""
Centralized Logging Configuration for Medical Insights Engine

Usage:
    from utils.logger import get_logger
    logger = get_logger(__name__)

    logger.info("Processing started")
    logger.error("Something failed", exc_info=True)
    logger.debug("Debug details")
"""

import logging
import sys
from pathlib import Path
from datetime import datetime


# Log format constants
LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)-20s | %(message)s"
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# Log directory
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

# Log file with date
LOG_FILE = LOG_DIR / f"app_{datetime.now().strftime('%Y%m%d')}.log"


def setup_logging(level: str = "INFO") -> None:
    """
    Configure root logger with console and file handlers.
    Call once at application startup.
    """
    log_level = getattr(logging, level.upper(), logging.INFO)

    # Root logger config
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Clear existing handlers
    root_logger.handlers.clear()

    # Console handler (INFO and above)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(logging.Formatter(LOG_FORMAT, LOG_DATE_FORMAT))
    root_logger.addHandler(console_handler)

    # File handler (DEBUG and above)
    file_handler = logging.FileHandler(LOG_FILE, encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(logging.Formatter(LOG_FORMAT, LOG_DATE_FORMAT))
    root_logger.addHandler(file_handler)

    # Reduce noise from third-party libraries
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for a module.

    Args:
        name: Module name, typically __name__

    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)


# Convenience loggers for different components
class LoggerMixin:
    """Mixin class to add logging capability to any class."""

    @property
    def logger(self) -> logging.Logger:
        return get_logger(self.__class__.__name__)
