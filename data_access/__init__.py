"""
Data Access Layer - Database operations

This package provides structured access to database operations:
- insights: Insight CRUD operations
- tags: Tag operations
- users: User authentication data
- taxonomy: SI/CSF taxonomy data
"""

from data_access.insights import InsightsRepository
from data_access.tags import TagsRepository
from data_access.users import UsersRepository
from data_access.taxonomy import TaxonomyRepository

__all__ = [
    'InsightsRepository',
    'TagsRepository',
    'UsersRepository',
    'TaxonomyRepository'
]
