"""
Insights Repository - Insight data operations
"""
from typing import Optional
import pandas as pd
from data_access.base import BaseRepository
from utils.logger import get_logger

logger = get_logger(__name__)


class InsightsRepository(BaseRepository):
    """Repository for insight data operations."""

    def get_all(self) -> pd.DataFrame:
        """Get all insights."""
        return self.execute_query("SELECT * FROM insights")

    def get_by_id(self, insight_id: str) -> Optional[dict]:
        """Get single insight by ID."""
        df = self.execute_query(
            "SELECT * FROM insights WHERE insight_id = ?",
            (insight_id,)
        )
        if df.empty:
            return None
        return df.iloc[0].to_dict()

    def get_paginated(self, offset: int = 0, limit: int = 10) -> pd.DataFrame:
        """Get paginated insights."""
        return self.execute_query(
            "SELECT * FROM insights LIMIT ? OFFSET ?",
            (limit, offset)
        )

    def get_count(self) -> int:
        """Get total insight count."""
        df = self.execute_query("SELECT COUNT(*) as count FROM insights")
        return df.iloc[0]['count']

    def search(self, query: str, limit: int = 10) -> pd.DataFrame:
        """Search insights by description."""
        return self.execute_query(
            """SELECT * FROM insights
               WHERE description LIKE ?
               LIMIT ?""",
            (f"%{query}%", limit)
        )

    def get_by_therapeutic_area(self, area: str) -> pd.DataFrame:
        """Get insights by therapeutic area."""
        return self.execute_query(
            "SELECT * FROM insights WHERE therapeutic_area = ?",
            (area,)
        )

    def insert(self, insight_data: dict) -> bool:
        """Insert new insight."""
        return self.execute_write(
            """INSERT INTO insights
               (insight_id, therapeutic_area, disease_state, description)
               VALUES (?, ?, ?, ?)""",
            (
                insight_data['insight_id'],
                insight_data.get('therapeutic_area', ''),
                insight_data.get('disease_state', ''),
                insight_data.get('description', '')
            )
        )

    def insert_batch(self, insights: list) -> bool:
        """Insert multiple insights."""
        params = [
            (
                i['insight_id'],
                i.get('therapeutic_area', ''),
                i.get('disease_state', ''),
                i.get('description', '')
            )
            for i in insights
        ]
        return self.execute_many(
            """INSERT OR REPLACE INTO insights
               (insight_id, therapeutic_area, disease_state, description)
               VALUES (?, ?, ?, ?)""",
            params
        )
