# RAG (Retrieval-Augmented Generation) Documentation

## Medical Insights Engine - Technical Documentation

---

## Table of Contents

1. [What is RAG?](#what-is-rag)
2. [Why RAG?](#why-rag)
3. [Architecture Overview](#architecture-overview)
4. [Local Embeddings with TF-IDF](#local-embeddings-with-tf-idf)
5. [RAG Pipeline Flow](#rag-pipeline-flow)
6. [Implementation Details](#implementation-details)
7. [Code Walkthrough](#code-walkthrough)
8. [Use Cases in This Project](#use-cases-in-this-project)
9. [Benefits & Limitations](#benefits--limitations)

---

## What is RAG?

**RAG (Retrieval-Augmented Generation)** is an AI architecture pattern that enhances Large Language Model (LLM) responses by:

1. **Retrieving** relevant documents from a knowledge base
2. **Augmenting** the LLM prompt with this retrieved context
3. **Generating** a response grounded in actual data

```
┌─────────────────────────────────────────────────────────────────┐
│                        RAG WORKFLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User Query ──► Vector Search ──► Retrieved Docs ──► LLM ──► Response
│                       │                   │              │
│                       ▼                   ▼              ▼
│                  [TF-IDF Index]    [Context Window]  [Grounded Answer]
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Simple Analogy

Think of RAG like an **open-book exam**:
- **Without RAG**: The LLM answers from memory (may hallucinate)
- **With RAG**: The LLM first looks up relevant pages, then answers based on what it found

---

## Why RAG?

### Problems with Plain LLMs

| Problem | Description |
|---------|-------------|
| **Hallucination** | LLM invents facts that don't exist |
| **Outdated Knowledge** | Training data has a cutoff date |
| **No Domain Data** | LLM doesn't know your private data |
| **No Citations** | Can't verify where answers came from |

### How RAG Solves These

| Solution | How RAG Helps |
|----------|---------------|
| **Grounded Responses** | Answers based on actual retrieved documents |
| **Always Current** | Retrieves from live database |
| **Private Data Access** | Searches your indexed insights |
| **Source Attribution** | Shows which insights were used |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     MEDICAL INSIGHTS ENGINE - RAG ARCHITECTURE           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────┐ │
│  │   SQLite     │     │  TF-IDF      │     │    Azure OpenAI          │ │
│  │   Database   │────►│  Vector      │────►│    GPT-4                 │ │
│  │              │     │  Store       │     │                          │ │
│  │  - Insights  │     │              │     │  - Context + Query       │ │
│  │  - Tags      │     │  - Vectors   │     │  - Grounded Response     │ │
│  │  - Taxonomy  │     │  - Index     │     │                          │ │
│  └──────────────┘     └──────────────┘     └──────────────────────────┘ │
│         │                    │                        │                  │
│         │                    │                        │                  │
│         ▼                    ▼                        ▼                  │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                         RAG SERVICE                                  ││
│  │                                                                      ││
│  │   1. receive_query() ─► 2. retrieve_context() ─► 3. generate()      ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                    │                                     │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                         FRONTEND (React)                             ││
│  │                         Chat Interface                               ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Local Embeddings with TF-IDF

### Why TF-IDF Instead of Neural Embeddings?

| Approach | Pros | Cons |
|----------|------|------|
| **TF-IDF (Our Choice)** | Fast, no GPU needed, works offline, lightweight | Less semantic understanding |
| **OpenAI Embeddings** | Better semantic search | API costs, latency, requires internet |
| **Local Neural (BERT)** | Good semantics, offline | Heavy, needs GPU, slow |

### How TF-IDF Works

**TF-IDF = Term Frequency × Inverse Document Frequency**

```
TF(term) = (Number of times term appears in document) / (Total terms in document)

IDF(term) = log(Total documents / Documents containing term)

TF-IDF = TF × IDF
```

### Example

For the insight: *"Patient reported efficacy concerns about dosing frequency"*

| Term | TF | IDF | TF-IDF |
|------|-----|-----|--------|
| "efficacy" | 0.14 | 2.3 | 0.32 |
| "dosing" | 0.14 | 1.8 | 0.25 |
| "patient" | 0.14 | 0.5 | 0.07 |
| "the" | 0.0 | 0.0 | 0.0 |

**Result**: "efficacy" and "dosing" have high scores (important), "the" is ignored (common word).

### Vector Representation

Each insight becomes a vector of TF-IDF scores:

```
Insight 1: [0.32, 0.25, 0.07, 0.18, ...]  (5000 dimensions)
Insight 2: [0.15, 0.41, 0.09, 0.22, ...]
Insight 3: [0.28, 0.19, 0.33, 0.11, ...]
```

### Similarity Search

When a query comes in:
1. Convert query to TF-IDF vector
2. Calculate **cosine similarity** with all stored vectors
3. Return top-K most similar insights

```
Cosine Similarity = (A · B) / (||A|| × ||B||)

Range: 0 (no match) to 1 (perfect match)
```

---

## RAG Pipeline Flow

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          RAG PIPELINE FLOW                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  STEP 1: USER QUERY                                                      │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  "What are the main efficacy concerns for oncology drugs?"          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 2: RETRIEVAL (Vector Search)                                      │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Query ──► TF-IDF Vectorize ──► Cosine Similarity ──► Top 5 Matches │ │
│  │                                                                      │ │
│  │  Results:                                                            │ │
│  │    - INS-042: "KOL expressed concerns about efficacy..." (0.85)     │ │
│  │    - INS-089: "Oncology trial showed mixed efficacy..." (0.78)      │ │
│  │    - INS-156: "Efficacy data requested by investigator..." (0.72)   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 3: CONTEXT BUILDING                                               │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Format retrieved insights into structured context:                  │ │
│  │                                                                      │ │
│  │  "RELEVANT INSIGHTS FROM DATABASE:                                   │ │
│  │   --- Insight 1 (ID: INS-042, Relevance: 0.85) ---                  │ │
│  │   Description: KOL expressed concerns about efficacy...              │ │
│  │   Therapeutic Area: Oncology                                         │ │
│  │   Tags: Sentiment=Negative, Topic=Efficacy..."                       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 4: AUGMENTED GENERATION                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Send to LLM:                                                        │ │
│  │                                                                      │ │
│  │  System: "You are a medical insights analyst..."                     │ │
│  │  User: "Context: {retrieved_insights}                                │ │
│  │         Question: What are the main efficacy concerns...?"           │ │
│  │                                                                      │ │
│  │  LLM generates response based on provided context                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 5: RESPONSE WITH SOURCES                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  {                                                                   │ │
│  │    "answer": "Based on the insights, the main efficacy concerns...", │ │
│  │    "sources": [INS-042, INS-089, INS-156],                          │ │
│  │    "num_sources": 3                                                  │ │
│  │  }                                                                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### File Structure

```
capstone2req/
├── vector_store.py      # TF-IDF indexing and search
├── rag_service.py       # RAG pipeline orchestration
├── services/
│   ├── rag.py           # RAG service wrapper
│   └── search.py        # Search service wrapper
└── frontend/
    └── src/pages/RAG.jsx  # Chat UI
```

### Key Components

#### 1. Vector Store (`vector_store.py`)

```python
class VectorStore:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=5000,      # Top 5000 terms
            stop_words='english',   # Remove common words
            ngram_range=(1, 2),     # Unigrams + bigrams
            min_df=1,               # Minimum document frequency
            max_df=0.95             # Maximum document frequency
        )
    
    def add_insights_batch(self, insights):
        # Build TF-IDF matrix
        self.vectors = self.vectorizer.fit_transform(documents)
    
    def search(self, query, top_k=5):
        # Convert query to vector
        query_vector = self.vectorizer.transform([query])
        # Calculate similarities
        similarities = cosine_similarity(query_vector, self.vectors)
        # Return top matches
        return top_k_results
```

#### 2. RAG Service (`rag_service.py`)

```python
def rag_query(query: str, top_k: int = 5):
    # Step 1: Retrieve relevant insights
    retrieved = retrieve_relevant_insights(query, top_k)
    
    # Step 2: Build context
    context = build_context(retrieved)
    
    # Step 3: Generate response with LLM
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"}
        ]
    )
    
    return {
        "answer": response.choices[0].message.content,
        "sources": retrieved,
        "num_sources": len(retrieved)
    }
```

---

## Code Walkthrough

### Building the Index

```python
# 1. Load insights from database
insights_df = database.get_all_insights()

# 2. Prepare text for indexing
texts = []
for insight in insights_df:
    text = f"{insight['therapeutic_area']} {insight['disease_state']} {insight['description']}"
    texts.append(text)

# 3. Build TF-IDF index
vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
vectors = vectorizer.fit_transform(texts)

# 4. Save to disk (pickle)
pickle.dump(vectorizer, open('tfidf_vectorizer.pkl', 'wb'))
pickle.dump(vectors, open('tfidf_vectors.pkl', 'wb'))
```

### Searching the Index

```python
# 1. Load saved index
vectorizer = pickle.load(open('tfidf_vectorizer.pkl', 'rb'))
vectors = pickle.load(open('tfidf_vectors.pkl', 'rb'))

# 2. Convert query to vector
query = "efficacy concerns oncology"
query_vector = vectorizer.transform([query])

# 3. Calculate cosine similarity
from sklearn.metrics.pairwise import cosine_similarity
similarities = cosine_similarity(query_vector, vectors).flatten()

# 4. Get top 5 matches
top_indices = similarities.argsort()[-5:][::-1]
for idx in top_indices:
    print(f"Insight: {insight_ids[idx]}, Score: {similarities[idx]:.3f}")
```

### Full RAG Query

```python
def rag_query(user_question):
    # RETRIEVE
    similar_insights = vector_store.search(user_question, top_k=5)
    
    # BUILD CONTEXT
    context = "RELEVANT INSIGHTS:\n"
    for insight in similar_insights:
        context += f"- {insight['id']}: {insight['description']}\n"
    
    # GENERATE
    prompt = f"""
    Based on these insights:
    {context}
    
    Answer this question: {user_question}
    """
    
    response = openai_client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.choices[0].message.content
```

---

## Use Cases in This Project

### 1. Question Answering (Chat)

**User**: "What are the main safety concerns?"

**RAG Process**:
1. Search for insights mentioning "safety", "concerns", "adverse"
2. Retrieve top 5 relevant insights
3. Send to GPT-4 with context
4. Return grounded answer with citations

### 2. Topic Analysis

**User**: "Analyze dosing trends"

**RAG Process**:
1. Retrieve insights about dosing
2. Build comprehensive context
3. Ask LLM to identify patterns, themes, recommendations
4. Return structured analysis

### 3. Insight Comparison

**User**: Select insight INS-042

**RAG Process**:
1. Use insight's description as query
2. Find similar insights (excluding itself)
3. Ask LLM to compare and contrast
4. Return analysis of patterns and differences

### 4. Enhanced Tagging (Human-in-the-Loop)

**Process**:
1. When tagging new insight, retrieve similar tagged insights
2. Include them as examples in LLM prompt
3. LLM learns from examples for consistent tagging
4. Human corrections also retrieved for learning

---

## Benefits & Limitations

### Benefits

| Benefit | Description |
|---------|-------------|
| **Accuracy** | Responses grounded in actual data |
| **Transparency** | Sources shown for verification |
| **Privacy** | Data stays local (TF-IDF on your machine) |
| **Speed** | TF-IDF search is fast (<100ms) |
| **Cost** | No embedding API calls needed |
| **Offline** | Index works without internet |

### Limitations

| Limitation | Mitigation |
|------------|------------|
| TF-IDF less semantic | Use bigrams, good preprocessing |
| No synonym matching | Include domain terms in documents |
| Index rebuild needed | Rebuild after bulk imports |
| Context window limits | Truncate to top-K results |

---

## Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                         RAG IN A NUTSHELL                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   1. INDEX    → Build TF-IDF vectors from all insights              │
│   2. RETRIEVE → Find similar insights using cosine similarity        │
│   3. AUGMENT  → Add retrieved insights as context to LLM prompt     │
│   4. GENERATE → LLM produces grounded, accurate response            │
│   5. CITE     → Show which insights were used as sources            │
│                                                                      │
│   Result: AI answers based on YOUR data, not hallucinations         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Storage - Where Everything Lives

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATA STORAGE AT EACH STEP                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  DATABASE: medical_insights.db (SQLite)                                 │
│  ═══════════════════════════════════════                                │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  TABLE: insights                                                   │ │
│  │  ─────────────────                                                 │ │
│  │  - insight_id (PK)                                                 │ │
│  │  - therapeutic_area                                                │ │
│  │  - disease_state                                                   │ │
│  │  - description          ◄─── Source text for RAG indexing         │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                         │                                                │
│                         ▼                                                │
│  VECTOR INDEX: chroma_data/ (TF-IDF Pickle Files)                       │
│  ════════════════════════════════════════════════                       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  FILES:                                                            │ │
│  │  - tfidf_vectorizer.pkl  ◄─── Trained TF-IDF model                │ │
│  │  - tfidf_vectors.pkl     ◄─── Vector matrix (all insights)        │ │
│  │  - insight_ids.pkl       ◄─── Mapping: index → insight_id         │ │
│  │  - documents.pkl         ◄─── Original text for each vector       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                         │                                                │
│                         ▼                                                │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  TABLE: insight_tags                                               │ │
│  │  ───────────────────                                               │ │
│  │  - insight_id (FK)                                                 │ │
│  │  - sentiment, topic, stakeholder... (10 labels)                   │ │
│  │  - is_verified (0/1)    ◄─── Human verification status            │ │
│  │  - verified_by          ◄─── Who verified                         │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                         │                                                │
│                         ▼                                                │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  TABLE: tag_corrections    ◄─── HITL Learning Data                │ │
│  │  ────────────────────────                                          │ │
│  │  - insight_id           ◄─── Which insight was corrected          │ │
│  │  - field_name           ◄─── Which field (e.g., "topic")          │ │
│  │  - original_value       ◄─── What AI predicted                    │ │
│  │  - corrected_value      ◄─── What human corrected to              │ │
│  │  - corrected_by         ◄─── Who made correction                  │ │
│  │  - correction_reason    ◄─── Why (used for learning)              │ │
│  │  - corrected_at         ◄─── Timestamp                            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  LOGS: logs/app_YYYYMMDD.log                                            │
│  ═══════════════════════════                                            │
│  - All operations logged with timestamps                                │
│  - Debug info for troubleshooting                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Storage Summary Table

| Data | Storage Location | File/Table |
|------|------------------|------------|
| Raw Insights | SQLite | `insights` table |
| TF-IDF Model | Pickle | `chroma_data/tfidf_vectorizer.pkl` |
| Vector Matrix | Pickle | `chroma_data/tfidf_vectors.pkl` |
| Insight IDs | Pickle | `chroma_data/insight_ids.pkl` |
| AI Tags | SQLite | `insight_tags` table |
| Human Corrections | SQLite | `tag_corrections` table |
| Persona Summaries | SQLite | `persona_summaries` table |
| Users | SQLite | `users` table |
| Logs | File | `logs/app_YYYYMMDD.log` |

---

## Quick Reference

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rag/query` | POST | Ask a question |
| `/api/rag/summarize-topic` | POST | Analyze a topic |
| `/api/rag/compare` | POST | Compare insights |
| `/api/vector/build` | POST | Build/rebuild index |
| `/api/vector/search` | POST | Direct vector search |

### Key Files

| File | Purpose |
|------|---------|
| `vector_store.py` | TF-IDF indexing & search |
| `rag_service.py` | RAG pipeline |
| `config.py` | LLM settings per use case |

---

*Document Version: 1.0*
*Last Updated: September 2026*
*Project: Medical Insights Engine - Capstone*
