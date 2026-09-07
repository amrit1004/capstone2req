"""
Search Service - Vector search and indexing operations
"""
from utils.logger import get_logger
from utils.exceptions import DatabaseException

logger = get_logger(__name__)


class SearchService:
    """Service class for vector search operations."""

    def __init__(self):
        import vector_store
        self._store_module = vector_store
        self._store = None

    def _get_store(self):
        """Lazy load vector store."""
        if self._store is None:
            self._store = self._store_module.get_vector_store()
        return self._store

    def search(self, query: str, top_k: int = 5) -> list:
        """
        Search for similar insights.

        Args:
            query: Search query
            top_k: Number of results

        Returns:
            List of results with insight_id, score, document
        """
        store = self._get_store()
        return store.search(query, top_k)

    def build_index(self) -> dict:
        """
        Build/rebuild the vector index from database.

        Returns:
            Dict with index statistics
        """
        try:
            store = self._store_module.build_vector_store()
            self._store = store
            return {
                'status': 'success',
                'documents_indexed': store.get_index_size()
            }
        except Exception as e:
            logger.error(f"Index build failed: {e}")
            raise DatabaseException(f"Index build failed: {e}")

    def get_index_stats(self) -> dict:
        """Get index statistics."""
        store = self._get_store()
        return {
            'total_documents': store.get_index_size(),
            'index_loaded': store.vectorizer is not None
        }

    def clear_index(self) -> bool:
        """Clear the vector index."""
        store = self._get_store()
        store.clear_collection()
        self._store = None
        return True
