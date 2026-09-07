"""
Tagging Service - Business logic for taxonomy tagging operations
"""
from typing import Optional, Callable
from utils.logger import get_logger
from utils.exceptions import LLMException, DatabaseException

logger = get_logger(__name__)


class TaggingService:
    """Service class for taxonomy tagging operations."""

    def __init__(self):
        import taxonomy_tagger
        import database
        self._tagger = taxonomy_tagger
        self._db = database

    def tag_single(self, insight_id: str, use_rag: bool = True) -> dict:
        """Tag a single insight with all 10 labels."""
        try:
            return self._tagger.tag_single_insight(insight_id, use_rag)
        except ValueError as e:
            raise DatabaseException(str(e))
        except Exception as e:
            logger.error(f"Tagging failed for {insight_id}: {e}")
            raise LLMException(f"Tagging failed: {e}")

    def tag_batch(
        self,
        progress_callback: Optional[Callable] = None,
        max_workers: int = 10,
        limit: Optional[int] = None,
        skip_tagged: bool = False
    ) -> dict:
        """Tag multiple insights with parallel processing."""
        return self._tagger.tag_all_insights(
            progress_callback=progress_callback,
            max_workers=max_workers,
            limit=limit,
            skip_tagged=skip_tagged
        )

    def get_summary(self) -> dict:
        """Get tagging statistics and distributions."""
        return self._tagger.get_tagging_summary()

    def get_label_options(self) -> dict:
        """Get valid options for each tag label."""
        return self._tagger.get_label_options()

    def get_tags(self, insight_id: Optional[str] = None) -> dict:
        """Get tags for a specific insight or all insights."""
        tags_df = self._db.get_insight_tags(insight_id)
        if tags_df.empty:
            return {}
        if insight_id:
            return tags_df.iloc[0].to_dict()
        return tags_df.to_dict('records')

    def verify_tag(self, insight_id: str, verified_by: str) -> bool:
        """Mark a tag as verified by human reviewer."""
        return self._db.verify_tag(insight_id, verified_by)

    def save_correction(
        self,
        insight_id: str,
        field_name: str,
        original_value: str,
        corrected_value: str,
        corrected_by: str,
        correction_reason: str = ""
    ) -> bool:
        """Save a human correction for learning."""
        return self._db.save_tag_correction(
            insight_id=insight_id,
            field_name=field_name,
            original_value=original_value,
            corrected_value=corrected_value,
            corrected_by=corrected_by,
            correction_reason=correction_reason
        )
