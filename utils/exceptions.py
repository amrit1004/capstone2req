"""
Custom Exceptions for Medical Insights Engine

Provides structured error handling across the application.
"""


class AppException(Exception):
    """Base exception for all application errors."""

    def __init__(self, message: str, code: str = "APP_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class DatabaseException(AppException):
    """Database operation errors."""

    def __init__(self, message: str):
        super().__init__(message, "DB_ERROR")


class LLMException(AppException):
    """LLM/Azure OpenAI errors."""

    def __init__(self, message: str):
        super().__init__(message, "LLM_ERROR")


class ValidationException(AppException):
    """Input validation errors."""

    def __init__(self, message: str):
        super().__init__(message, "VALIDATION_ERROR")


class NotFoundException(AppException):
    """Resource not found errors."""

    def __init__(self, resource: str, identifier: str):
        message = f"{resource} not found: {identifier}"
        super().__init__(message, "NOT_FOUND")


class AuthenticationException(AppException):
    """Authentication errors."""

    def __init__(self, message: str = "Invalid credentials"):
        super().__init__(message, "AUTH_ERROR")


class AuthorizationException(AppException):
    """Authorization/permission errors."""

    def __init__(self, message: str = "Access denied"):
        super().__init__(message, "AUTHZ_ERROR")


class VectorStoreException(AppException):
    """Vector store/search errors."""

    def __init__(self, message: str):
        super().__init__(message, "VECTOR_ERROR")
