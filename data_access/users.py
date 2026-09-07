"""
Users Repository - User authentication data operations
"""
from typing import Optional
import hashlib
import pandas as pd
from data_access.base import BaseRepository
from utils.logger import get_logger

logger = get_logger(__name__)


class UsersRepository(BaseRepository):
    """Repository for user data operations."""

    def _hash_password(self, password: str) -> str:
        """Hash password using SHA-256."""
        return hashlib.sha256(password.encode()).hexdigest()

    def create(
        self,
        username: str,
        email: str,
        password: str,
        role: str = "clinician",
        is_evaluator: bool = False
    ) -> dict:
        """Create new user."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO users
                   (username, email, password_hash, role, is_evaluator)
                   VALUES (?, ?, ?, ?, ?)""",
                (username, email, self._hash_password(password), role, is_evaluator)
            )
            conn.commit()
            user_id = cursor.lastrowid
            conn.close()

            logger.debug(f"User created: {username}")
            return {'success': True, 'user_id': user_id}
        except Exception as e:
            if 'UNIQUE constraint' in str(e):
                return {'success': False, 'error': 'Username or email already exists'}
            logger.error(f"User creation error: {e}")
            return {'success': False, 'error': str(e)}

    def authenticate(self, username: str, password: str) -> dict:
        """Authenticate user credentials."""
        try:
            df = self.execute_query(
                """SELECT user_id, username, email, role, is_evaluator, password_hash
                   FROM users WHERE username = ?""",
                (username,)
            )

            if df.empty:
                return {'success': False, 'error': 'User not found'}

            user = df.iloc[0]
            if user['password_hash'] != self._hash_password(password):
                return {'success': False, 'error': 'Invalid password'}

            return {
                'success': True,
                'user': {
                    'user_id': user['user_id'],
                    'username': user['username'],
                    'email': user['email'],
                    'role': user['role'],
                    'is_evaluator': bool(user['is_evaluator'])
                }
            }
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return {'success': False, 'error': str(e)}

    def get_by_id(self, user_id: int) -> Optional[dict]:
        """Get user by ID."""
        df = self.execute_query(
            """SELECT user_id, username, email, role, is_evaluator
               FROM users WHERE user_id = ?""",
            (user_id,)
        )
        if df.empty:
            return None
        return df.iloc[0].to_dict()

    def get_by_username(self, username: str) -> Optional[dict]:
        """Get user by username."""
        df = self.execute_query(
            """SELECT user_id, username, email, role, is_evaluator
               FROM users WHERE username = ?""",
            (username,)
        )
        if df.empty:
            return None
        return df.iloc[0].to_dict()

    def get_evaluators(self) -> pd.DataFrame:
        """Get all evaluators."""
        return self.execute_query(
            "SELECT user_id, username, email, role FROM users WHERE is_evaluator = 1"
        )

    def update_role(self, user_id: int, role: str) -> bool:
        """Update user role."""
        return self.execute_write(
            "UPDATE users SET role = ? WHERE user_id = ?",
            (role, user_id)
        )

    def set_evaluator(self, user_id: int, is_evaluator: bool) -> bool:
        """Set evaluator status."""
        return self.execute_write(
            "UPDATE users SET is_evaluator = ? WHERE user_id = ?",
            (is_evaluator, user_id)
        )
