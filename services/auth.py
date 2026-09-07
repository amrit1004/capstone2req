"""
Auth Service - Authentication and authorization operations
"""
from typing import Optional
from utils.logger import get_logger
from utils.exceptions import AuthenticationException, ValidationException
from utils.constants import Roles

logger = get_logger(__name__)


class AuthService:
    """Service class for authentication operations."""

    VALID_ROLES = [Roles.CLINICIAN, Roles.MEDICAL_SCIENTIST, Roles.COMMERCIAL, Roles.ADMIN]

    def __init__(self):
        import database
        self._db = database

    def register(
        self,
        username: str,
        email: str,
        password: str,
        role: str = Roles.CLINICIAN,
        is_evaluator: bool = False
    ) -> dict:
        """
        Register a new user.

        Args:
            username: Unique username
            email: User email
            password: Password (will be hashed)
            role: User role (clinician, medical_scientist, commercial, admin)
            is_evaluator: Whether user can verify tags

        Returns:
            Dict with user_id and success status

        Raises:
            ValidationException: If validation fails
            AuthenticationException: If registration fails
        """
        if not username or len(username) < 3:
            raise ValidationException("Username must be at least 3 characters")

        if not email or '@' not in email:
            raise ValidationException("Invalid email address")

        if not password or len(password) < 6:
            raise ValidationException("Password must be at least 6 characters")

        if role not in self.VALID_ROLES:
            raise ValidationException(f"Invalid role. Must be one of: {self.VALID_ROLES}")

        result = self._db.register_user(
            username=username,
            email=email,
            password=password,
            role=role,
            is_evaluator=is_evaluator
        )

        if not result.get('success'):
            raise AuthenticationException(result.get('error', 'Registration failed'))

        logger.info(f"User registered: {username} ({role})")
        return result

    def login(self, username: str, password: str) -> dict:
        """
        Authenticate user.

        Args:
            username: Username
            password: Password

        Returns:
            Dict with user info if successful

        Raises:
            AuthenticationException: If login fails
        """
        if not username or not password:
            raise ValidationException("Username and password required")

        result = self._db.login_user(username, password)

        if not result.get('success'):
            raise AuthenticationException(result.get('error', 'Invalid credentials'))

        logger.info(f"User logged in: {username}")
        return result

    def get_user(self, user_id: int) -> Optional[dict]:
        """Get user by ID."""
        return self._db.get_user_by_id(user_id)

    def is_authorized(self, user_role: str, required_roles: list) -> bool:
        """Check if user role is in required roles."""
        if Roles.ADMIN in [user_role]:
            return True
        return user_role in required_roles
