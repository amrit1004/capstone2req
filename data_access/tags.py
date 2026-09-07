"""
Tags Repository - Tag data operations
"""
from typing import Optional
import pandas as pd
from data_access.base import BaseRepository
from utils.logger import get_logger

logger = get_logger(__name__)


class TagsRepository(BaseRepository):
    """Repository for tag data operations."""

    def get_all(self) -> pd.DataFrame:
        """Get all tags."""
        return self.execute_query("SELECT * FROM insight_tags")

    def get_by_insight_id(self, insight_id: str) -> pd.DataFrame:
        """Get tags for specific insight."""
        return self.execute_query(
            "SELECT * FROM insight_tags WHERE insight_id = ?",
            (insight_id,)
        )

    def get_verified(self) -> pd.DataFrame:
        """Get all verified tags."""
        return self.execute_query(
            "SELECT * FROM insight_tags WHERE is_verified = 1"
        )

    def get_unverified(self) -> pd.DataFrame:
        """Get unverified tags for review."""
        return self.execute_query(
            "SELECT * FROM insight_tags WHERE is_verified = 0"
        )

    def save(self, insight_id: str, tags: dict) -> bool:
        """Save or update tags for an insight."""
        return self.execute_write(
            """INSERT OR REPLACE INTO insight_tags
               (insight_id, asset, sentiment, insight_type, topic,
                stakeholder, si_id, csf_id, source_channel,
                evidence_gap, action_required, confidence_score,
                reasoning, is_verified)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)""",
            (
                insight_id,
                tags.get('asset'),
                tags.get('sentiment'),
                tags.get('insight_type'),
                tags.get('topic'),
                tags.get('stakeholder'),
                tags.get('si_id'),
                tags.get('csf_id'),
                tags.get('source_channel'),
                tags.get('evidence_gap'),
                tags.get('action_required'),
                tags.get('confidence_score', 0),
                tags.get('reasoning', '')
            )
        )

    def verify(self, insight_id: str, verified_by: str) -> bool:
        """Mark tag as verified."""
        return self.execute_write(
            """UPDATE insight_tags
               SET is_verified = 1, verified_by = ?, verified_at = CURRENT_TIMESTAMP
               WHERE insight_id = ?""",
            (verified_by, insight_id)
        )

    def save_correction(
        self,
        insight_id: str,
        field_name: str,
        original_value: str,
        corrected_value: str,
        corrected_by: str,
        reason: str = ""
    ) -> bool:
        """Save a human correction."""
        return self.execute_write(
            """INSERT INTO tag_corrections
               (insight_id, field_name, original_value, corrected_value,
                corrected_by, correction_reason)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (insight_id, field_name, original_value, corrected_value,
             corrected_by, reason)
        )

    def get_corrections(self, limit: int = 50) -> pd.DataFrame:
        """Get recent corrections."""
        return self.execute_query(
            """SELECT tc.*, i.description
               FROM tag_corrections tc
               JOIN insights i ON tc.insight_id = i.insight_id
               ORDER BY tc.corrected_at DESC
               LIMIT ?""",
            (limit,)
        )

    def get_distribution(self, field: str) -> dict:
        """Get distribution counts for a tag field."""
        df = self.execute_query(
            f"SELECT {field}, COUNT(*) as count FROM insight_tags GROUP BY {field}"
        )
        return {row[field]: row['count'] for _, row in df.iterrows() if row[field]}
