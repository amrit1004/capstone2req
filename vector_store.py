"""
Vector Store for semantic search using TF-IDF (scikit-learn)
Lightweight - no PyTorch needed!
"""
import os
import pickle
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import config
import database


class VectorStore:
    def __init__(self):
        # Ensure directory exists
        Path(config.CHROMA_PERSIST_DIR).mkdir(parents=True, exist_ok=True)

        self.vectorizer_path = os.path.join(config.CHROMA_PERSIST_DIR, "tfidf_vectorizer.pkl")
        self.vectors_path = os.path.join(config.CHROMA_PERSIST_DIR, "tfidf_vectors.pkl")
        self.ids_path = os.path.join(config.CHROMA_PERSIST_DIR, "insight_ids.pkl")
        self.docs_path = os.path.join(config.CHROMA_PERSIST_DIR, "documents.pkl")

        self.vectorizer = None
        self.vectors = None
        self.insight_ids = []
        self.documents = []

        # Try to load existing index
        self._load_index()

    def _load_index(self):
        """Load existing index from disk."""
        try:
            if all(os.path.exists(p) for p in [self.vectorizer_path, self.vectors_path, self.ids_path, self.docs_path]):
                with open(self.vectorizer_path, 'rb') as f:
                    self.vectorizer = pickle.load(f)
                with open(self.vectors_path, 'rb') as f:
                    self.vectors = pickle.load(f)
                with open(self.ids_path, 'rb') as f:
                    self.insight_ids = pickle.load(f)
                with open(self.docs_path, 'rb') as f:
                    self.documents = pickle.load(f)
                print(f"Loaded existing index with {len(self.insight_ids)} documents")
        except Exception as e:
            print(f"No existing index found or error loading: {e}")
            self.vectorizer = None
            self.vectors = None
            self.insight_ids = []
            self.documents = []

    def _save_index(self):
        """Save index to disk."""
        try:
            with open(self.vectorizer_path, 'wb') as f:
                pickle.dump(self.vectorizer, f)
            with open(self.vectors_path, 'wb') as f:
                pickle.dump(self.vectors, f)
            with open(self.ids_path, 'wb') as f:
                pickle.dump(self.insight_ids, f)
            with open(self.docs_path, 'wb') as f:
                pickle.dump(self.documents, f)
            print("Index saved to disk")
        except Exception as e:
            print(f"Error saving index: {e}")
            raise

    def add_insights_batch(self, insights: list):
        """
        Add multiple insights and build TF-IDF index.
        insights: list of dicts with 'insight_id' and 'text' keys
        """
        if not insights:
            raise ValueError("No insights provided")

        self.insight_ids = [str(i['insight_id']) for i in insights]
        self.documents = [str(i['text']) for i in insights]

        print(f"Building TF-IDF index for {len(self.documents)} documents...")

        # Build TF-IDF vectorizer
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.95
        )

        # Fit and transform documents
        self.vectors = self.vectorizer.fit_transform(self.documents)
        print(f"TF-IDF matrix shape: {self.vectors.shape}")

        # Save to disk
        self._save_index()

    def search(self, query: str, top_k: int = 5) -> list:
        """
        Search for similar insights using TF-IDF cosine similarity.
        Returns list of dicts with insight_id, score, and document.
        """
        if self.vectorizer is None or self.vectors is None or len(self.insight_ids) == 0:
            return []

        # Transform query
        query_vector = self.vectorizer.transform([query])

        # Calculate cosine similarity
        similarities = cosine_similarity(query_vector, self.vectors).flatten()

        # Get top-k indices
        top_k = min(top_k, len(self.insight_ids))
        top_indices = similarities.argsort()[-top_k:][::-1]

        # Format results
        results = []
        for idx in top_indices:
            if similarities[idx] > 0:
                results.append({
                    'insight_id': self.insight_ids[idx],
                    'score': float(similarities[idx]),
                    'document': self.documents[idx][:500]  # Truncate for response
                })

        return results

    def get_index_size(self):
        """Get number of documents in index."""
        return len(self.insight_ids)

    def clear_collection(self):
        """Clear all data."""
        self.vectorizer = None
        self.vectors = None
        self.insight_ids = []
        self.documents = []

        # Delete files
        for path in [self.vectorizer_path, self.vectors_path, self.ids_path, self.docs_path]:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception as e:
                print(f"Error deleting {path}: {e}")


def build_vector_store():
    """Build vector store from all insights in database."""
    print("Starting vector store build...")

    store = VectorStore()

    # Clear existing data
    print("Clearing existing index...")
    store.clear_collection()

    # Get all insights
    print("Loading insights from database...")
    insights_df = database.get_all_insights()

    if insights_df.empty:
        raise ValueError("No insights found in database")

    print(f"Found {len(insights_df)} insights")

    # Prepare batch data
    insights_batch = []
    for _, row in insights_df.iterrows():
        # Combine relevant fields for search
        text_parts = []
        if row.get('therapeutic_area'):
            text_parts.append(str(row['therapeutic_area']))
        if row.get('disease_state'):
            text_parts.append(str(row['disease_state']))
        if row.get('description'):
            text_parts.append(str(row['description']))

        text = ' '.join(text_parts)

        if text.strip():
            insights_batch.append({
                'insight_id': row['insight_id'],
                'text': text
            })

    if not insights_batch:
        raise ValueError("No valid insights to index")

    print(f"Prepared {len(insights_batch)} insights for indexing...")

    # Build index
    store.add_insights_batch(insights_batch)

    print(f"Vector store built! Total documents: {store.get_index_size()}")
    return store


def get_vector_store():
    """Get existing vector store."""
    return VectorStore()


if __name__ == "__main__":
    build_vector_store()
