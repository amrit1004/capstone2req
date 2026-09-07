"""
Persona Service - Business logic for persona summary generation
"""
from typing import Optional, Callable
from utils.logger import get_logger
from utils.exceptions import LLMException, DatabaseException

logger = get_logger(__name__)


class PersonaService:
    """Service class for persona summary operations."""

    def __init__(self):
        import persona_generator
        import database
        self._generator = persona_generator
        self._db = database

    def generate_for_insight(self, insight_id: str, use_rag: bool = True) -> dict:
        """Generate all persona summaries for a single insight."""
        try:
            return self._generator.generate_summaries_for_insight(insight_id, use_rag)
        except Exception as e:
            logger.error(f"Persona generation failed for {insight_id}: {e}")
            raise LLMException(f"Generation failed: {e}")

    def generate_batch(
        self,
        progress_callback: Optional[Callable] = None,
        max_workers: int = 10,
        limit: Optional[int] = None,
        skip_generated: bool = False
    ) -> dict:
        """Generate summaries for multiple insights."""
        return self._generator.generate_all_summaries(
            progress_callback=progress_callback,
            max_workers=max_workers,
            limit=limit,
            skip_generated=skip_generated
        )

    def get_summaries(self, insight_id: str) -> dict:
        """Get stored summaries or generate if missing."""
        return self._generator.get_summaries_for_display(insight_id)

    def compare_summaries(self, insight_id: str) -> dict:
        """Get comparison view of all persona summaries."""
        return self._generator.compare_persona_summaries(insight_id)

    def get_all_summaries(self, persona_type: Optional[str] = None) -> list:
        """Get all summaries, optionally filtered by persona type."""
        summaries_df = self._db.get_persona_summaries()
        if summaries_df.empty:
            return []

        if persona_type:
            summaries_df = summaries_df[summaries_df['persona_type'] == persona_type]

        return summaries_df.to_dict('records')
