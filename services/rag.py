"""
RAG Service - Retrieval Augmented Generation operations
"""
from typing import Optional
from utils.logger import get_logger
from utils.exceptions import LLMException

logger = get_logger(__name__)


class RAGService:
    """Service class for RAG operations."""

    def __init__(self):
        import rag_service
        self._rag = rag_service

    def query(self, query: str, top_k: int = 5, system_prompt: Optional[str] = None) -> dict:
        """
        Full RAG pipeline: retrieve context and generate response.

        Args:
            query: User's question
            top_k: Number of insights to retrieve
            system_prompt: Optional custom system prompt

        Returns:
            Dict with answer, sources, and metadata
        """
        try:
            return self._rag.rag_query(query, top_k, system_prompt)
        except Exception as e:
            logger.error(f"RAG query failed: {e}")
            raise LLMException(f"RAG query failed: {e}")

    def summarize_topic(self, topic: str, top_k: int = 10) -> dict:
        """
        Summarize insights about a topic.

        Args:
            topic: Topic to analyze
            top_k: Number of insights to analyze

        Returns:
            Dict with summary, themes, and source IDs
        """
        try:
            return self._rag.rag_summarize_topic(topic, top_k)
        except Exception as e:
            logger.error(f"Topic summary failed: {e}")
            raise LLMException(f"Summary failed: {e}")

    def compare_insights(self, insight_id: str, top_k: int = 5) -> dict:
        """
        Find and compare similar insights.

        Args:
            insight_id: Source insight ID
            top_k: Number of similar insights to find

        Returns:
            Dict with similar insights and analysis
        """
        try:
            return self._rag.rag_compare_insights(insight_id, top_k)
        except Exception as e:
            logger.error(f"Insight comparison failed: {e}")
            raise LLMException(f"Comparison failed: {e}")

    def retrieve_context(self, query: str, top_k: int = 5) -> list:
        """
        Retrieve relevant insights without generation.

        Args:
            query: Search query
            top_k: Number of results

        Returns:
            List of relevant insight dictionaries
        """
        return self._rag.retrieve_relevant_insights(query, top_k)
