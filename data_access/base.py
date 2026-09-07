"""
Base Repository - Common database operations
"""
import sqlite3
import pandas as pd
import config
from utils.logger import get_logger

logger = get_logger(__name__)


class BaseRepository:
    """Base class for all repositories with common DB operations."""

    def __init__(self):
        self.db_path = config.DATABASE_PATH

    def get_connection(self) -> sqlite3.Connection:
        """Get database connection."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def execute_query(self, query: str, params: tuple = ()) -> pd.DataFrame:
        """Execute SELECT query and return DataFrame."""
        try:
            conn = self.get_connection()
            df = pd.read_sql_query(query, conn, params=params)
            conn.close()
            return df
        except Exception as e:
            logger.error(f"Query error: {e}")
            raise

    def execute_write(self, query: str, params: tuple = ()) -> bool:
        """Execute INSERT/UPDATE/DELETE query."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Write error: {e}")
            raise

    def execute_many(self, query: str, params_list: list) -> bool:
        """Execute batch write operations."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.executemany(query, params_list)
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Batch write error: {e}")
            raise
