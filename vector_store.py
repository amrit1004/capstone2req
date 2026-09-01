"""
Vector Store for semantic search using ChromaDB
"""
import os
from pathlib import Path
import chromadb
from chromadb.config import Settings
import config
import llm_service
import database


class VectorStore:
    def __init__(self):
        # Ensure directory exists
        Path(config.CHROMA_PERSIST_DIR).mkdir(parents=True, exist_ok=True)

        # Initialize ChromaDB client with persistence
        self.client = chromadb.PersistentClient(
            path=config.CHROMA_PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False)
        )

        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name=config.CHROMA_COLLECTION_NAME,
            metadata={"description": "Medical insights embeddings"}
        )

    def add_insight(self, insight_id: str, text: str, metadata: dict = None):
        """Add a single insight to the collection."""
        embedding = llm_service.get_embedding(text)

        self.collection.add(
            ids=[insight_id],
            embeddings=[embedding],
            documents=[text],
            metadatas=[metadata or {}]
        )

    def add_insights_batch(self, insights: list):
        """
        Add multiple insights to the collection.
        insights: list of dicts with 'insight_id', 'text', and optional 'metadata' keys
        """
        if not insights:
            return

        ids = [i['insight_id'] for i in insights]
        texts = [i['text'] for i in insights]
        metadatas = [i.get('metadata', {}) for i in insights]

        # Get embeddings in batch
        embeddings = llm_service.get_embeddings_batch(texts)

        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas
        )

    def search(self, query: str, top_k: int = 5) -> list:
        """
        Search for similar insights.
        Returns list of dicts with insight_id, score, and document.
        """
        if self.collection.count() == 0:
            return []

        # Get query embedding
        query_embedding = llm_service.get_embedding(query)

        # Search
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, self.collection.count())
        )

        # Format results
        search_results = []
        if results and results['ids'] and results['ids'][0]:
            for i, insight_id in enumerate(results['ids'][0]):
                distance = results['distances'][0][i] if results['distances'] else 0
                # Convert distance to similarity score (ChromaDB uses L2 distance by default)
                # Lower distance = higher similarity
                score = 1 / (1 + distance)

                search_results.append({
                    'insight_id': insight_id,
                    'score': float(score),
                    'document': results['documents'][0][i] if results['documents'] else None
                })

        return search_results

    def get_index_size(self):
        """Get number of vectors in collection."""
        return self.collection.count()

    def clear_collection(self):
        """Clear all data from collection."""
        self.client.delete_collection(config.CHROMA_COLLECTION_NAME)
        self.collection = self.client.create_collection(
            name=config.CHROMA_COLLECTION_NAME,
            metadata={"description": "Medical insights embeddings"}
        )


def build_vector_store():
    """Build vector store from all insights in database."""
    store = VectorStore()

    # Clear existing data
    store.clear_collection()

    # Get all insights
    insights_df = database.get_all_insights()

    if insights_df.empty:
        print("No insights found in database")
        return store

    # Prepare batch data
    insights_batch = []
    for _, row in insights_df.iterrows():
        # Combine relevant fields for embedding
        text = f"{row['therapeutic_area']} - {row['disease_state']}: {row['description']}"
        insights_batch.append({
            'insight_id': row['insight_id'],
            'text': text,
            'metadata': {
                'therapeutic_area': row['therapeutic_area'],
                'disease_state': row['disease_state'],
                'country_code': row['country_code']
            }
        })

    print(f"Building vector store with {len(insights_batch)} insights...")

    # Add in batches to avoid rate limits
    batch_size = 10
    for i in range(0, len(insights_batch), batch_size):
        batch = insights_batch[i:i+batch_size]
        store.add_insights_batch(batch)
        print(f"Processed {min(i+batch_size, len(insights_batch))}/{len(insights_batch)}")

    print(f"Vector store built! Total documents: {store.get_index_size()}")
    return store


def get_vector_store():
    """Get existing vector store."""
    return VectorStore()


if __name__ == "__main__":
    # Build vector store
    build_vector_store()
